"use client";

import { useCart } from "@/lib/cart";
import type { Product } from "@/lib/api";
import QuantityControl from "./QuantityControl";

export default function AddToCartButton({ product, size = "md" }: { product: Product; size?: "sm" | "md" }) {
  const { lines, addItem, setQuantity } = useCart();
  const line = lines.find((l) => l.product.id === product.id);
  const qty = line?.quantity ?? 0;

  return (
    <QuantityControl
      product={product}
      quantity={qty}
      onChange={(next) => (qty === 0 ? addItem(product, next) : setQuantity(product.id, next))}
      size={size}
    />
  );
}
