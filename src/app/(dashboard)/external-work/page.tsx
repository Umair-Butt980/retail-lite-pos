"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { Plus, Pencil, Trash2, Search, Loader2, Wrench, TrendingUp } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface ExternalWork {
  _id: string;
  title: string;
  description?: string;
  customerName: string;
  customerPhone: string;
  labourCost: number;
  chargedPrice: number;
  profit: number;
  paymentMethod: "cash" | "online" | "pending";
  status: "completed" | "pending";
  createdBy: { name: string };
  createdAt: string;
}

type PaymentMethod = "cash" | "online" | "pending";
type WorkStatus = "completed" | "pending";

const emptyForm = {
  title: "",
  description: "",
  customerName: "",
  customerPhone: "",
  labourCost: "",
  chargedPrice: "",
  paymentMethod: "cash" as PaymentMethod,
  status: "completed" as WorkStatus,
};

const WORK_SUGGESTIONS = [
  "Paint job", "Denting & painting", "Car wash",
  "Engine repair", "Oil change", "Brake service",
  "Electrical repair", "AC service", "Tyre change",
  "Interior cleaning", "Polish & wax", "Windscreen tint",
];

export default function ExternalWorkPage() {
  const [works, setWorks] = useState<ExternalWork[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editWork, setEditWork] = useState<ExternalWork | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchWorks = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20", search });
    const res = await fetch(`/api/external-work?${params}`);
    const data = await res.json();
    setWorks(data.works ?? []);
    setTotal(data.total ?? 0);
    setTotalPages(data.totalPages ?? 1);
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    const timer = setTimeout(fetchWorks, 300);
    return () => clearTimeout(timer);
  }, [fetchWorks]);

  function openAdd() {
    setEditWork(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(work: ExternalWork) {
    setEditWork(work);
    setForm({
      title: work.title,
      description: work.description ?? "",
      customerName: work.customerName,
      customerPhone: work.customerPhone,
      labourCost: String(work.labourCost),
      chargedPrice: String(work.chargedPrice),
      paymentMethod: work.paymentMethod as PaymentMethod,
      status: work.status as WorkStatus,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        labourCost: Number(form.labourCost),
        chargedPrice: Number(form.chargedPrice),
      };
      const res = editWork
        ? await fetch(`/api/external-work/${editWork._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/external-work", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save");
      } else {
        toast.success(editWork ? "Work order updated" : "Work order added");
        setDialogOpen(false);
        fetchWorks();
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/external-work/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Work order deleted");
        fetchWorks();
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleteId(null);
    }
  }

  const previewProfit =
    form.labourCost && form.chargedPrice
      ? Number(form.chargedPrice) - Number(form.labourCost)
      : null;

  const totalRevenue = works.reduce((s, w) => s + w.chargedPrice, 0);
  const totalProfit = works.reduce((s, w) => s + w.profit, 0);

  return (
    <div className="space-y-6" aria-label="external work page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">External work</h2>
          <p className="text-muted-foreground text-sm">
            Track external jobs like paint, repairs, and services
          </p>
        </div>
        <Button onClick={openAdd} aria-label="add new work order button">
          <Plus className="h-4 w-4 mr-2" /> Add work order
        </Button>
      </div>

      {works.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card aria-label="total work orders card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total jobs</CardTitle>
              <Wrench className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-xs text-muted-foreground mt-1">Work orders recorded</p>
            </CardContent>
          </Card>
          <Card aria-label="total revenue card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-muted-foreground mt-1">Charged to customers</p>
            </CardContent>
          </Card>
          <Card aria-label="total profit card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total profit</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalProfit)}</p>
              <p className="text-xs text-muted-foreground mt-1">After labour costs</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by job title or customer..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
              aria-label="search work orders input"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading work orders...
            </div>
          ) : works.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2 text-sm">
              <Wrench className="h-8 w-8 opacity-40" />
              <p>No work orders yet</p>
              <Button size="sm" onClick={openAdd} aria-label="add first work order button">
                Add first work order
              </Button>
            </div>
          ) : (
            <Table aria-label="work orders table">
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Labour cost</TableHead>
                  <TableHead className="text-right">Charged</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {works.map((work) => (
                  <TableRow key={work._id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-sm">{work.title}</p>
                        {work.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{work.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{work.customerName}</p>
                        <p className="text-xs text-muted-foreground">{work.customerPhone}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(work.labourCost)}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{formatCurrency(work.chargedPrice)}</TableCell>
                    <TableCell className="text-right">
                      <span className={`text-sm font-bold ${work.profit >= 0 ? "text-green-600" : "text-destructive"}`}>
                        {formatCurrency(work.profit)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={work.paymentMethod === "pending" ? "outline" : work.paymentMethod === "cash" ? "secondary" : "default"} className="capitalize text-xs">
                        {work.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-xs capitalize ${work.status === "completed" ? "bg-green-100 text-green-700 border-green-200" : "bg-yellow-100 text-yellow-700 border-yellow-200"}`}
                        variant="outline"
                      >
                        {work.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(work.createdAt), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(work)} aria-label={`edit work order ${work.title}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(work._id)}
                          aria-label={`delete work order ${work.title}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="previous page button">Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)} aria-label="next page button">Next</Button>
          </div>
        </div>
      )}

      {/* Add/Edit Sheet */}
      <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
        <SheetContent aria-label={editWork ? "edit work order sheet" : "add work order sheet"}>
          <SheetHeader>
            <SheetTitle>{editWork ? "Edit work order" : "Add work order"}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 grid gap-3 content-start">
            <div className="space-y-1.5">
              <Label htmlFor="wTitle">Job title *</Label>
              <Input
                id="wTitle"
                placeholder="e.g. Paint job, Engine repair..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                list="work-suggestions"
                aria-label="job title input"
              />
              <datalist id="work-suggestions">
                {WORK_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wDesc">Description</Label>
              <Input
                id="wDesc"
                placeholder="Details about the work done..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                aria-label="work description input"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="wCustName">Customer name *</Label>
                <Input
                  id="wCustName"
                  placeholder="Customer name"
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  aria-label="customer name input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wCustPhone">Phone *</Label>
                <Input
                  id="wCustPhone"
                  placeholder="03001234567"
                  value={form.customerPhone}
                  onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  aria-label="customer phone input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="wLabour">Labour cost (Rs.) *</Label>
                <Input
                  id="wLabour"
                  type="number"
                  placeholder="2000"
                  value={form.labourCost}
                  onChange={(e) => setForm({ ...form, labourCost: e.target.value })}
                  aria-label="labour cost input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wCharged">Charged price (Rs.) *</Label>
                <Input
                  id="wCharged"
                  type="number"
                  placeholder="3500"
                  value={form.chargedPrice}
                  onChange={(e) => setForm({ ...form, chargedPrice: e.target.value })}
                  aria-label="charged price input"
                />
              </div>
            </div>

            {previewProfit !== null && (
              <div className={`rounded-md p-3 text-sm ${previewProfit >= 0 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                <span className="text-muted-foreground">Profit on this job: </span>
                <span className={`font-bold ${previewProfit >= 0 ? "text-green-700" : "text-destructive"}`}>
                  {formatCurrency(previewProfit)}
                </span>
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="wPayment">Payment method</Label>
                <Select value={form.paymentMethod} onValueChange={(v) => setForm({ ...form, paymentMethod: v as typeof form.paymentMethod })}>
                  <SelectTrigger id="wPayment" aria-label="payment method select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wStatus">Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as typeof form.status })}>
                  <SelectTrigger id="wStatus" aria-label="work status select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} aria-label="cancel button">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} aria-label="save work order button">
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save work order"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent aria-label="delete work order confirmation dialog">
          <DialogHeader>
            <DialogTitle>Delete work order</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete this work order. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} aria-label="cancel delete button">Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)} aria-label="confirm delete button">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
