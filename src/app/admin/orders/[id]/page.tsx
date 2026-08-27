"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, Gift, Mail, MapPin, Package, Phone, Receipt, Truck, User, Upload, FileText, CheckCircle2 } from "lucide-react";
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
  delivery_note_file?: string | null;
  kra_invoice_file?: string | null;
  delivered_by?: string | null;
  delivered_by_name?: string | null;
  delivered_at?: string | null;
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
  const [dialog, setDialog] = useState<null | "mark-paid" | "edit-ref">(null);
  const [txnRef, setTxnRef] = useState("");
  const [marking, setMarking] = useState(false);
  const [uploading, setUploading] = useState<"delivery_note" | "kra_invoice" | null>(null);

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
    setTxnRef((order.payment === "mpesa" ? order.mpesa_transaction_id : order.paystack_transaction_id) ?? "");
    setDialog("edit-ref");
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "delivery_note" | "kra_invoice") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) {
      setNotice("File too large (max 12MB)");
      return;
    }
    setUploading(type);
    setNotice(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("orderId", id);
      fd.append("type", type);
      const res = await fetch("/api/admin/orders/upload", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Upload failed");
      setNotice(`${type === "delivery_note" ? "Delivery note" : "KRA invoice"} uploaded — ${file.name} → PDF saved.`);
      refresh();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
      e.target.value = "";
    }
  };

  const order = data?.order;
  const itemCount = order?.items.reduce((n, i) => n + i.qty, 0) ?? 0;
  const dateStr = order
    ? new Date(order.created_at).toLocaleString("en-KE", { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" })
    : "";

  const mpesaAutoCaptured = order?.payment === "mpesa" && Boolean(order?.mpesa_transaction_id);
  const cardAutoCaptured = order?.payment === "card" && Boolean(order?.paystack_transaction_id);
  const canEditRef = !mpesaAutoCaptured && !cardAutoCaptured && (order?.payment === "mpesa" || order?.payment === "card");
  const needsDeliveryNote = order?.status !== "Delivered" && !order?.delivery_note_file;

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

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
        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/orders/${encodeURIComponent(id)}/delivery-note`}
            download={`delivery-note-${id}.pdf`}
            className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-bold text-navy-900 hover:bg-surface"
          >
            <Truck className="h-4 w-4" /> Delivery note (template)
          </a>
          {order?.delivery_note_file && (
            <button
              onClick={() => handleDownload(order.delivery_note_file!, `kimsafety-signed-delivery-${id}.pdf`)}
              className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
            >
              <FileText className="h-4 w-4" /> Signed delivery note
            </button>
          )}
          {order?.kra_invoice_file && (
            <button
              onClick={() => handleDownload(order.kra_invoice_file!, `kimsafety-kra-invoice-${id}.pdf`)}
              className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-xs font-bold text-navy-900 hover:bg-surface"
            >
              <Receipt className="h-4 w-4" /> KRA Invoice
            </button>
          )}
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
          {notice && <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700 border border-amber-200">{notice}</p>}

          {dialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/50 p-4" role="dialog" aria-modal="true">
              <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-xl">
                {dialog === "mark-paid" ? (
                  <>
                    <h3 className="font-display text-lg font-extrabold text-navy-900">Mark order #{id} as paid</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {order?.payment === "mpesa"
                        ? order?.mpesa_checkout_id
                          ? "The real M-Pesa transaction code (e.g. TB17CVOCY9) will be fetched automatically from Safaricom when you confirm — leave blank to auto-fetch, or paste it from the customer's confirmation SMS."
                          : "Enter the real M-Pesa transaction code from the confirmation SMS (e.g. TB17CVOCY9). It will be printed on the paid invoice and receipt."
                        : order?.payment === "card"
                          ? "Enter the real Paystack transaction ID (e.g. 1234567890 from Paystack dashboard — not the initialization reference like KS-...)."
                          : "Optionally enter the payment reference — it will be printed on the paid invoice and receipt."}
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="font-display text-lg font-extrabold text-navy-900">Transaction ID for #{id}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {order?.payment === "mpesa"
                        ? "Paste the real M-Pesa transaction code (e.g. TB17CVOCY9) — only for manually-paid orders without an auto-captured receipt."
                        : order?.payment === "card"
                          ? "Paste the real Paystack transaction ID — only for manually-paid orders."
                          : "Paste the payment reference."}
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
                  placeholder={
                    order?.payment === "mpesa"
                      ? "M-Pesa transaction code e.g. TB17CVOCY9 *"
                      : order?.payment === "card"
                        ? "Paystack transaction ID e.g. 1234567890 *"
                        : "Payment reference"
                  }
                  className="mt-4 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm outline-none transition-all focus:border-safety-400 focus:bg-white focus:ring-4 focus:ring-safety-500/10"
                />
                {order?.payment === "mpesa" && !txnRef.trim() && !order?.mpesa_checkout_id && (
                  <p className="mt-2 text-[11px] font-semibold text-danger">M-Pesa transaction code e.g. TB17CVOCY9 is required.</p>
                )}
                {order?.payment === "card" && !txnRef.trim() && (
                  <p className="mt-2 text-[11px] font-semibold text-danger">Paystack transaction ID is required.</p>
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
                    disabled={
                      marking ||
                      (order?.payment !== "po" && !txnRef.trim() && !(dialog === "mark-paid" && order?.payment === "mpesa" && order?.mpesa_checkout_id))
                    }
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
                        <span className={`truncate font-mono text-xs ${order.mpesa_transaction_id || order.paystack_transaction_id ? "font-bold text-navy-900" : "text-gray-300"}`}>
                          {(order.payment === "mpesa" ? order.mpesa_transaction_id : order.paystack_transaction_id) || "— not set"}
                        </span>
                        {canEditRef ? (
                          <button
                            onClick={openEditRef}
                            className="shrink-0 rounded-lg border border-line px-2 py-1 text-[10px] font-bold text-navy-900 hover:border-safety-400 hover:text-safety-600"
                          >
                            {(order.payment === "mpesa" ? order.mpesa_transaction_id : order.paystack_transaction_id) ? "Edit" : "Add"}
                          </button>
                        ) : (mpesaAutoCaptured || cardAutoCaptured) ? (
                          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700" title="Auto-captured from gateway — cannot be edited">auto-captured</span>
                        ) : null}
                      </span>
                    </p>
                  )}
                  {order.payment === "mpesa" && order.mpesa_checkout_id && (
                    <p className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="shrink-0 text-gray-400">Checkout ID</span>
                      <span className="truncate font-mono text-gray-500">{order.mpesa_checkout_id}</span>
                    </p>
                  )}
                  {mpesaAutoCaptured && (
                    <p className="text-[11px] text-emerald-600">M-Pesa receipt auto-captured via Daraja callback — editing disabled. Only manually-paid orders without a receipt can be set.</p>
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
                        setTxnRef((order.payment === "mpesa" ? order.mpesa_transaction_id : order.paystack_transaction_id) || "");
                        setDialog("mark-paid");
                      }}
                      className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
                    >
                      Mark as paid
                    </button>
                  )}
                </div>
              </AdminCard>

              <AdminCard title="Delivery documents">
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="mb-1 flex items-center gap-2 text-xs font-bold text-navy-900">
                      <Truck className="h-3.5 w-3.5 text-safety-600" /> Signed delivery note
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-danger">Required before Delivered</span>
                    </p>
                    <p className="text-[11px] text-gray-500">Upload the customer&apos;s signed delivery note. Images (JPG/PNG/WEBP) are auto-converted to PDF.</p>
                    {order.delivery_note_file ? (
                      <button onClick={() => handleDownload(order.delivery_note_file!, `kimsafety-signed-delivery-${id}.pdf`)} className="mt-2 flex w-full items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-left">
                        <CheckCircle2 className="h-4 w-4" /> Signed delivery note <Download className="h-3.5 w-3.5 ml-auto" />
                      </button>
                    ) : (
                      <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 border border-amber-200">No delivery note uploaded yet — required to mark Delivered.</p>
                    )}
                    <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-surface px-3 py-2.5 text-xs font-bold text-navy-900 hover:border-safety-400 hover:text-safety-600">
                      <Upload className="h-4 w-4" />
                      {uploading === "delivery_note" ? "Uploading…" : order.delivery_note_file ? "Replace delivery note (PDF/image)" : "Upload delivery note (PDF or image)"}
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="sr-only" onChange={(e) => handleUpload(e, "delivery_note")} disabled={uploading !== null} />
                    </label>
                  </div>
                  <div className="border-t border-line pt-4">
                    <p className="mb-1 flex items-center gap-2 text-xs font-bold text-navy-900">
                      <Receipt className="h-3.5 w-3.5 text-safety-600" /> KRA invoice (optional)
                    </p>
                    <p className="text-[11px] text-gray-500">Optional KRA-compliant invoice PDF for this order.</p>
                    {order.kra_invoice_file ? (
                      <button onClick={() => handleDownload(order.kra_invoice_file!, `kimsafety-kra-invoice-${id}.pdf`)} className="mt-2 flex w-full items-center gap-2 rounded-lg bg-surface px-3 py-2 text-xs font-bold text-navy-900 border border-line hover:bg-white text-left">
                        <FileText className="h-4 w-4 text-safety-600" /> KRA Invoice <Download className="h-3.5 w-3.5 ml-auto" />
                      </button>
                    ) : (
                      <p className="mt-2 text-[11px] text-gray-400">No KRA invoice uploaded.</p>
                    )}
                    <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line bg-surface px-3 py-2.5 text-xs font-bold text-navy-900 hover:border-safety-400 hover:text-safety-600">
                      <Upload className="h-4 w-4" />
                      {uploading === "kra_invoice" ? "Uploading…" : order.kra_invoice_file ? "Replace KRA invoice" : "Upload KRA invoice (PDF)"}
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="sr-only" onChange={(e) => handleUpload(e, "kra_invoice")} disabled={uploading !== null} />
                    </label>
                  </div>
                </div>
              </AdminCard>

              <AdminCard title="Fulfilment">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Current status</span>
                    <StatusBadge status={order.status} map={orderStatusTones} />
                  </div>
                  {order.delivered_by_name && (
                    <p className="rounded-lg bg-surface px-3 py-2 text-xs text-gray-600">
                      Delivered by <span className="font-bold text-navy-900">{order.delivered_by_name}</span>
                      {order.delivered_at ? ` · ${new Date(order.delivered_at).toLocaleString("en-KE")}` : ""}
                    </p>
                  )}
                  {needsDeliveryNote && (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-700 border border-amber-200">Upload the signed delivery note above before marking as Delivered.</p>
                  )}
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
                  <p className="text-[11px] text-gray-400">Delivered requires a signed delivery note. KRA invoice is optional.</p>
                </div>
              </AdminCard>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
