import { Router } from "express";
import { listCategories, listProducts, searchProducts, getProduct } from "../services/productService";
import { prisma } from "../lib/db";

export const productsRouter = Router();

productsRouter.get("/categories", async (_req, res) => {
  res.json(await listCategories());
});

productsRouter.get("/products", async (req, res) => {
  const { categoryId, q, page, pageSize } = req.query;
  if (typeof q === "string" && q.trim()) {
    const results = await searchProducts(q, 20);
    return res.json({ items: results, total: results.length, page: 1, pageSize: results.length });
  }
  const result = await listProducts({
    categoryId: typeof categoryId === "string" ? categoryId : undefined,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  });
  res.json(result);
});

productsRouter.get("/products/:id", async (req, res) => {
  const product = await getProduct(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

// --- Admin CRUD (minimal, for demo admin panel) ---

productsRouter.post("/admin/products", async (req, res) => {
  const {
    sku,
    name,
    categoryId,
    unit,
    packSize,
    priceInPaise,
    mrpInPaise,
    searchKeywords,
    imageUrl,
    isAvailable,
    isLoose,
    minOrderQty,
  } = req.body;
  const product = await prisma.product.create({
    data: {
      sku,
      name,
      categoryId,
      unit,
      packSize,
      priceInPaise,
      mrpInPaise,
      searchKeywords,
      imageUrl,
      isAvailable,
      isLoose,
      minOrderQty,
    },
  });
  res.status(201).json(product);
});

productsRouter.put("/admin/products/:id", async (req, res) => {
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(product);
});

productsRouter.delete("/admin/products/:id", async (req, res) => {
  await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.status(204).send();
});

productsRouter.post("/admin/categories", async (req, res) => {
  const { name, slug, parentId, sortOrder } = req.body;
  const category = await prisma.category.create({
    data: { name, slug, parentId, sortOrder: sortOrder ?? 0 },
  });
  res.status(201).json(category);
});

productsRouter.get("/admin/categories/flat", async (_req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  res.json(categories);
});

productsRouter.get("/admin/products", async (_req, res) => {
  const products = await prisma.product.findMany({
    orderBy: { updatedAt: "desc" },
    include: { category: true },
  });
  res.json(products);
});
