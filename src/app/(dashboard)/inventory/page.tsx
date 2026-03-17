"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Search, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

interface Product {
  _id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  sellingPrice: number;
  stock: number;
  location?: string;
  image?: string;
}

const RACK_SUGGESTIONS = [
  "Rack A", "Rack B", "Rack C", "Rack D",
  "Shelf 1", "Shelf 2", "Shelf 3",
  "Store Room", "Counter", "Display",
];

const emptyForm = {
  sku: "",
  name: "",
  description: "",
  category: "",
  basePrice: "",
  sellingPrice: "",
  stock: "",
  location: "",
  image: "",
};

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof emptyForm, string>>>({});
  const [saving, setSaving] = useState(false);

  function validate() {
    const e: Partial<Record<keyof typeof emptyForm, string>> = {};
    if (!form.sku.trim())          e.sku          = "SKU is required";
    if (!form.name.trim())         e.name         = "Product name is required";
    if (!form.category.trim())     e.category     = "Category is required";
    if (!form.basePrice)           e.basePrice    = "Base price is required";
    else if (Number(form.basePrice) < 0) e.basePrice = "Base price must be 0 or more";
    if (!form.sellingPrice)        e.sellingPrice = "Selling price is required";
    else if (Number(form.sellingPrice) < 0) e.sellingPrice = "Selling price must be 0 or more";
    if (!form.stock)               e.stock        = "Stock is required";
    else if (Number(form.stock) < 0) e.stock      = "Stock must be 0 or more";
    if (!form.location.trim())     e.location     = "Location is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function field<K extends keyof typeof emptyForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "15", search });
    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data.products ?? []);
    setTotal(data.total ?? 0);
    setTotalPages(data.totalPages ?? 1);
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  function openAdd() {
    setEditProduct(null);
    setErrors({});
    // Pre-fill SKU with auto-generated value — user can overwrite
    const autoSku = `PRD-${String(total + 1).padStart(4, "0")}`;
    setForm({ ...emptyForm, sku: autoSku });
    setDialogOpen(true);
  }

  function openEdit(product: Product) {
    setEditProduct(product);
    setErrors({});
    setForm({
      sku: product.sku,
      name: product.name,
      description: product.description,
      category: product.category,
      basePrice: String(product.basePrice),
      sellingPrice: String(product.sellingPrice),
      stock: String(product.stock),
      location: product.location ?? "",
      image: product.image ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        basePrice: Number(form.basePrice),
        sellingPrice: Number(form.sellingPrice),
        stock: Number(form.stock),
      };

      const res = editProduct
        ? await fetch(`/api/products/${editProduct._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save product");
      } else {
        toast.success(editProduct ? "Product updated" : "Product added");
        setDialogOpen(false);
        fetchProducts();
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Product deleted");
        fetchProducts();
      } else {
        toast.error("Failed to delete product");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-6" aria-label="inventory management page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inventory</h2>
          <p className="text-muted-foreground text-sm">{total} products in stock</p>
        </div>
        <Button onClick={openAdd} aria-label="add new product button">
          <Plus className="h-4 w-4 mr-2" /> Add product
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
              aria-label="search products input"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2 text-sm">
              <AlertTriangle className="h-8 w-8 opacity-40" />
              <p>No products found</p>
            </div>
          ) : (
            <Table aria-label="products table">
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Base price</TableHead>
                  <TableHead className="text-right">Selling price</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product._id}>
                    <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        {product.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{product.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(product.basePrice)}</TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(product.sellingPrice)}</TableCell>
                    <TableCell className="text-right text-sm text-green-600 font-medium">
                      {formatCurrency(product.sellingPrice - product.basePrice)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={product.stock <= 5 ? "text-destructive font-semibold" : "font-medium"}>
                        {product.stock}
                        {product.stock <= 5 && <AlertTriangle className="inline ml-1 h-3 w-3 text-destructive" />}
                      </span>
                    </TableCell>
                    <TableCell>
                      {product.location ? (
                        <Badge variant="outline" className="text-xs font-normal">
                          📦 {product.location}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(product)}
                          aria-label={`edit product ${product.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(product._id)}
                          aria-label={`delete product ${product.name}`}
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
      <Sheet open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setErrors({}); }}>
        <SheetContent aria-label={editProduct ? "edit product sheet" : "add product sheet"}>
          <SheetHeader>
            <SheetTitle>{editProduct ? "Edit product" : "Add product"}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 grid gap-3 content-start">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  placeholder="ATS-0900"
                  value={form.sku}
                  onChange={(e) => field("sku", e.target.value)}
                  disabled={!!editProduct}
                  className={errors.sku ? "border-destructive" : ""}
                  aria-label="product SKU input"
                />
                {errors.sku && <p className="text-xs text-destructive">{errors.sku}</p>}
                {!editProduct && <p className="text-xs text-muted-foreground">Auto-generated — you can change it</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  placeholder="Stickers"
                  value={form.category}
                  onChange={(e) => field("category", e.target.value)}
                  className={errors.category ? "border-destructive" : ""}
                  aria-label="product category input"
                />
                {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Product name *</Label>
              <Input
                id="name"
                placeholder="Car Door Carbon Fiber Stickers"
                value={form.name}
                onChange={(e) => field("name", e.target.value)}
                className={errors.name ? "border-destructive" : ""}
                aria-label="product name input"
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="4Pcs Car Door Carbon Fiber Anti Stepping..."
                value={form.description}
                onChange={(e) => field("description", e.target.value)}
                aria-label="product description input"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="basePrice">Base price *</Label>
                <Input
                  id="basePrice"
                  type="number"
                  placeholder="120"
                  value={form.basePrice}
                  onChange={(e) => field("basePrice", e.target.value)}
                  className={errors.basePrice ? "border-destructive" : ""}
                  aria-label="product base price input"
                />
                {errors.basePrice && <p className="text-xs text-destructive">{errors.basePrice}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sellingPrice">Selling price *</Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  placeholder="200"
                  value={form.sellingPrice}
                  onChange={(e) => field("sellingPrice", e.target.value)}
                  className={errors.sellingPrice ? "border-destructive" : ""}
                  aria-label="product selling price input"
                />
                {errors.sellingPrice && <p className="text-xs text-destructive">{errors.sellingPrice}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="stock">Stock *</Label>
                <Input
                  id="stock"
                  type="number"
                  placeholder="50"
                  value={form.stock}
                  onChange={(e) => field("stock", e.target.value)}
                  className={errors.stock ? "border-destructive" : ""}
                  aria-label="product stock input"
                />
                {errors.stock && <p className="text-xs text-destructive">{errors.stock}</p>}
              </div>
            </div>
            {form.basePrice && form.sellingPrice && (
              <div className="rounded-md bg-muted p-3 text-sm">
                <span className="text-muted-foreground">Profit per unit: </span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(Number(form.sellingPrice) - Number(form.basePrice))}
                </span>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="location">Rack / Store location *</Label>
              <Input
                id="location"
                placeholder="e.g. Rack A, Shelf 2, Store Room..."
                value={form.location}
                onChange={(e) => field("location", e.target.value)}
                list="rack-suggestions"
                className={errors.location ? "border-destructive" : ""}
                aria-label="product rack location input"
              />
              <datalist id="rack-suggestions">
                {RACK_SUGGESTIONS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
              {errors.location && <p className="text-xs text-destructive">{errors.location}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="image">Image URL (optional)</Label>
              <Input
                id="image"
                placeholder="https://..."
                value={form.image}
                onChange={(e) => field("image", e.target.value)}
                aria-label="product image URL input"
              />
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} aria-label="cancel button">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} aria-label="save product button">
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : "Save product"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent aria-label="delete product confirmation dialog">
          <DialogHeader>
            <DialogTitle>Delete product</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this product? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} aria-label="cancel delete button">Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
              aria-label="confirm delete button"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
