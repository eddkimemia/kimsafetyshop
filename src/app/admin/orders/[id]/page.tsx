"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, Gift, Mail, MapPin, Package, Phone, Receipt, Truck, User } from "lucide-react";
import { useFetch, AdminCard, StatusBadge, orderStatusTones } from "@/components/admin/ui";
import { formatKES } from "@/lib/utils";

type OrderItem = { productId: string; name: string; qty: number; price: number; image?: string | null };

type Order = {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string;
  address: string;
  items: OrderItem[];
  total: number;
  subtotal: number;
  discount: number;
  shipping: number;
  status: string;
  payment: string;
  paid: number;
  payment_phone?: string | null;
  mpesa_checkout_id?: string | null;
  mpesa_transaction_id?: string | null;
  paystack_reference?: string | null;
  paystack_transaction_id?: string | null;
  referrer_code?: string | null;
  created_at: string;
};

const statuses = ["Processing", "In transit", "Delivered", "Cancelled"];

const paymentLabel: Record<string, string> = {
  mpesa: "M-Pesa",
  card: "Card (Paystack)",
  po: "Purchase Order (30-day terms)",
};

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id ?? "");
  const { data, loading, refresh } = useFetch<{ order: Order }>(`/api/admin/orders?id=${encodeURIComponent(id)}`);
  const [notice, setNotice] = useState<string | null>(null);
  // Which dialog the txn-ref input serves: marking an unpaid order paid, or
  // adding/correcting the transaction ID on any order (auto-confirmed orders
  // can be paid WITHOUT a gateway reference — the STK-query fallback carries
  // no receipt number — so admins must be able to add it afterwards).
  const [dialog, setDialog] = useState<null | "mark-paid" | "edit-ref">(null);
  const [txnRef, setTxnRef] = useState("");
  const [marking, setMarking] = useState(false);

  const setStatus = async (status: string) => {
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const json = await res.json().catch(() => ({}));
    setNotice(res.ok ? `Order #${id} → ${status}` : json.error ?? "Update failed");
    refresh();
  };

  const confirmMarkPaid = async () => {
    // Blank is allowed ONLY when an M-Pesa checkout exists — the server then
    // fetches the transaction code from Daraja automatically. Otherwise a
    // typed reference is required so paid orders never show a blank one.
    const canAutoFetch = order?.payment === "mpesa" && Boolean(order?.mpesa_checkout_id);
    if (!canAutoFetch && order?.payment === "mpesa" && !txnRef.trim()) return;
    setMarking(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, paid: 1, txn_ref: txnRef.trim() || undefined }),
      });
      const json = await res.json().catch(() => ({}));
      setNotice(res.ok ? `Order #${id} marked as paid.` : json.error ?? "Update failed");
      setDialog(null);
      setTxnRef("");
      refresh();
    } finally {
      setMarking(false);
    }
  };

  // Reference-only update (order paid state untouched). The API already
  // supports PATCHing just the txn_ref; this is its UI.
  const saveRefOnly = async () => {
    if (!txnRef.trim()) return;
    setMarking(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, txn_ref: txnRef.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      setNotice(res.ok ? `Transaction ID saved for #${id}.` : json.error ?? "Update failed");
      setDialog(null);
      setTxnRef("");
      refresh();
    } finally {
      setMarking(false);
    }
  };

  const openEditRef = () => {
    if (!order) return;
    // Card orders edit the gateway's own transaction ID (falling back to the
    // initialization reference when the gateway ID hasn't been captured yet).
    setTxnRef((order.payment === "mpesa" ? order.mpesa_transaction_id : order.paystack_transaction_id || order.paystack_reference) ?? "");
    setDialog("edit-ref");
  };

  const order = data?.order;
  const itemCount = order?.items.reduce((n, i) => n + i.qty, 0) ?? 0;
  const dateStr = order
    ? new Date(order.created_at).toLocaleString("en-KE", { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" })
    : "";

  return (
    <div className="-mx-2 space-y-6 lg:-mx-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-gray-500 hover:text-navy-900"
            aria-label="Back to orders"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-navy-900">Order #{id}</h1>
            <p className="text-sm text-gray-500">{dateStr} · {itemCount} item{itemCount === 1 ? "" : "s"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/orders/${encodeURIComponent(id)}/delivery-note`}
            download={`delivery-note-${id}.pdf`}
            className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-bold text-navy-900 hover:bg-surface"
          >
            <Truck className="h-4 w-4" /> Delivery note
          </a>
          <a
            href={`/api/orders/${encodeURIComponent(id)}/invoice`}
            download={`invoice-${id}.pdf`}
            className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-bold text-navy-900 hover:bg-surface"
          >
            <Download className="h-4 w-4" /> Invoice
          </a>
          {order?.paid === 1 && (
            <a
              href={`/api/orders/${encodeURIComponent(id)}/receipt`}
              download={`receipt-${id}.pdf`}
              className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
            >
              <Receipt className="h-4 w-4" /> Receipt
            </a>
          )}
        </div>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-gray-400">Loading…</p>
      ) : !order ? (
        <AdminCard title="Order not found">
          <p className="py-6 text-center text-sm text-gray-400">No order matches #{id}.</p>
        </AdminCard>
      ) : (
        <>
          {notice && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">{notice}</p>}

          {dialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4" role="dialog" aria-modal="true">
              <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-xl">
                {dialog === "mark-paid" ? (
                  <>
                    <h3 className="font-display text-lg font-extrabold text-navy-900">Mark order #{id} as paid</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {order?.payment === "mpesa"
                        ? order?.mpesa_checkout_id
                          ? "The M-Pesa transaction code is fetched automatically from Safaricom when you confirm — leave blank to auto-fetch, or type it from the customer's confirmation SMS. It prints on the paid invoice and receipt."
                          : "Enter the M-Pesa transaction / receipt number from the confirmation SMS (e.g. QGH7XYZ1K2). It will be printed on the paid invoice and receipt."
                        : "Optionally enter the payment reference — it will be printed on the paid invoice and receipt."}
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="font-display text-lg font-extrabold text-navy-900">Transaction ID for #{id}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {order?.payment === "mpesa"
                        ? "Auto-confirmed M-Pesa payments can lack a receipt number (the status-query fallback carries none). Paste it here from the customer's confirmation SMS — it prints on the invoice and receipt."
                        : "Paste the Paystack transaction reference. It prints on the paid invoice and receipt. The gateway reference is filled automatically when a card payment verifies."}
                    </p>
                  </>
                )}
                <input
                  autoFocus
                  value={txnRef}
                  onChange={(e) => setTxnRef(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (dialog === "mark-paid" ? confirmMarkPaid : saveRefOnly)();
                    if (e.key === "Escape") setDialog(null);
                  }}
                  placeholder={order?.payment === "mpesa" ? "M-Pesa receipt number *" : "Payment reference"}
                  className="mt-4 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm outline-none transition-all focus:border-safety-400 focus:bg-white focus:ring-4 focus:ring-safety-500/10"
                />
                {order?.payment === "mpesa" && !txnRef.trim() && !order?.mpesa_checkout_id && (
                  <p className="mt-2 text-[11px] font-semibold text-danger">M-Pesa receipt number is required.</p>
                )}
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    onClick={() => setDialog(null)}
                    disabled={marking}
                    className="rounded-xl border border-line px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-navy-900 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={dialog === "mark-paid" ? confirmMarkPaid : saveRefOnly}
                    disabled={marking || (order?.payment === "mpesa" && !txnRef.trim() && !(dialog === "mark-paid" && order?.mpesa_checkout_id))}
                    className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {marking ? "Saving…" : dialog === "mark-paid" ? "Confirm payment" : "Save transaction ID"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <AdminCard title="Customer">
                <div className="space-y-3">
                  <p className="flex items-center gap-2.5 text-sm font-semibold text-navy-900">
                    <User className="h-4 w-4 text-gray-400" /> {order.name}
                    {order.user_id ? (
                      <span className="rounded-full bg-safety-50 px-2 py-0.5 text-[10px] font-bold text-safety-700">Registered account</span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">Guest checkout</span>
                    )}
                    {order.referrer_code && (
                      <span className="rounded-full bg-safety-50 px-2 py-0.5 text-[10px] font-bold text-safety-700" title="Referred via">
                        <Gift className="mr-0.5 inline h-3 w-3" /> Referred via {order.referrer_code}
                      </span>
                    )}
                  </p>
                  <p className="flex items-center gap-2.5 text-sm text-gray-600">
                    <Mail className="h-4 w-4 text-gray-400" /> {order.email}
                  </p>
                  <p className="flex items-center gap-2.5 text-sm text-gray-600">
                    <Phone className="h-4 w-4 text-gray-400" /> {order.phone}
                  </p>
                  <p className="flex items-start gap-2.5 text-sm text-gray-600">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" /> <span>{order.address}</span>
                  </p>
                </div>
              </AdminCard>

              <AdminCard
                title="Items ordered"
                subtitle={`${order.items.length} line${order.items.length === 1 ? "" : "s"} · ${itemCount} unit${itemCount === 1 ? "" : "s"} in total`}
              >
                <div className="space-y-3 md:hidden">
                  {order.items.map((i, idx) => (
                    <div key={`${i.productId}-${idx}`} className="flex items-start justify-between gap-3 rounded-xl border border-line bg-white p-4">
                      <div className="flex min-w-0 items-start gap-3">
                        {i.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={i.image} alt={i.name} className="h-12 w-12 shrink-0 rounded-lg border border-line object-cover" />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                            <Package className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-navy-900">{i.name}</p>
                          <p className="font-mono text-[11px] text-gray-400">{i.productId}</p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {i.qty} × {formatKES(i.price)}
                          </p>
                        </div>
                      </div>
                      <p className="shrink-0 font-bold text-navy-900">{formatKES(i.price * i.qty)}</p>
                    </div>
                  ))}
                </div>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[420px] text-sm">
                    <thead>
                      <tr className="border-b border-line text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        <th className="pb-2">Product</th>
                        <th className="pb-2 text-center">Qty</th>
                        <th className="pb-2 text-right">Unit price</th>
                        <th className="pb-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((i, idx) => (
                        <tr key={`${i.productId}-${idx}`} className="border-b border-line/60 last:border-0">
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              {i.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={i.image} alt={i.name} className="h-11 w-11 shrink-0 rounded-lg border border-line object-cover" />
                              ) : (
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                                  <Package className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-navy-900">{i.name}</p>
                                <p className="text-[11px] text-gray-400">{i.productId}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 text-center text-gray-500">{i.qty}</td>
                          <td className="py-3 text-right text-gray-500">{formatKES(i.price)}</td>
                          <td className="py-3 text-right font-bold text-navy-900">{formatKES(i.price * i.qty)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AdminCard>
            </div>

            <div className="space-y-6">
              <AdminCard title="Order summary">
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <dt>Subtotal (before discount)</dt>
                    <dd>{formatKES(order.subtotal + order.discount)}</dd>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <dt>Discount</dt>
                      <dd>-{formatKES(order.discount)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <dt>Shipping</dt>
                    <dd>{order.shipping === 0 ? "FREE" : formatKES(order.shipping)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-line pt-3 text-base font-extrabold text-navy-900">
                    <dt>Total</dt>
                    <dd>{formatKES(order.total)}</dd>
                  </div>
                </dl>
              </AdminCard>

              <AdminCard title="Payment">
                <div className="space-y-3 text-sm">
                  <p className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-gray-600">
                      <Receipt className="h-4 w-4 text-gray-400" /> Method
                    </span>
                    <span className="font-semibold capitalize text-navy-900">{paymentLabel[order.payment] ?? order.payment.replace("-", " ")}</span>
                  </p>
                  {order.payment === "mpesa" && order.payment_phone && (
                    <p className="flex items-center justify-between">
                      <span className="text-gray-600">M-Pesa number</span>
                      <span className="font-semibold text-navy-900">{order.payment_phone}</span>
                    </p>
                  )}
                  {(order.payment === "mpesa" || order.payment === "card") && (
                    <p className="flex items-center justify-between gap-2">
                      <span className="shrink-0 text-gray-600">
                        {order.payment === "mpesa" ? "Transaction code" : "Transaction ID"}
                      </span>
                      <span className="flex min-w-0 items-center gap-2">
                        <span className={`truncate font-mono text-xs ${order.mpesa_transaction_id || order.paystack_transaction_id || order.paystack_reference ? "font-bold text-navy-900" : "text-gray-300"}`}>
                          {(order.payment === "mpesa" ? order.mpesa_transaction_id : order.paystack_transaction_id || order.paystack_reference) || "— not set"}
                        </span>
                        <button
                          onClick={openEditRef}
                          className="shrink-0 rounded-lg border border-line px-2 py-1 text-[10px] font-bold text-navy-900 hover:border-safety-400 hover:text-safety-600"
                        >
                          {(order.payment === "mpesa" ? order.mpesa_transaction_id : order.paystack_transaction_id || order.paystack_reference) ? "Edit" : "Add"}
                        </button>
                      </span>
                    </p>
                  )}
                  <p className="flex items-center justify-between">
                    <span className="text-gray-600">Status</span>
                    {order.paid === 1 ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">Paid</span>
                    ) : (
                      <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-danger">Unpaid</span>
                    )}
                  </p>
                  {order.paid !== 1 && (
                    <button
                      onClick={() => {
                        // Pre-fill with any code the gateways already captured.
                        setTxnRef(order.payment === "mpesa" ? order.mpesa_transaction_id ?? "" : order.paystack_transaction_id || order.paystack_reference || "");
                        setDialog("mark-paid");
                      }}
                      className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
                    >
                      Mark as paid
                    </button>
                  )}
                </div>
              </AdminCard>

              <AdminCard title="Fulfilment">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Current status</span>
                    <StatusBadge status={order.status} map={orderStatusTones} />
                  </div>
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold text-gray-500">Update status</span>
                    <select
                      value={order.status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm font-bold text-navy-900 outline-none focus:border-safety-400"
                    >
                      {statuses.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </AdminCard>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
