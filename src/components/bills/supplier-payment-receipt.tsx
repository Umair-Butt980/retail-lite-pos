import { forwardRef } from "react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

interface SupplierPayment {
  _id: string;
  amount: number;
  notes?: string;
  paidBy: { name: string };
  createdAt: string;
}

interface Supplier {
  _id: string;
  name: string;
  company: string;
  phone: string;
  email?: string;
  notes?: string;
  totalCredit: number;
  totalPaid: number;
  balance: number;
  createdAt: string;
}

interface SupplierPaymentReceiptProps {
  supplier: Supplier;
  payments: SupplierPayment[];
}

const shopName = process.env.NEXT_PUBLIC_SHOP_NAME ?? "AutoParts Shop";
const shopAddress = process.env.NEXT_PUBLIC_SHOP_ADDRESS ?? "";
const shopPhone = process.env.NEXT_PUBLIC_SHOP_PHONE ?? "";
const shopEmail = process.env.NEXT_PUBLIC_SHOP_EMAIL ?? "";

const SupplierPaymentReceipt = forwardRef<HTMLDivElement, SupplierPaymentReceiptProps>(
  ({ supplier, payments }, ref) => {
    const paidPercent =
      supplier.totalCredit > 0
        ? Math.round((supplier.totalPaid / supplier.totalCredit) * 100)
        : 100;

    // Build running balance for each payment row
    let runningBalance = supplier.totalCredit;
    const rows = payments.map((p) => {
      runningBalance -= p.amount;
      return { ...p, balanceAfter: runningBalance };
    });

    return (
      <div
        ref={ref}
        className="bg-white text-black font-sans p-8 max-w-[700px] mx-auto text-sm"
        style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
        aria-label="supplier payment receipt"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{shopName}</h1>
            <p className="text-gray-600 text-xs mt-1">Auto Accessories &amp; Car Accessories</p>
            {shopAddress && <p className="text-gray-600 text-xs">{shopAddress}</p>}
            {shopPhone && <p className="text-gray-600 text-xs">Tel: {shopPhone}</p>}
            {shopEmail && <p className="text-gray-600 text-xs">{shopEmail}</p>}
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold tracking-wider text-gray-800">PAYMENT RECEIPT</h2>
            <p className="text-xs text-gray-500 mt-1">Supplier Ledger Statement</p>
            <p className="text-xs text-gray-600 mt-1">
              Printed: <span className="font-medium text-black">{format(new Date(), "dd-MM-yyyy HH:mm")}</span>
            </p>
          </div>
        </div>

        {/* Supplier info */}
        <div className="grid grid-cols-2 border border-gray-300 mb-4">
          <div className="p-3 border-r border-gray-300">
            <p className="font-bold text-xs uppercase text-gray-500 mb-1">Supplier</p>
            <p className="font-semibold">{supplier.name}</p>
            <p className="text-xs text-gray-600">{supplier.company}</p>
            <p className="text-xs text-gray-600">Tel: {supplier.phone}</p>
            {supplier.email && <p className="text-xs text-gray-600">{supplier.email}</p>}
          </div>
          <div className="p-3">
            <p className="font-bold text-xs uppercase text-gray-500 mb-2">Account summary</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Total credit taken</span>
                <span className="font-medium">{formatCurrency(supplier.totalCredit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total paid</span>
                <span className="font-medium text-green-700">{formatCurrency(supplier.totalPaid)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
                <span className="font-bold">Outstanding balance</span>
                <span className={`font-bold ${supplier.balance <= 0 ? "text-green-700" : "text-orange-700"}`}>
                  {formatCurrency(supplier.balance)}
                </span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Payment progress</span>
                <span>{paidPercent}% cleared</span>
              </div>
            </div>
          </div>
        </div>

        {supplier.notes && (
          <p className="text-xs text-gray-500 italic mb-3">Note: {supplier.notes}</p>
        )}

        {/* Payment timeline table */}
        <p className="text-xs font-bold uppercase text-gray-500 mb-2 tracking-wide">
          Payment history ({payments.length} {payments.length === 1 ? "payment" : "payments"})
        </p>
        <table className="w-full border-collapse mb-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold w-8">#</th>
              <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">Date &amp; Time</th>
              <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">Notes</th>
              <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">Received by</th>
              <th className="border border-gray-300 px-2 py-2 text-right text-xs font-bold">Amount paid</th>
              <th className="border border-gray-300 px-2 py-2 text-right text-xs font-bold">Balance after</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((payment, idx) => (
              <tr key={payment._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="border border-gray-300 px-2 py-2 text-center text-xs">{idx + 1}</td>
                <td className="border border-gray-300 px-2 py-2 text-xs">
                  {format(new Date(payment.createdAt), "dd MMM yyyy")}
                  <br />
                  <span className="text-gray-500">{format(new Date(payment.createdAt), "HH:mm")}</span>
                </td>
                <td className="border border-gray-300 px-2 py-2 text-xs text-gray-600">
                  {payment.notes || "—"}
                </td>
                <td className="border border-gray-300 px-2 py-2 text-xs">
                  {payment.paidBy?.name ?? "—"}
                </td>
                <td className="border border-gray-300 px-2 py-2 text-right text-xs font-medium text-green-700">
                  {formatCurrency(payment.amount)}
                </td>
                <td className={`border border-gray-300 px-2 py-2 text-right text-xs font-bold ${payment.balanceAfter <= 0 ? "text-green-700" : "text-orange-700"}`}>
                  {formatCurrency(Math.max(payment.balanceAfter, 0))}
                </td>
              </tr>
            ))}
            {/* Totals row */}
            <tr className="bg-gray-100 font-bold">
              <td className="border border-gray-300 px-2 py-2 text-xs" colSpan={4}>Total paid</td>
              <td className="border border-gray-300 px-2 py-2 text-right text-xs text-green-700">
                {formatCurrency(supplier.totalPaid)}
              </td>
              <td className="border border-gray-300 px-2 py-2 text-right text-xs">
                <span className={supplier.balance <= 0 ? "text-green-700" : "text-orange-700"}>
                  {supplier.balance <= 0 ? "CLEARED" : formatCurrency(supplier.balance)}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Status banner */}
        {supplier.balance <= 0 && (
          <div className="border-2 border-green-500 rounded text-center py-2 mb-6">
            <p className="text-green-700 font-bold text-sm tracking-widest uppercase">
              ✓ Account fully cleared
            </p>
          </div>
        )}

        {/* Signature & Stamp */}
        <div className="grid grid-cols-2 gap-8 mb-6 mt-4">
          <div className="flex flex-col items-center">
            <div className="w-full h-16 border-b border-gray-400" />
            <p className="text-xs text-gray-500 mt-1 tracking-wide uppercase">Authorised signature</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-full h-16 border-b border-gray-400" />
            <p className="text-xs text-gray-500 mt-1 tracking-wide uppercase">Supplier acknowledgement</p>
          </div>
        </div>

        <div className="border-t border-gray-300 pt-3 text-xs text-gray-400 text-center">
          {shopName} — Supplier payment record generated on {format(new Date(), "dd MMM yyyy")}
        </div>
      </div>
    );
  }
);

SupplierPaymentReceipt.displayName = "SupplierPaymentReceipt";

export default SupplierPaymentReceipt;
