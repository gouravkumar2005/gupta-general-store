import { prisma } from "../lib/db";

export async function listCategories() {
  return prisma.category.findMany({
    where: { isActive: true, parentId: null },
    orderBy: { sortOrder: "asc" },
    include: {
      children: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function listProducts(params: {
  categoryId?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;

  const where = {
    isActive: true,
    ...(params.categoryId ? { categoryId: params.categoryId } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { category: true },
    }),
    prisma.product.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

/**
 * Simple fuzzy-ish search for the demo: matches against name and
 * search_keywords (comma-separated synonyms) with a case-insensitive
 * substring match. Good enough for a ~100-item demo catalog; swap for
 * Postgres pg_trgm/tsvector once the real 5000+ SKU catalog is imported.
 */
export async function searchProducts(query: string, limit = 8) {
  const q = query.trim();
  if (!q) return [];

  return prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { searchKeywords: { contains: q, mode: "insensitive" } },
      ],
    },
    take: limit,
    orderBy: { name: "asc" },
    include: { category: true },
  });
}

export async function getProduct(id: string) {
  return prisma.product.findUnique({ where: { id }, include: { category: true } });
}
