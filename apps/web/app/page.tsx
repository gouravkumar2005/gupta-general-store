"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Zap, Search, ShoppingBasket, ArrowRight } from "lucide-react";
import { api, type Category, type Product } from "@/lib/api";
import { getCategoryStyle } from "@/lib/categoryStyle";
import ProductCard, { ProductCardSkeleton } from "./ProductCard";

function HomeContent() {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryProducts, setCategoryProducts] = useState<Record<string, Product[]> | null>(null);
  const [query, setQuery] = useState(urlQuery);
  const [results, setResults] = useState<Product[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getCategories().then(setCategories).catch(() => {});
  }, []);

  // Fetch every category rail's products together so all sections resolve at
  // once (no staggered pop-in while scrolling) instead of each rail fetching
  // independently on its own timer.
  useEffect(() => {
    if (categories.length === 0) return;
    let cancelled = false;
    Promise.all(
      categories.map((c) =>
        api.getProducts({ categoryId: c.id }).then((r) => [c.id, r.items.slice(0, 6)] as const)
      )
    ).then((entries) => {
      if (!cancelled) setCategoryProducts(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [categories]);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    const handle = setTimeout(() => {
      api
        .getProducts({ q: query })
        .then((r) => setResults(r.items))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-brand-light px-6 py-8 sm:py-10 border border-brand/10">
        <div className="relative z-10 max-w-md">
          <span className="inline-flex items-center gap-1.5 bg-white text-brand-dark text-xs font-bold px-2.5 py-1 rounded-full mb-3 shadow-sm">
            <Zap size={13} className="fill-brand text-brand" /> Delivery in 10 minutes
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight mb-4">
            Groceries &amp; sweets,
            <br />
            delivered to your door
          </h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for atta, chini, biscuit..."
              className="w-full bg-white rounded-xl pl-10 pr-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
        </div>
        <ShoppingBasket
          className="hidden sm:block absolute -right-6 -bottom-8 text-brand/10"
          size={200}
          strokeWidth={1.5}
        />
      </section>

      {query.trim() ? (
        <section>
          <h2 className="text-lg font-bold mb-3 text-gray-900">Search results for &ldquo;{query}&rdquo;</h2>
          {loading && <p className="text-gray-500">Searching...</p>}
          {!loading && results?.length === 0 && (
            <p className="text-gray-500">No products found. Try a different word.</p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {results?.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : (
        <>
          <section>
            <h2 className="text-lg font-bold mb-3 text-gray-900">Shop by category</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {categories.map((c, i) => {
                const style = getCategoryStyle(c.slug, i);
                const Icon = style.icon;
                return (
                  <Link
                    key={c.id}
                    href={`/category/${c.slug}`}
                    className="group flex flex-col items-center gap-2 text-center"
                  >
                    <div
                      className={`${style.bg} w-full aspect-square rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md group-active:scale-95 transition-all`}
                    >
                      <Icon className={style.iconColor} size={30} strokeWidth={1.75} />
                    </div>
                    <span className="text-xs font-semibold text-gray-800 leading-tight">{c.name}</span>
                  </Link>
                );
              })}
            </div>
          </section>

          {categoryProducts === null
            ? categories.map((c) => <CategoryRailSkeleton key={c.id} />)
            : categories.map((c, i) => {
                const products = categoryProducts[c.id] ?? [];
                if (products.length === 0) return null;
                return <CategoryRail key={c.id} category={c} products={products} colorIndex={i} />;
              })}
        </>
      )}
    </div>
  );
}

function CategoryRail({
  category,
  products,
  colorIndex,
}: {
  category: Category;
  products: Product[];
  colorIndex: number;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-900">{category.name}</h2>
        <Link href={`/category/${category.slug}`} className="text-sm font-semibold text-brand flex items-center gap-0.5">
          See all <ArrowRight size={14} />
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto no-scrollbar scroll-rail pb-1">
        {products.map((p) => (
          <div key={p.id} className="w-36 shrink-0 snap-card">
            <ProductCard product={p} colorIndex={colorIndex} />
          </div>
        ))}
      </div>
    </section>
  );
}

function CategoryRailSkeleton() {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="h-5 w-32 rounded bg-gray-100 animate-pulse" />
      </div>
      <div className="flex gap-4 overflow-x-auto no-scrollbar scroll-rail pb-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="w-36 shrink-0 snap-card">
            <ProductCardSkeleton />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
