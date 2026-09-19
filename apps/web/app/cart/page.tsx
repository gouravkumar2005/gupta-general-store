"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatRupees } from "@/lib/api";
import { getCategoryStyle } from "@/lib/categoryStyle";
import QuantityControl from "../QuantityControl";

export default function CartPage() {
  const { lines, setQuantity, removeItem, totalInPaise } = useCart();

  if (lines.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border">
        <ShoppingCart className="mx-auto text-gray-300 mb-4" size={64} strokeWidth={1.25} />
        <p className="text-gray-600 font-medium mb-4">Your cart is empty.</p>
        <Link
          href="/"
          className="inline-block bg-brand text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-brand-dark transition"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-xl font-extrabold text-gray-900">Your Cart</h1>
      <div className="divide-y bg-white border rounded-2xl overflow-hidden">
        {lines.map((line) => {
          const style = getCategoryStyle(line.product.category?.slug ?? "");
          const Icon = style.icon;
          return (
            <div key={line.product.id} className="flex items-center gap-3 p-3">
              <div className={`relative h-14 w-14 rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${style.bg}`}>
                {line.product.imageUrl ? (
                  <Image src={line.product.imageUrl} alt="" fill sizes="56px" className="object-cover" unoptimized />
                ) : (
                  <Icon className={style.iconColor} size={24} strokeWidth={1.5} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-gray-900 truncate">{line.product.name}</div>
                <div className="text-xs text-gray-500">
                  {formatRupees(line.product.priceInPaise)} {line.product.isLoose ? "/kg" : "each"}
                </div>
              </div>
              <div className={line.product.isLoose ? "w-28 shrink-0" : "w-24 shrink-0"}>
                <QuantityControl
                  product={line.product}
                  quantity={line.quantity}
                  onChange={(next) => setQuantity(line.product.id, next)}
                  size="sm"
                />
              </div>
              <div className="w-16 text-right font-bold text-sm shrink-0">
                {formatRupees(line.product.priceInPaise * line.quantity)}
              </div>
              <button
                onClick={() => removeItem(line.product.id)}
                className="text-gray-400 hover:text-red-500 shrink-0"
                aria-label="Remove"
              >
                <X size={18} />
              </button>
            </div>
          );
        })}
      </div>

      <div className="bg-white border rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Item total</span>
          <span>{formatRupees(totalInPaise)}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Delivery fee</span>
          <span className="text-brand-dark font-semibold">FREE</span>
        </div>
        <div className="border-t pt-2 flex items-center justify-between font-bold text-gray-900">
          <span>To Pay</span>
          <span className="text-lg">{formatRupees(totalInPaise)}</span>
        </div>
      </div>

      <Link
        href="/checkout"
        className="block text-center bg-brand text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-brand-dark transition"
      >
        Proceed to Checkout
      </Link>
    </div>
  );
}
