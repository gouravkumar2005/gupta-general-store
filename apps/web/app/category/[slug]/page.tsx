"use client";

import Link from "next/link";
import { useEffect, useState, use } from "react";
import { api, type Category, type Product } from "@/lib/api";
import { getCategoryStyle } from "@/lib/categoryStyle";
import ProductCard from "../../ProductCard";

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    setProducts(null);
    api.getCategories().then((categories) => {
      const flat: Category[] = categories.flatMap((c) => [c, ...c.children]);
      const found = flat.find((c) => c.slug === slug) ?? null;
      setCategory(found);
      if (found) {
        api.getProducts({ categoryId: found.id }).then((r) => setProducts(r.items));
      }
    });
  }, [slug]);

  if (!category) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-56 bg-white rounded-xl border animate-pulse" />
        ))}
      </div>
    );
  }

  const style = getCategoryStyle(category.slug);
  const Icon = style.icon;

  return (
    <div className="space-y-4">
      <div className={`flex items-center gap-3 rounded-xl p-4 ${style.bg}`}>
        <div className="bg-white/60 rounded-xl p-2.5">
          <Icon className={style.iconColor} size={32} strokeWidth={1.5} />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">{category.name}</h1>
          <p className="text-xs text-gray-600 font-medium">
            {products ? `${products.length} products` : "Loading..."}
          </p>
        </div>
      </div>

      {category.children.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {category.children.map((sub) => (
            <Link
              key={sub.id}
              href={`/category/${sub.slug}`}
              className="text-sm font-semibold px-3 py-1.5 border rounded-full bg-white hover:border-brand transition"
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}

      {products === null ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-56 bg-white rounded-xl border animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="text-gray-500 py-8 text-center">No products in this category yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
