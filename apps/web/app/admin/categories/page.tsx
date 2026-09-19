"use client";

import { useEffect, useState } from "react";
import { api, type Category } from "@/lib/api";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [parentId, setParentId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function refresh() {
    api.adminGetCategoriesFlat().then(setCategories);
  }
  useEffect(refresh, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.adminCreateCategory({ name, slug, parentId: parentId || undefined });
      setName("");
      setSlug("");
      setParentId("");
      refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Categories</h1>

      <form onSubmit={submit} className="bg-white border rounded-lg p-4 space-y-3 max-w-md">
        <h2 className="font-medium">Add Category / Subcategory</h2>
        <input
          required
          placeholder="Name (e.g. Spices)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
        <input
          required
          placeholder="Slug (e.g. spices)"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
        <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="w-full border rounded px-3 py-2">
          <option value="">No parent (top-level category)</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button disabled={submitting} className="bg-brand hover:bg-brand-dark text-white px-4 py-2 rounded-lg font-semibold transition">
          Add
        </button>
      </form>

      <div className="bg-white border rounded-lg divide-y">
        {categories.map((c) => (
          <div key={c.id} className="p-3 text-sm flex justify-between">
            <span>{c.name}</span>
            <span className="text-gray-400">{c.slug}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
