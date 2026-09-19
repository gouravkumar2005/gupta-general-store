import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/api";
import { formatRupees } from "@/lib/api";
import { getCategoryStyle } from "@/lib/categoryStyle";
import AddToCartButton from "./AddToCartButton";

// Mirrors ProductCard's exact structure/classes so swapping skeleton -> real
// card causes no height change (no scroll-jank reflow) once data loads.
export function ProductCardSkeleton() {
  return (
    <div className="border border-gray-100 rounded-xl bg-white p-2.5 flex flex-col gap-2 shadow-sm h-full animate-pulse">
      <div className="h-24 sm:h-28 rounded-lg bg-gray-100" />
      <div className="flex-1 space-y-1.5">
        <div className="h-[11px] w-10 rounded bg-gray-100" />
        <div className="h-4 w-full rounded bg-gray-100" />
        <div className="h-4 w-2/3 rounded bg-gray-100" />
      </div>
      <div className="flex items-end justify-between gap-2 mt-auto">
        <div className="h-4 w-10 rounded bg-gray-100" />
        <div className="w-20 h-8 rounded-lg bg-gray-100" />
      </div>
    </div>
  );
}

export default function ProductCard({ product, colorIndex = 0 }: { product: Product; colorIndex?: number }) {
  const discount =
    product.mrpInPaise && product.mrpInPaise > product.priceInPaise
      ? Math.round(100 - (product.priceInPaise / product.mrpInPaise) * 100)
      : 0;
  const style = getCategoryStyle(product.category?.slug ?? "", colorIndex);
  const Icon = style.icon;

  return (
    <div className="group border border-gray-100 rounded-xl bg-white p-2.5 flex flex-col gap-2 shadow-sm hover:shadow-md transition-shadow h-full">
      <Link href={`/product/${product.id}`} className="block">
        <div className={`relative h-24 sm:h-28 rounded-lg flex items-center justify-center overflow-hidden ${style.bg}`}>
          {product.imageUrl ? (
            // unoptimized: seed images hotlink Wikimedia/Unsplash, which rate-limit
            // our server-side optimizer proxy (429s) — load directly instead.
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 45vw, 180px"
              className="object-cover group-hover:scale-105 transition-transform"
              unoptimized
            />
          ) : (
            <Icon className={style.iconColor} size={36} strokeWidth={1.5} />
          )}
          {discount > 0 && (
            <span className="absolute top-1 left-1 bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              {discount}% OFF
            </span>
          )}
          {!product.isAvailable && (
            <span className="absolute inset-0 bg-white/70 flex items-center justify-center text-[11px] font-bold text-gray-600">
              Out of stock
            </span>
          )}
        </div>
      </Link>

      <Link href={`/product/${product.id}`} className="block flex-1">
        <div className="text-[11px] text-gray-500 font-medium">
          {product.isLoose ? "Loose · per kg" : product.packSize ?? product.unit}
        </div>
        <div className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{product.name}</div>
      </Link>

      <div className="flex items-end justify-between gap-2 mt-auto">
        <div>
          <div className="text-sm font-bold text-gray-900">{formatRupees(product.priceInPaise)}</div>
          {discount > 0 && (
            <div className="text-[11px] text-gray-400 line-through">{formatRupees(product.mrpInPaise!)}</div>
          )}
        </div>
        <div className={product.isLoose ? "w-24" : "w-20"}>
          <AddToCartButton product={product} size="sm" />
        </div>
      </div>
    </div>
  );
}
