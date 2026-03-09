"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Minus, Trash2, ShoppingCart, Loader2, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

interface Product {
  _id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  sellingPrice: number;
  basePrice: number;
  stock: number;
}

interface CartItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  basePrice: number;
  stock: number;
}

export default function POSPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "online">("cash");
  const [discount, setDiscount] = useState(0);
  const [generating, setGenerating] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const subTotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const grandTotal = subTotal - discount;
  const totalProfit = cart.reduce((sum, item) => sum + (item.unitPrice - item.basePrice) * item.quantity, 0);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data);
      setShowResults(true);
    } catch {
      toast.error("Search failed");
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, doSearch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product._id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error(`Only ${product.stock} units available`);
          return prev;
        }
        return prev.map((item) =>
          item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          productId: product._id,
          sku: product.sku,
          name: product.name,
          quantity: 1,
          unitPrice: product.sellingPrice,
          basePrice: product.basePrice,
          stock: product.stock,
        },
      ];
    });
    setSearchQuery("");
    setShowResults(false);
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item;
          const newQty = item.quantity + delta;
          if (newQty > item.stock) {
            toast.error(`Only ${item.stock} units available`);
            return item;
          }
          return { ...item, quantity: newQty };
        })
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  }

  function clearCart() {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setDiscount(0);
    setPaymentMethod("cash");
  }

  async function generateBill() {
    if (!customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!customerPhone.trim()) {
      toast.error("Customer phone is required");
      return;
    }
    if (cart.length === 0) {
      toast.error("Add at least one item to the cart");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name: customerName, phone: customerPhone },
          items: cart.map((item) => ({ productId: item.productId, name: item.name, quantity: item.quantity })),
          paymentMethod,
          discount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to generate bill");
      } else {
        toast.success(`Bill ${data.invoiceNumber} generated!`);
        clearCart();
        router.push(`/bills/${data._id}`);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-4" aria-label="point of sale page">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Point of sale</h2>
        <p className="text-muted-foreground text-sm">Search products and generate bills</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Left panel — product search */}
        <div className="xl:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Search products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative" ref={searchRef}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by product name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  aria-label="product search input"
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}

                {showResults && searchResults.length > 0 && (
                  <div
                    className="absolute top-full mt-1 left-0 right-0 z-50 bg-background border rounded-md shadow-lg max-h-72 overflow-y-auto"
                    aria-label="search results dropdown"
                  >
                    {searchResults.map((product) => (
                      <button
                        key={product._id}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted text-left transition-colors border-b last:border-0"
                        onClick={() => addToCart(product)}
                        aria-label={`add ${product.name} to cart`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
                        </div>
                        <div className="flex flex-col items-end ml-4 shrink-0">
                          <p className="text-sm font-semibold">{formatCurrency(product.sellingPrice)}</p>
                          <p className="text-xs text-muted-foreground">Stock: {product.stock}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {showResults && searchResults.length === 0 && !searching && (
                  <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-background border rounded-md shadow-lg px-4 py-3 text-sm text-muted-foreground">
                    No products found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cart items table */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Cart items</CardTitle>
              {cart.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCart}
                  className="text-destructive hover:text-destructive"
                  aria-label="clear cart button"
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Clear
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2 text-sm">
                  <ShoppingCart className="h-8 w-8 opacity-40" />
                  <p>Cart is empty — search and add products</p>
                </div>
              ) : (
                <Table aria-label="cart items table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>SKU / Description</TableHead>
                      <TableHead className="text-center">QTY</TableHead>
                      <TableHead className="text-right">Unit price</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.map((item, idx) => (
                      <TableRow key={item.productId}>
                        <TableCell className="text-muted-foreground text-sm">{idx + 1}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{item.name}</p>
                            <p className="text-xs font-mono text-muted-foreground">{item.sku}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateQty(item.productId, -1)}
                              aria-label={`decrease quantity of ${item.name}`}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateQty(item.productId, 1)}
                              aria-label={`increase quantity of ${item.name}`}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell className="text-right text-sm font-medium">{formatCurrency(item.unitPrice * item.quantity)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => removeFromCart(item.productId)}
                            aria-label={`remove ${item.name} from cart`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right panel — bill summary */}
        <div className="xl:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Customer details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="customerName">Customer name *</Label>
                <Input
                  id="customerName"
                  placeholder="Customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  aria-label="customer name input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="customerPhone">Phone number *</Label>
                <Input
                  id="customerPhone"
                  placeholder="03001234567"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  aria-label="customer phone input"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Bill summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="paymentMethod">Payment method</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(v) => setPaymentMethod(v as "cash" | "online")}
                >
                  <SelectTrigger id="paymentMethod" aria-label="payment method select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="discount">Discount (Rs.)</Label>
                <Input
                  id="discount"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={discount || ""}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  aria-label="discount amount input"
                />
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items</span>
                  <span>{cart.reduce((s, i) => s + i.quantity, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sub total</span>
                  <span>{formatCurrency(subTotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>Discount</span>
                    <span>- {formatCurrency(discount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Grand total</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
                <div className="flex justify-between text-green-600 text-xs">
                  <span>Estimated profit</span>
                  <span>{formatCurrency(totalProfit)}</span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={generateBill}
                disabled={generating || cart.length === 0}
                aria-label="generate bill button"
              >
                {generating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating bill...</>
                ) : (
                  <><Receipt className="mr-2 h-4 w-4" /> Generate bill</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
