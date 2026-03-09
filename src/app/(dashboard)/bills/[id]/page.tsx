"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import { Printer, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import InvoiceTemplate from "@/components/bills/invoice-template";

interface Sale {
  _id: string;
  invoiceNumber: string;
  customer: { name: string; phone: string };
  items: {
    sku: string;
    name: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
  paymentMethod: string;
  subTotal: number;
  discount: number;
  grandTotal: number;
  totalProfit: number;
  createdBy: { name: string; email: string };
  createdAt: string;
}

export default function BillViewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/sales/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setSale(data);
      })
      .catch(() => setError("Failed to load bill"))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: sale ? `Invoice-${sale.invoiceNumber}` : "Invoice",
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading bill...
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-destructive">{error || "Bill not found"}</p>
        <Button variant="outline" onClick={() => router.back()} aria-label="go back button">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4" aria-label="bill view page">
      {/* Action bar */}
      <div className="flex items-center justify-between no-print">
        <Button variant="outline" size="sm" onClick={() => router.back()} aria-label="back to bills button">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <div className="flex gap-2">
          <Button onClick={() => handlePrint()} aria-label="print invoice button">
            <Printer className="mr-2 h-4 w-4" /> Print invoice
          </Button>
        </div>
      </div>

      {/* Invoice */}
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <InvoiceTemplate ref={printRef} sale={sale} />
      </div>
    </div>
  );
}
