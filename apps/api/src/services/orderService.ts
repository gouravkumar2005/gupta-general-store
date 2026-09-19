import { prisma } from "../lib/db";
import { Channel, PaymentMethod } from "../types";
import { formatKg } from "../lib/format";

export type CartLine = { productId: string; quantity: number };

async function nextOrderNumber(): Promise<string> {
  const count = await prisma.order.count();
  return `GGS-${1000 + count + 1}`;
}

/**
 * The single order-creation path used by BOTH the website checkout API and
 * the WhatsApp bot. This is what guarantees an order placed on either
 * channel lands in the same shared history for the customer.
 */
export async function createOrder(params: {
  customerId: string;
  channel: Channel;
  items: CartLine[];
  deliveryAddress: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
}) {
  if (params.items.length === 0) {
    throw new Error("Cannot place an order with an empty cart");
  }

  const products = await prisma.product.findMany({
    where: { id: { in: params.items.map((i) => i.productId) } },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;
  const orderItemsData = params.items.map((line) => {
    const product = productMap.get(line.productId);
    if (!product) throw new Error(`Product not found: ${line.productId}`);
    if (product.isLoose && line.quantity < (product.minOrderQty ?? 0)) {
      throw new Error(`Minimum order for ${product.name} is ${formatKg(product.minOrderQty ?? 0)}`);
    }
    const lineTotal = product.priceInPaise * line.quantity;
    subtotal += lineTotal;
    return {
      productId: product.id,
      productNameSnapshot: product.name,
      unitPriceSnapshot: product.priceInPaise,
      quantity: line.quantity,
      lineTotalInPaise: lineTotal,
    };
  });

  const orderNumber = await nextOrderNumber();

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        customerId: params.customerId,
        channel: params.channel,
        paymentMethod: params.paymentMethod ?? "cod",
        deliveryAddress: params.deliveryAddress,
        notes: params.notes,
        subtotalInPaise: subtotal,
        totalInPaise: subtotal,
        items: { create: orderItemsData },
        statusHistory: { create: { status: "placed" } },
      },
      include: { items: true, customer: true },
    });

    // Website orders need an automatic WhatsApp confirmation. WhatsApp-channel
    // orders already get an inline confirmation reply from the bot itself, so
    // queuing a second outbound message here would be redundant (and adds to
    // the outbound-message volume, which is worth minimizing on an unofficial
    // WhatsApp session — see NotificationOutbox rate-limit handling).
    if (params.channel === "website") {
      await tx.notificationOutbox.create({
        data: {
          phone: created.customer.phone,
          orderId: created.id,
          template: "order_confirmation",
        },
      });
    }

    return created;
  });

  return order;
}

export async function markOrderDelivered(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.update({
      where: { id: orderId },
      data: { status: "delivered" },
    });
    await tx.orderStatusHistory.create({
      data: { orderId, status: "delivered" },
    });
    return order;
  });
}

export async function getOrderHistoryForPhone(customerId: string) {
  return prisma.order.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
}

export async function listAllOrders() {
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true, customer: true },
  });
}
