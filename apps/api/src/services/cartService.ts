import { prisma } from "../lib/db";
import { Channel } from "../types";
import { formatKg } from "../lib/format";

/**
 * Server-side cart, used by the WhatsApp bot (which needs cart state to
 * survive across separate inbound messages). The website keeps its cart in
 * client state and only calls the order API directly at checkout, so it
 * doesn't need this.
 */
export async function getOrCreateActiveCart(customerId: string, channel: Channel) {
  const existing = await prisma.cart.findFirst({
    where: { customerId, channel, status: "active" },
    include: { items: { include: { product: true } } },
  });
  if (existing) return existing;

  return prisma.cart.create({
    data: { customerId, channel, status: "active" },
    include: { items: { include: { product: true } } },
  });
}

export async function addToCart(cartId: string, productId: string, quantity: number) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error(`Product not found: ${productId}`);

  const existingItem = await prisma.cartItem.findFirst({ where: { cartId, productId } });
  const newQuantity = (existingItem?.quantity ?? 0) + quantity;
  if (product.isLoose && newQuantity < (product.minOrderQty ?? 0)) {
    throw new Error(`Minimum order for ${product.name} is ${formatKg(product.minOrderQty ?? 0)}`);
  }

  if (existingItem) {
    return prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: newQuantity },
    });
  }
  return prisma.cartItem.create({ data: { cartId, productId, quantity } });
}

export async function removeFromCart(cartId: string, productId: string) {
  await prisma.cartItem.deleteMany({ where: { cartId, productId } });
}

export async function clearCart(cartId: string) {
  await prisma.cartItem.deleteMany({ where: { cartId } });
}

export async function markCartConverted(cartId: string) {
  await prisma.cart.update({ where: { id: cartId }, data: { status: "converted" } });
}
