import { Router } from "express";
import { findOrCreateCustomerByPhone, saveAddress } from "../services/customerService";
import { createOrder, markOrderDelivered, getOrderHistoryForPhone, listAllOrders } from "../services/orderService";
import { normalizePhone } from "@gupta/shared";
import { prisma } from "../lib/db";

export const ordersRouter = Router();

/**
 * Shared order-placement endpoint used by BOTH the website checkout and the
 * WhatsApp bot (channel: "whatsapp"). This is what guarantees both channels
 * write into the same Customer/Order tables.
 */
ordersRouter.post("/orders", async (req, res) => {
  try {
    const { phone, name, items, deliveryAddress, paymentMethod, notes, channel, latitude, longitude, label } =
      req.body;

    const customer = await findOrCreateCustomerByPhone(phone, {
      name,
      sourceChannel: channel === "whatsapp" ? "whatsapp" : "website",
    });

    if (deliveryAddress) {
      await saveAddress(customer.id, deliveryAddress, undefined, latitude, longitude, label);
    }

    const order = await createOrder({
      customerId: customer.id,
      channel: channel === "whatsapp" ? "whatsapp" : "website",
      items,
      deliveryAddress: deliveryAddress ?? "",
      paymentMethod,
      notes,
    });

    res.status(201).json(order);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

ordersRouter.get("/orders/history/:phone", async (req, res) => {
  const phone = normalizePhone(req.params.phone);
  if (!phone) return res.status(400).json({ error: "Invalid phone number" });

  const customer = await prisma.customer.findUnique({ where: { phone } });
  if (!customer) return res.json([]);

  const orders = await getOrderHistoryForPhone(customer.id);
  res.json(orders);
});

ordersRouter.get("/admin/orders", async (_req, res) => {
  res.json(await listAllOrders());
});

ordersRouter.post("/admin/orders/:id/deliver", async (req, res) => {
  const order = await markOrderDelivered(req.params.id);
  res.json(order);
});
