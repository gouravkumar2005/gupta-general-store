"use client";

import { useEffect, useState } from "react";
import { api, type Category, type Product } from "@/lib/api";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    sku: "",
    name: "",
    categoryId: "",
    unit: "piece",
    packSize: "",
    price: "",
    searchKeywords: "",
    isLoose: false,
    minOrderQty: "",
  });
  const [submitting, setSubmitting] = useState(false);

  function refresh() {
    api.adminGetProducts().then(setProducts);
    api.adminGetCategoriesFlat().then(setCategories);
  }
  useEffect(refresh, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.adminCreateProduct({
        sku: form.sku,
        name: form.name,
        categoryId: form.categoryId,
        unit: form.unit,
        packSize: form.packSize || undefined,
        priceInPaise: Math.round(Number(form.price) * 100),
        searchKeywords: form.searchKeywords || undefined,
        isLoose: form.isLoose,
        minOrderQty: form.isLoose ? Number(form.minOrderQty) || 0.1 : undefined,
      });
      setForm({
        sku: "",
        name: "",
        categoryId: "",
        unit: "piece",
        packSize: "",
        price: "",
        searchKeywords: "",
        isLoose: false,
        minOrderQty: "",
      });
      refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function updatePrice(product: Product, rupees: string) {
    const priceInPaise = Math.round(Number(rupees) * 100);
    if (!priceInPaise || priceInPaise === product.priceInPaise) return;
    await api.adminUpdateProduct(product.id, { priceInPaise });
    refresh();
  }

  async function toggleAvailable(product: Product) {
    await api.adminUpdateProduct(product.id, { isAvailable: !product.isAvailable });
    refresh();
  }

  async function updateMinOrderQty(product: Product, kg: string) {
    const minOrderQty = Number(kg);
    if (!minOrderQty || minOrderQty === product.minOrderQty) return;
    await api.adminUpdateProduct(product.id, { minOrderQty });
    refresh();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Products ({products.length})</h1>

      <form onSubmit={submit} className="bg-white border rounded-lg p-4 grid sm:grid-cols-2 gap-3 max-w-2xl">
        <h2 className="font-medium sm:col-span-2">Add Product</h2>
        <input
          required
          placeholder="SKU"
          value={form.sku}
          onChange={(e) => setForm({ ...form, sku: e.target.value })}
          className="border rounded px-3 py-2"
        />
        <input
          required
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border rounded px-3 py-2"
        />
        <select
          required
          value={form.categoryId}
          onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          className="border rounded px-3 py-2"
        >
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          placeholder="Unit (kg/piece/packet...)"
          value={form.unit}
          onChange={(e) => setForm({ ...form, unit: e.target.value })}
          className="border rounded px-3 py-2"
        />
        <input
          placeholder="Pack size (e.g. 500g)"
          value={form.packSize}
          onChange={(e) => setForm({ ...form, packSize: e.target.value })}
          className="border rounded px-3 py-2"
        />
        <input
          required
          type="number"
          placeholder="Price (Rs.)"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          className="border rounded px-3 py-2"
        />
        <input
          placeholder="Search keywords (e.g. chini, cheeni, sugar)"
          value={form.searchKeywords}
          onChange={(e) => setForm({ ...form, searchKeywords: e.target.value })}
          className="border rounded px-3 py-2 sm:col-span-2"
        />
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.isLoose}
            onChange={(e) => setForm({ ...form, isLoose: e.target.checked })}
          />
          Sold loose (by weight)
        </label>
        {form.isLoose && (
          <input
            type="number"
            step="0.01"
            placeholder="Min order qty (kg, e.g. 0.1 for 100g)"
            value={form.minOrderQty}
            onChange={(e) => setForm({ ...form, minOrderQty: e.target.value })}
            className="border rounded px-3 py-2"
          />
        )}
        <button disabled={submitting} className="bg-brand text-white px-4 py-2 rounded-md sm:col-span-2">
          Add Product
        </button>
      </form>

      <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Category</th>
              <th className="p-2">Price</th>
              <th className="p-2">Min order (kg)</th>
              <th className="p-2">Available</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((p) => (
              <tr key={p.id}>
                <td className="p-2">{p.name}</td>
                <td className="p-2 text-gray-500">{p.category?.name}</td>
                <td className="p-2">
                  <input
                    type="number"
                    defaultValue={(p.priceInPaise / 100).toString()}
                    onBlur={(e) => updatePrice(p, e.target.value)}
                    className="border rounded w-20 px-2 py-1"
                  />
                  {p.isLoose && <span className="text-gray-400">/kg</span>}
                </td>
                <td className="p-2 text-gray-500">
                  {p.isLoose ? (
                    <input
                      type="number"
                      step="0.01"
                      defaultValue={p.minOrderQty?.toString()}
                      onBlur={(e) => updateMinOrderQty(p, e.target.value)}
                      className="border rounded w-16 px-2 py-1"
                    />
                  ) : (
                    "—"
                  )}
                </td>
                <td className="p-2">
                  <input type="checkbox" checked={p.isAvailable} onChange={() => toggleAvailable(p)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
