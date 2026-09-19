"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import { api, type Product, formatRupees } from "@/lib/api";
import { getCategoryStyle } from "@/lib/categoryStyle";
import AddToCartButton from "../../AddToCartButton";

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    api.getProduct(id).then(setProduct).catch(() => {});
  }, [id]);

  if (!product) {
    return <div className="h-64 bg-white rounded-xl border animate-pulse" />;
  }

  const style = getCategoryStyle(product.category?.slug ?? "");
  const Icon = style.icon;
  const discount =
    product.mrpInPaise && product.mrpInPaise > product.priceInPaise
      ? Math.round(100 - (product.priceInPaise / product.mrpInPaise) * 100)
      : 0;

  return (
    <div className="grid sm:grid-cols-2 gap-8 bg-white rounded-2xl border p-4 sm:p-6">
      <div className={`relative h-64 sm:h-80 rounded-xl flex items-center justify-center overflow-hidden ${style.bg}`}>
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, 480px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <Icon className={style.iconColor} size={96} strokeWidth={1.25} />
        )}
        {discount > 0 && (
          <span className="absolute top-3 left-3 bg-rose-600 text-white text-xs font-bold px-2 py-1 rounded">
            {discount}% OFF
          </span>
        )}
      </div>
      <div className="space-y-4">
        {product.category && (
          <span className="text-xs font-semibold text-brand-dark uppercase tracking-wide">
            {product.category.name}
          </span>
        )}
        <h1 className="text-2xl font-extrabold text-gray-900">{product.name}</h1>
        <p className="text-gray-500 text-sm font-medium bg-gray-100 inline-block px-2.5 py-1 rounded-full">
          {product.isLoose ? "Loose · sold per kg" : product.packSize ?? product.unit}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-gray-900">{formatRupees(product.priceInPaise)}</span>
          {product.isLoose && <span className="text-gray-500 text-sm font-medium">/kg</span>}
          {discount > 0 && (
            <span className="text-gray-400 line-through text-lg">{formatRupees(product.mrpInPaise!)}</span>
          )}
        </div>

        {!product.isAvailable ? (
          <p className="text-red-600 font-semibold">Currently out of stock</p>
        ) : (
          <div className={product.isLoose ? "max-w-[200px]" : "max-w-[160px]"}>
            <AddToCartButton product={product} />
          </div>
        )}
      </div>
    </div>
  );
}
