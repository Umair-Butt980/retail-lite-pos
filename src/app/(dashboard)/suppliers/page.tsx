"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { format } from "date-fns";
import { useReactToPrint } from "react-to-print";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  Wallet,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  CheckCircle2,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import SupplierPaymentReceipt from "@/components/bills/supplier-payment-receipt";

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

interface SupplierPayment {
  _id: string;
  amount: number;
  notes?: string;
  paidBy: { name: string };
  createdAt: string;
}

interface SupplierDetail {
  supplier: Supplier;
  payments: SupplierPayment[];
}

const emptySupplierForm = {
  name: "",
  company: "",
  phone: "",
  email: "",
  notes: "",
  totalCredit: "",
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Add/Edit supplier dialog
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState(emptySupplierForm);
  const [supplierErrors, setSupplierErrors] = useState<Partial<Record<keyof typeof emptySupplierForm, string>>>({});
  const [savingSupplier, setSavingSupplier] = useState(false);

  function validateSupplier() {
    const e: Partial<Record<keyof typeof emptySupplierForm, string>> = {};
    if (!supplierForm.name.trim())    e.name    = "Supplier name is required";
    if (!supplierForm.company.trim()) e.company = "Company is required";
    if (!supplierForm.phone.trim())   e.phone   = "Phone number is required";
    if (!editSupplier) {
      if (!supplierForm.totalCredit)             e.totalCredit = "Credit amount is required";
      else if (Number(supplierForm.totalCredit) <= 0) e.totalCredit = "Credit amount must be greater than 0";
    }
    setSupplierErrors(e);
    return Object.keys(e).length === 0;
  }

  function supplierField<K extends keyof typeof emptySupplierForm>(key: K, value: string) {
    setSupplierForm((f) => ({ ...f, [key]: value }));
    if (supplierErrors[key]) setSupplierErrors((e) => ({ ...e, [key]: undefined }));
  }

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Payment dialog
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [payingSupplier, setPayingSupplier] = useState<Supplier | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);

  // Expanded payment history
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [supplierDetail, setSupplierDetail] = useState<Record<string, SupplierDetail>>({});
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);

  // Print receipt
  const printRef = useRef<HTMLDivElement>(null);
  const [printingSupplier, setPrintingSupplier] = useState<string | null>(null);
  const handlePrint = useReactToPrint({ contentRef: printRef });

  function printReceipt(supplierId: string) {
    setPrintingSupplier(supplierId);
    // Wait one tick for the hidden receipt to render before printing
    setTimeout(() => handlePrint(), 50);
  }

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ search });
    const res = await fetch(`/api/suppliers?${params}`);
    const data = await res.json();
    setSuppliers(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchSuppliers, 300);
    return () => clearTimeout(timer);
  }, [fetchSuppliers]);

  async function toggleExpand(supplierId: string) {
    if (expandedId === supplierId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(supplierId);
    if (supplierDetail[supplierId]) return;

    setLoadingDetail(supplierId);
    try {
      const res = await fetch(`/api/suppliers/${supplierId}`);
      const data = await res.json();
      setSupplierDetail((prev) => ({ ...prev, [supplierId]: data }));
    } catch {
      toast.error("Failed to load payment history");
    } finally {
      setLoadingDetail(null);
    }
  }

  function openAddSupplier() {
    setEditSupplier(null);
    setSupplierErrors({});
    setSupplierForm(emptySupplierForm);
    setSupplierDialogOpen(true);
  }

  function openEditSupplier(supplier: Supplier) {
    setEditSupplier(supplier);
    setSupplierErrors({});
    setSupplierForm({
      name: supplier.name,
      company: supplier.company,
      phone: supplier.phone,
      email: supplier.email ?? "",
      notes: supplier.notes ?? "",
      totalCredit: String(supplier.totalCredit),
    });
    setSupplierDialogOpen(true);
  }

  async function handleSaveSupplier() {
    if (!validateSupplier()) return;
    setSavingSupplier(true);
    try {
      const payload = {
        ...supplierForm,
        totalCredit: Number(supplierForm.totalCredit),
      };

      const res = editSupplier
        ? await fetch(`/api/suppliers/${editSupplier._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/suppliers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save supplier");
      } else {
        toast.success(editSupplier ? "Supplier updated" : "Supplier added");
        setSupplierDialogOpen(false);
        setSupplierDetail((prev) => {
          const copy = { ...prev };
          if (editSupplier) delete copy[editSupplier._id];
          return copy;
        });
        fetchSuppliers();
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSavingSupplier(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Supplier deleted");
        fetchSuppliers();
      } else {
        toast.error("Failed to delete supplier");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleteId(null);
    }
  }

  function openPaymentDialog(supplier: Supplier) {
    setPayingSupplier(supplier);
    setPaymentAmount("");
    setPaymentNotes("");
    setPaymentDialogOpen(true);
  }

  async function handleRecordPayment() {
    if (!payingSupplier) return;
    setSavingPayment(true);
    try {
      const res = await fetch(`/api/suppliers/${payingSupplier._id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(paymentAmount), notes: paymentNotes }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to record payment");
      } else {
        toast.success(`Payment of ${formatCurrency(Number(paymentAmount))} recorded`);
        setPaymentDialogOpen(false);
        // Refresh supplier list and clear cached detail so it reloads
        setSupplierDetail((prev) => {
          const copy = { ...prev };
          delete copy[payingSupplier._id];
          return copy;
        });
        fetchSuppliers();
        // Re-expand to show new payment
        setExpandedId(payingSupplier._id);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSavingPayment(false);
    }
  }

  const totalCredit = suppliers.reduce((s, sup) => s + sup.totalCredit, 0);
  const totalPaid = suppliers.reduce((s, sup) => s + sup.totalPaid, 0);
  const totalBalance = suppliers.reduce((s, sup) => s + sup.balance, 0);

  return (
    <div className="space-y-6" aria-label="suppliers page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Suppliers</h2>
          <p className="text-muted-foreground text-sm">
            Track wholesale creditors and manage daily payments
          </p>
        </div>
        <Button onClick={openAddSupplier} aria-label="add new supplier button">
          <Plus className="h-4 w-4 mr-2" /> Add supplier
        </Button>
      </div>

      {/* Summary cards */}
      {suppliers.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card aria-label="total credit card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total credit taken</CardTitle>
              <CircleDollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(totalCredit)}</p>
              <p className="text-xs text-muted-foreground mt-1">Across {suppliers.length} suppliers</p>
            </CardContent>
          </Card>
          <Card aria-label="total paid card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total paid</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
              <p className="text-xs text-muted-foreground mt-1">Payments made so far</p>
            </CardContent>
          </Card>
          <Card aria-label="outstanding balance card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding balance</CardTitle>
              <Wallet className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${totalBalance > 0 ? "text-orange-600" : "text-green-600"}`}>
                {formatCurrency(totalBalance)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {totalBalance <= 0 ? "All cleared!" : "Still to be paid"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, company, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              aria-label="search suppliers input"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading suppliers...
            </div>
          ) : suppliers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2 text-sm">
              <Wallet className="h-8 w-8 opacity-40" />
              <p>No suppliers yet</p>
              <Button size="sm" onClick={openAddSupplier} aria-label="add first supplier button">
                Add first supplier
              </Button>
            </div>
          ) : (
            <Table aria-label="suppliers table">
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Total credit</TableHead>
                  <TableHead className="text-right">Total paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => {
                  const isExpanded = expandedId === supplier._id;
                  const paidPercent =
                    supplier.totalCredit > 0
                      ? Math.round((supplier.totalPaid / supplier.totalCredit) * 100)
                      : 100;
                  const detail = supplierDetail[supplier._id];

                  return (
                    <>
                      <TableRow
                        key={supplier._id}
                        className="cursor-pointer"
                        onClick={() => toggleExpand(supplier._id)}
                      >
                        <TableCell>
                          <div>
                            <p className="font-semibold text-sm">{supplier.name}</p>
                            <p className="text-xs text-muted-foreground">{supplier.company}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{supplier.phone}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(supplier.totalCredit)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {formatCurrency(supplier.totalPaid)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`font-bold ${
                              supplier.balance <= 0 ? "text-green-600" : "text-orange-600"
                            }`}
                          >
                            {formatCurrency(supplier.balance)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {supplier.balance <= 0 ? (
                            <Badge variant="secondary" className="text-green-700 bg-green-100 border-green-200 text-xs">
                              Cleared
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-orange-700 border-orange-300 text-xs">
                              {paidPercent}% paid
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div
                            className="flex items-center justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {supplier.balance > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7"
                                onClick={() => openPaymentDialog(supplier)}
                                aria-label={`record payment for ${supplier.name}`}
                              >
                                <CircleDollarSign className="h-3 w-3 mr-1" /> Pay
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditSupplier(supplier)}
                              aria-label={`edit supplier ${supplier.name}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(supplier._id)}
                              aria-label={`delete supplier ${supplier.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expanded payment history */}
                      {isExpanded && (
                        <TableRow key={`${supplier._id}-detail`} className="bg-muted/30">
                          <TableCell colSpan={7} className="p-0">
                            <div className="px-6 py-4">
                              {/* Progress bar */}
                              <div className="mb-4">
                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                  <span>Payment progress</span>
                                  <span>{paidPercent}% of {formatCurrency(supplier.totalCredit)}</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-green-500 transition-all"
                                    style={{ width: `${Math.min(paidPercent, 100)}%` }}
                                  />
                                </div>
                              </div>

                              {supplier.notes && (
                                <p className="text-xs text-muted-foreground mb-3 italic">
                                  Note: {supplier.notes}
                                </p>
                              )}

                              <Separator className="mb-3" />
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase">
                                  Payment history
                                </p>
                                {detail?.payments?.length > 0 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-7 gap-1"
                                    onClick={(e) => { e.stopPropagation(); printReceipt(supplier._id); }}
                                    aria-label={`print payment receipt for ${supplier.name}`}
                                  >
                                    <Printer className="h-3 w-3" /> Print receipt
                                  </Button>
                                )}
                              </div>

                              {loadingDetail === supplier._id ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                                  <Loader2 className="h-3 w-3 animate-spin" /> Loading...
                                </div>
                              ) : !detail?.payments?.length ? (
                                <p className="text-sm text-muted-foreground py-2">No payments recorded yet</p>
                              ) : (
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                  {detail.payments.map((payment) => (
                                    <div
                                      key={payment._id}
                                      className="flex items-center justify-between bg-background rounded-md px-3 py-2 border text-sm"
                                    >
                                      <div>
                                        <p className="font-medium text-green-600">
                                          + {formatCurrency(payment.amount)}
                                        </p>
                                        {payment.notes && (
                                          <p className="text-xs text-muted-foreground">{payment.notes}</p>
                                        )}
                                      </div>
                                      <div className="text-right">
                                        <p className="text-xs text-muted-foreground">
                                          {format(new Date(payment.createdAt), "dd MMM yyyy, HH:mm")}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          by {payment.paidBy?.name}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Supplier Sheet */}
      <Sheet open={supplierDialogOpen} onOpenChange={(o) => { setSupplierDialogOpen(o); if (!o) setSupplierErrors({}); }}>
        <SheetContent aria-label={editSupplier ? "edit supplier sheet" : "add supplier sheet"}>
          <SheetHeader>
            <SheetTitle>{editSupplier ? "Edit supplier" : "Add supplier"}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 grid gap-3 content-start">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sName">Supplier name *</Label>
                <Input
                  id="sName"
                  placeholder="Ali Raza"
                  value={supplierForm.name}
                  onChange={(e) => supplierField("name", e.target.value)}
                  className={supplierErrors.name ? "border-destructive" : ""}
                  aria-label="supplier name input"
                />
                {supplierErrors.name && <p className="text-xs text-destructive">{supplierErrors.name}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sCompany">Company *</Label>
                <Input
                  id="sCompany"
                  placeholder="ATS Traders"
                  value={supplierForm.company}
                  onChange={(e) => supplierField("company", e.target.value)}
                  className={supplierErrors.company ? "border-destructive" : ""}
                  aria-label="supplier company input"
                />
                {supplierErrors.company && <p className="text-xs text-destructive">{supplierErrors.company}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sPhone">Phone *</Label>
                <Input
                  id="sPhone"
                  placeholder="03001234567"
                  value={supplierForm.phone}
                  onChange={(e) => supplierField("phone", e.target.value)}
                  className={supplierErrors.phone ? "border-destructive" : ""}
                  aria-label="supplier phone input"
                />
                {supplierErrors.phone && <p className="text-xs text-destructive">{supplierErrors.phone}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sEmail">Email</Label>
                <Input
                  id="sEmail"
                  placeholder="supplier@example.com"
                  value={supplierForm.email}
                  onChange={(e) => supplierField("email", e.target.value)}
                  aria-label="supplier email input"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sCredit">Total credit amount (Rs.) *</Label>
              <Input
                id="sCredit"
                type="number"
                placeholder="50000"
                value={supplierForm.totalCredit}
                onChange={(e) => supplierField("totalCredit", e.target.value)}
                disabled={!!editSupplier}
                className={supplierErrors.totalCredit ? "border-destructive" : ""}
                aria-label="total credit amount input"
              />
              {editSupplier ? (
                <p className="text-xs text-muted-foreground">
                  Credit amount cannot be changed after creation. Record a payment to update balance.
                </p>
              ) : (
                supplierErrors.totalCredit && <p className="text-xs text-destructive">{supplierErrors.totalCredit}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sNotes">Notes</Label>
              <Input
                id="sNotes"
                placeholder="e.g. pays every Monday"
                value={supplierForm.notes}
                onChange={(e) => supplierField("notes", e.target.value)}
                aria-label="supplier notes input"
              />
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setSupplierDialogOpen(false)} aria-label="cancel button">
              Cancel
            </Button>
            <Button onClick={handleSaveSupplier} disabled={savingSupplier} aria-label="save supplier button">
              {savingSupplier ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
              ) : (
                "Save supplier"
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Record Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-sm" aria-label="record payment dialog">
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
          </DialogHeader>
          {payingSupplier && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
                <p className="font-semibold">{payingSupplier.name} — {payingSupplier.company}</p>
                <div className="flex justify-between text-muted-foreground">
                  <span>Outstanding balance</span>
                  <span className="font-medium text-orange-600">{formatCurrency(payingSupplier.balance)}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pAmount">Payment amount (Rs.) *</Label>
                <Input
                  id="pAmount"
                  type="number"
                  placeholder="0"
                  min={1}
                  max={payingSupplier.balance}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  aria-label="payment amount input"
                />
                <p className="text-xs text-muted-foreground">
                  Max: {formatCurrency(payingSupplier.balance)}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pNotes">Notes (optional)</Label>
                <Input
                  id="pNotes"
                  placeholder="e.g. weekly payment"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  aria-label="payment notes input"
                />
              </div>
              {paymentAmount && Number(paymentAmount) > 0 && (
                <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm space-y-1">
                  <p className="text-green-800 font-medium">After this payment:</p>
                  <p className="text-green-700">
                    Remaining balance:{" "}
                    <span className="font-bold">
                      {formatCurrency(payingSupplier.balance - Number(paymentAmount))}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)} aria-label="cancel payment button">
              Cancel
            </Button>
            <Button
              onClick={handleRecordPayment}
              disabled={savingPayment || !paymentAmount || Number(paymentAmount) <= 0}
              aria-label="confirm payment button"
            >
              {savingPayment ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Recording...</>
              ) : (
                "Record payment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden print target — rendered off-screen, only mounted when printing */}
      {printingSupplier && supplierDetail[printingSupplier] && (
        <div className="hidden print:block">
          <SupplierPaymentReceipt
            ref={printRef}
            supplier={supplierDetail[printingSupplier].supplier}
            payments={supplierDetail[printingSupplier].payments}
          />
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent aria-label="delete supplier confirmation dialog">
          <DialogHeader>
            <DialogTitle>Delete supplier</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete the supplier and all their payment records. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} aria-label="cancel delete button">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
              aria-label="confirm delete supplier button"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
