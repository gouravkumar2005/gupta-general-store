import { Router } from "express";
import { getOrCreateActiveCart, addToCart, removeFromCart, clearCart } from "../services/cartService";

export const cartRouter = Router();

cartRouter.get("/cart/:customerId", async (req, res) => {
  const channel = (req.query.channel as string) === "whatsapp" ? "whatsapp" : "website";
  const cart = await getOrCreateActiveCart(req.params.customerId, channel as any);
  res.json(cart);
});

cartRouter.post("/cart/:cartId/items", async (req, res) => {
  const { productId, quantity } = req.body;
  await addToCart(req.params.cartId, productId, quantity);
  res.status(204).send();
});

cartRouter.delete("/cart/:cartId/items/:productId", async (req, res) => {
  await removeFromCart(req.params.cartId, req.params.productId);
  res.status(204).send();
});

cartRouter.delete("/cart/:cartId", async (req, res) => {
  await clearCart(req.params.cartId);
  res.status(204).send();
});
