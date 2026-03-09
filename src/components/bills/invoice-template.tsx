import { forwardRef } from "react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

interface SaleItem {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface Sale {
  _id: string;
  invoiceNumber: string;
  customer: { name: string; phone: string };
  items: SaleItem[];
  paymentMethod: string;
  subTotal: number;
  discount: number;
  grandTotal: number;
  totalProfit: number;
  createdBy: { name: string; email: string };
  createdAt: string;
}

interface InvoiceTemplateProps {
  sale: Sale;
}

const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(({ sale }, ref) => {
  const totalQty = sale.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div
      ref={ref}
      className="bg-white text-black font-sans p-8 max-w-[700px] mx-auto text-sm"
      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
      aria-label="invoice template"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">AutoParts Shop</h1>
          <p className="text-gray-600 text-xs mt-1">Auto Accessories & Car Accessories</p>
          <p className="text-gray-600 text-xs">Lahore, Pakistan</p>
          <p className="text-gray-600 text-xs">Tel: 03001234567</p>
          <p className="text-gray-600 text-xs">info@autoparts.pk</p>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-bold tracking-wider text-gray-800">INVOICE</h2>
          <div className="mt-2 text-xs text-gray-600 space-y-0.5">
            <p>Invoice Number: <span className="font-medium text-black">{sale.invoiceNumber}</span></p>
            <p>Date: <span className="font-medium text-black">{format(new Date(sale.createdAt), "dd-MM-yyyy HH:mm")}</span></p>
          </div>
        </div>
      </div>

      {/* Customer + Payment */}
      <div className="grid grid-cols-2 border border-gray-300 mb-4">
        <div className="p-3 border-r border-gray-300">
          <p className="font-bold text-xs uppercase text-gray-500 mb-1">Customer</p>
          <p className="font-semibold">{sale.customer.name} ( {sale.customer.phone} )</p>
        </div>
        <div className="p-3">
          <p className="font-bold text-xs uppercase text-gray-500 mb-1">Payment terms</p>
          <p className="font-semibold uppercase">{sale.paymentMethod === "cash" ? "CASH" : "ONLINE"}</p>
        </div>
      </div>

      {/* Items Table */}
      <table className="w-full border-collapse mb-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold w-8">#</th>
            <th className="border border-gray-300 px-2 py-2 text-left text-xs font-bold">SKU / Description</th>
            <th className="border border-gray-300 px-2 py-2 text-center text-xs font-bold w-16">QTY</th>
            <th className="border border-gray-300 px-2 py-2 text-right text-xs font-bold w-28">Unit Price</th>
            <th className="border border-gray-300 px-2 py-2 text-right text-xs font-bold w-28">Amount</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item, idx) => (
            <tr key={idx}>
              <td className="border border-gray-300 px-2 py-2 text-center text-xs">{idx + 1}</td>
              <td className="border border-gray-300 px-2 py-2">
                <p className="font-semibold text-xs">{item.sku} - {item.name.split(" ").slice(0, 8).join(" ")}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.name}</p>
              </td>
              <td className="border border-gray-300 px-2 py-2 text-center text-xs">{item.quantity}</td>
              <td className="border border-gray-300 px-2 py-2 text-right text-xs">{formatCurrency(item.unitPrice)}</td>
              <td className="border border-gray-300 px-2 py-2 text-right text-xs font-medium">{formatCurrency(item.amount)}</td>
            </tr>
          ))}
          <tr className="bg-gray-50">
            <td className="border border-gray-300 px-2 py-2" colSpan={2}></td>
            <td className="border border-gray-300 px-2 py-2 text-center font-bold text-xs">{totalQty}</td>
            <td className="border border-gray-300 px-2 py-2 text-right font-bold text-xs">Total Quantity</td>
            <td className="border border-gray-300 px-2 py-2"></td>
          </tr>
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-6">
        <div className="w-56 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Sub Total</span>
            <span className="font-medium">{formatCurrency(sale.subTotal)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Delivery</span>
            <span className="font-medium">0.00</span>
          </div>
          {sale.discount > 0 && (
            <div className="flex justify-between text-xs text-red-600">
              <span>Discount</span>
              <span>- {formatCurrency(sale.discount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-gray-300 pt-1">
            <span className="font-bold text-xs">Grand Total</span>
            <span className="font-bold text-sm">{formatCurrency(sale.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Payment status stamp */}
      <div className="flex justify-center mb-4">
        <div className="border-2 border-blue-500 rounded px-4 py-1 text-blue-500 font-bold text-sm rotate-[-3deg]">
          Bill Paid
        </div>
      </div>

      {/* Footer Notes */}
      <div className="border-t border-gray-300 pt-3 text-xs text-gray-500 space-y-1">
        <p>Note: 7 Days Money Back Guarantee for Un-used Products.</p>
        <p>In case of Return Courier Charges for Returns will be charged to Customer and Payment Refund into Bank Account after Product Received Back. Kindly Check Your order as per Invoice at the time of pickup.</p>
        <p>AutoParts Shop will not be responsible for any short Quantity.</p>
        <p>All Electronic Products are Checked Before Dispatched. There is No Warranty for Electronic Products.</p>
      </div>

      <div className="text-center text-xs text-gray-400 mt-4">
        Thank you for your business! — Served by: {sale.createdBy?.name}
      </div>
    </div>
  );
});

InvoiceTemplate.displayName = "InvoiceTemplate";

export default InvoiceTemplate;
