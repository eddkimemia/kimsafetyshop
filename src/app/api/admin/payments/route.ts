import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/api-helpers";
import { listOrders } from "@/lib/db";

export const dynamic = "force-dynamic";

export type PaymentRow = {
  id: string;
  order_id: string;
  customer: string;
  email: string;
  phone: string;
  /** "registered" when the order belongs to an account, else "guest". */
  customer_type: "registered" | "guest";
  user_id: string | null;
  method: string;
  method_label: string;
  /** Real gateway code only: M-Pesa TB… receipt or Paystack transaction ID. */
  reference: string | null;
  /** Interim gateway identifiers (never a substitute for the reference). */
  mpesa_checkout_id: string | null;
  paystack_init_reference: string | null;
  po_ref: string | null;
  amount: number;
  paid: number;
  status: string;
  created_at: string;
};

/**
 * Superadmin view of every payment transaction on the site.
 * GET /api/admin/payments → { payments: PaymentRow[] }
 */
export async function GET() {
  const denied = await requireSuperAdmin();
  if (denied) return denied;

  const orders = await listOrders();
  const payments: PaymentRow[] = orders.map((o) => ({
    id: o.id,
    order_id: o.id,
    customer: o.name,
    email: o.email,
    phone: o.phone,
    customer_type: o.user_id ? "registered" : "guest",
    user_id: o.user_id,
    method: o.payment,
    method_label:
      o.payment === "mpesa" ? "M-Pesa" : o.payment === "card" ? "Card (Paystack)" : o.payment === "po" ? "Purchase Order" : o.payment,
    // REAL gateway codes only (e.g. TB17CVOCY9) — no fallback to checkout ID / init reference.
    reference:
      o.payment === "mpesa"
        ? o.mpesa_transaction_id
        : o.payment === "card"
          ? o.paystack_transaction_id
          : o.payment === "po"
            ? o.po_ref
            : null,
    mpesa_checkout_id: o.mpesa_checkout_id,
    paystack_init_reference: o.paystack_reference,
    po_ref: o.po_ref,
    amount: o.total,
    paid: o.paid,
    status: o.status,
    created_at: o.created_at,
  }));

  return NextResponse.json({ payments });
}
