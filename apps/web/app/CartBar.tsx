"use client";

import { usePathname, useRouter } from "next/navigation";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatRupees } from "@/lib/api";

export default function CartBar() {
  const { itemCount, totalInPaise } = useCart();
  const pathname = usePathname();
  const router = useRouter();

  const hiddenOn = ["/cart", "/checkout", "/admin"];
  const shouldHide = itemCount === 0 || hiddenOn.some((p) => pathname.startsWith(p));

  if (shouldHide) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 px-3 pb-3 pointer-events-none">
      <button
        onClick={() => router.push("/cart")}
        className="pointer-events-auto max-w-md mx-auto flex items-center justify-between w-full bg-brand text-white rounded-xl px-4 py-3.5 shadow-xl animate-slide-up active:scale-[0.98] transition-transform"
      >
        <span className="flex items-center gap-2 font-semibold text-sm">
          <span className="bg-white/20 rounded-md px-2 py-1 flex items-center gap-1.5">
            <ShoppingCart size={14} />
            {itemCount} item{itemCount > 1 ? "s" : ""}
          </span>
          <span>{formatRupees(totalInPaise)}</span>
        </span>
        <span className="font-bold text-sm flex items-center gap-1">
          View Cart <ArrowRight size={16} />
        </span>
      </button>
    </div>
  );
}
