"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { Product } from "@/lib/api";
import { formatQty } from "@/lib/format";

// Shared by AddToCartButton, the cart page, and CreateListModal so the
// "ADD -> stepper" control (and, for loose items, minimum + inline typed
// quantity) behaves identically everywhere instead of three hand-rolled copies.
export default function QuantityControl({
  product,
  quantity,
  onChange,
  size = "md",
}: {
  product: Product;
  quantity: number;
  onChange: (quantity: number) => void;
  size?: "sm" | "md";
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const height = size === "sm" ? "h-8" : "h-9";
  const textSize = size === "sm" ? "text-xs" : "text-sm";
  const floor = product.isLoose ? product.minOrderQty ?? 0.1 : 1;
  const step = floor;

  function stop(e: React.SyntheticEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function commitEdit() {
    const parsed = parseFloat(editValue);
    const next = Number.isFinite(parsed) ? Math.max(floor, Math.round(parsed * 100) / 100) : quantity;
    onChange(next);
    setEditing(false);
  }

  if (quantity === 0) {
    return (
      <button
        onClick={(e) => {
          stop(e);
          onChange(floor);
        }}
        className={`${height} ${textSize} w-full min-w-[64px] rounded-lg border-2 border-brand text-brand font-bold bg-white hover:bg-brand-light active:scale-95 transition-all shadow-sm`}
      >
        ADD
      </button>
    );
  }

  return (
    <div
      className={`${height} ${textSize} flex items-center justify-between w-full min-w-[64px] rounded-lg bg-brand text-white font-bold overflow-hidden animate-pop`}
      onClick={stop}
    >
      <button
        onClick={() => {
          const next = Math.round((quantity - step) * 100) / 100;
          onChange(next < floor - 1e-9 ? 0 : next);
        }}
        className="flex-1 h-full flex items-center justify-center active:bg-brand-dark"
        aria-label="Decrease quantity"
      >
        <Minus size={13} />
      </button>

      {product.isLoose && editing ? (
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onClick={stop}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitEdit();
            } else if (e.key === "Escape") {
              setEditing(false);
            }
          }}
          className="w-12 bg-transparent text-white text-center outline-none ring-1 ring-white/50 rounded px-0.5"
        />
      ) : (
        <span
          className={product.isLoose ? "px-1 border-b border-dashed border-white/50 cursor-text" : "px-1"}
          onClick={
            product.isLoose
              ? (e) => {
                  stop(e);
                  setEditValue(String(quantity));
                  setEditing(true);
                }
              : undefined
          }
        >
          {product.isLoose ? formatQty(quantity, product.unit) : quantity}
        </span>
      )}

      <button
        onClick={() => onChange(Math.round((quantity + step) * 100) / 100)}
        className="flex-1 h-full flex items-center justify-center active:bg-brand-dark"
        aria-label="Increase quantity"
      >
        <Plus size={13} />
      </button>
    </div>
  );
}
