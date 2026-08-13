import { NextResponse } from "next/server";
import { attachGuestOrdersToUser, createOrder, createNotification, getOrderById, ordersForUser, provisionUserLogin, subscribeNewsletter } from "@/lib/db";
import { getSessionUser } from "@/lib/api-helpers";
import { liveGetProduct } from "@/lib/catalog";
import { bulkUnitPrice, formatKES } from "@/lib/utils";
import { buildInvoicePdf } from "@/lib/invoice-pdf";
import { sendOrderInvoiceEmail, sendNewOrderAlert } from "@/lib/mailer";
import { getSetting } from "@/lib/db";
import { randomBytes } from "crypto";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const enrich = async (o: Awaited<ReturnType<typeof ordersForUser>>[number]) => ({
    ...o,
    items: await Promise.all(JSON.parse(o.items).map(async (i: { productId: string; qty: number }) => {
      const p = await liveGetProduct(i.productId);
      return {
        ...i,
        name: p?.name ?? i.productId,
        sku: p?.sku,
        price: p ? bulkUnitPrice(p, i.qty) : undefined,
        datasheetIndex: p?.downloads?.findIndex((d) => /datasheet/i.test(d.name || "")),
      };
    })),
  });
  if (id) {
    const order = await getOrderById(id);
    if (!order || order.user_id !== user.id) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ order: await enrich(order) });
  }
  const orders = await Promise.all((await ordersForUser(user.id)).map(enrich));
  return NextResponse.json({ orders });
}

type OrderItem = { productId: string; qty: number; price?: number };

async function computeTotals(items: OrderItem[]) {
  let subtotal = 0;
  let discount = 0;
  for (const item of items) {
    const qty = typeof item.qty === "number" && item.qty > 0 ? Math.floor(item.qty) : 0;
    if (qty === 0) continue;
    const p = await liveGetProduct(item.productId);
    if (!p) continue;
    const unit = bulkUnitPrice(p, qty);
    const old = p.oldPrice != null && p.oldPrice > p.price ? p.oldPrice : p.price;
    subtotal += unit * qty;
    discount += (old - unit) * qty;
  }
  const shipping = items.length === 0 || subtotal <= 0 ? 0 : subtotal >= 10000 ? 0 : 350;
  discount = Math.max(0, Math.round(discount));
  return { subtotal: Math.round(subtotal), discount, shipping, total: Math.round(subtotal) + shipping };
}

export async function POST(req: Request) {
  let body: { name?: string; email?: string; phone?: string; address?: string; items?: unknown[]; total?: number; payment?: string; po_ref?: string; company?: string; po_file?: string; momo?: string; delivery_fee?: boolean; marketing_opt_in?: boolean; guest_password?: string; referral_code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!body.name || !body.email || !body.phone || !body.address || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "Missing required order details" }, { status: 400 });
  }

  // Re-derive every total from the live (admin-overridden) catalog so the
  // discount is always counted correctly and the stored total can't be spoofed.
  const items = body.items as OrderItem[];
  const found = await Promise.all(items.map((i) => liveGetProduct(i.productId)));
  if (found.some((p) => !p)) {
    return NextResponse.json({ error: "One or more products could not be found" }, { status: 400 });
  }
  const totals = await computeTotals(items);
  const { subtotal, discount } = totals;
  let shipping = totals.shipping;
  let total = totals.total;

  // Staff (admin/superadmin) may waive the delivery fee when checking out —
  // e.g. when placing an order for a customer who picks up or has an account
  // rate. The waiver is only honoured for authenticated staff, never for the
  // public.
  const user = await getSessionUser();
  if (user && ["admin", "superadmin"].includes(user.role) && body.delivery_fee === false) {
    shipping = 0;
    total = subtotal;
  }

  const order = await createOrder({
    user_id: user?.id ?? null,
    name: body.name,
    email: body.email,
    phone: body.phone,
    address: body.address,
    items: JSON.stringify(items),
    total,
    subtotal,
    discount,
    shipping,
    payment: body.payment ?? "mpesa",
    po_ref: body.po_ref,
    company: body.company,
    po_file: body.po_file,
    // The M-Pesa number the STK push is sent to — may differ from the delivery phone.
    payment_phone: body.payment === "mpesa" ? body.momo : null,
    referrer_code: body.referral_code?.trim() || null,
    // One-time token returned to the client so it can start the payment and
    // check its status without needing a login (works for guest checkout too).
    payment_token: randomBytes(24).toString("hex"),
  });

  // Guest checkout extras — only for customers without an account:
  // 1. "Create an account" with a chosen password: provision the login and
  //    attach ALL previous guest orders (same email) so history is never lost.
  // 2. Marketing consent: add to the newsletter subscribers list.
  if (!user) {
    const guestPassword = body.guest_password?.trim();
    if (guestPassword) {
      if (guestPassword.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
      }
      try {
        const provision = await provisionUserLogin({
          name: body.name,
          email: body.email,
          phone: body.phone,
          company: body.company?.trim() || null,
          password: guestPassword,
        });
        await attachGuestOrdersToUser(provision.user_id, body.email);
      } catch (err) {
        console.error(`[orders] guest account creation failed for ${order.id}:`, (err as Error).message);
      }
    }
    if (body.marketing_opt_in) {
      try {
        await subscribeNewsletter({ email: body.email, name: body.name });
      } catch (err) {
        console.error(`[orders] newsletter subscribe failed for ${order.id}:`, (err as Error).message);
      }
    }
  }

  if (user) {
    await createNotification({
      user_id: user.id,
      type: "order",
      title: `Order ${order.id} confirmed`,
      message: `Your order of ${formatKES(total)} is being prepared.`,
      link: "/account/orders",
    });
  }

  // Email the invoice PDF to the customer. Best-effort: never fail the order
  // placement when SMTP is unavailable or the mail host rejects the message —
  // but DO log the reason so missing invoices are diagnosable. AWAITED so the
  // SMTP send completes before the serverless function returns (un-awaited
  // sends are frozen mid-flight on Vercel).
  if (order.email) {
    try {
      const pdf = await buildInvoicePdf(order);
      await sendOrderInvoiceEmail({
        to: order.email,
        orderId: order.id,
        orderTotal: order.total,
        pdf,
        name: order.name,
        phone: order.phone,
        address: order.address,
        company: order.company,
        items: order.items,
        payment: order.payment,
        paid: order.paid,
        status: order.status,
        created_at: order.created_at,
        payment_token: order.payment_token,
      });
    } catch (err) {
      console.error(`invoice email failed for ${order.id}:`, (err as Error).message);
    }
  }

  // Notify staff of the new order (sends to the "email" and "purchases_email"
  // settings; silently skipped when SMTP is not configured). Awaited so the
  // alerts actually leave the serverless function.
  try {
    const [email, purchasesEmail] = await Promise.all([getSetting("email"), getSetting("purchases_email")]);
    const alert = { orderId: order.id, orderTotal: order.total, customer: order.name, company: order.company, payment: order.payment };
    const targets = [email, purchasesEmail].filter(Boolean);
    for (const t of targets) {
      try {
        await sendNewOrderAlert({ to: t as string, ...alert });
      } catch {
        /* per-recipient failure is not fatal */
      }
    }
  } catch {
    /* settings lookup failure is not fatal */
  }

  return NextResponse.json({ order: { ...order, items: JSON.parse(order.items) } }, { status: 201 });
}
