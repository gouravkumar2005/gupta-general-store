"use client";

import Link from "next/link";
import { useState } from "react";
import { ShoppingCart, ClipboardList, Bike } from "lucide-react";
import { useCart } from "@/lib/cart";
import HeaderSearch from "./HeaderSearch";
import CreateListModal from "./CreateListModal";

export default function Header() {
  const { itemCount } = useCart();
  const [listOpen, setListOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link href="/" className="shrink-0">
          <div className="font-extrabold text-lg leading-tight text-gray-900">
            Gupta<span className="text-brand">Mart</span>
          </div>
          <div className="text-[11px] font-medium text-gray-500 -mt-0.5 flex items-center gap-1">
            <Bike size={12} /> Groceries in minutes
          </div>
        </Link>

        <div className="hidden sm:flex flex-1 max-w-md items-center gap-2">
          <HeaderSearch className="flex-1" />
          <button
            onClick={() => setListOpen(true)}
            className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100 transition whitespace-nowrap"
          >
            <ClipboardList size={16} className="text-brand" />
            Create your list
          </button>
        </div>

        <nav className="flex items-center gap-3 ml-auto text-sm font-semibold text-gray-900">
          <Link href="/orders" className="hover:text-brand transition hidden sm:block">
            My Orders
          </Link>
          <Link
            href="/cart"
            className="relative bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex items-center gap-1.5 hover:bg-gray-100 transition"
          >
            <ShoppingCart size={16} />
            <span className="hidden xs:inline">Cart</span>
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 inline-flex items-center justify-center bg-brand text-white rounded-full text-[11px] w-5 h-5 font-bold">
                {itemCount}
              </span>
            )}
          </Link>
        </nav>
      </div>
      <div className="sm:hidden px-4 pb-3 flex items-center gap-2">
        <HeaderSearch className="flex-1" />
        <button
          onClick={() => setListOpen(true)}
          className="flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg p-2 shrink-0"
          aria-label="Create your list"
        >
          <ClipboardList size={18} className="text-brand" />
        </button>
      </div>

      <CreateListModal open={listOpen} onClose={() => setListOpen(false)} />
    </header>
  );
}
