import { Router } from "express";
import { prisma } from "../lib/db";

export const whatsappRouter = Router();

// --- Notification outbox: the bot service polls this to know what to send ---

whatsappRouter.get("/notifications/pending", async (_req, res) => {
  const pending = await prisma.notificationOutbox.findMany({
    where: { status: "pending" },
    take: 20,
    orderBy: { createdAt: "asc" },
  });

  // Attach the order + customer details the message template needs.
  const withDetails = await Promise.all(
    pending.map(async (n) => {
      const order = await prisma.order.findUnique({
        where: { id: n.orderId },
        include: { customer: true },
      });
      return { ...n, order };
    })
  );

  res.json(withDetails);
});

whatsappRouter.post("/notifications/:id/mark-sent", async (req, res) => {
  await prisma.notificationOutbox.update({
    where: { id: req.params.id },
    data: { status: "sent", sentAt: new Date() },
  });
  res.status(204).send();
});

whatsappRouter.post("/notifications/:id/mark-failed", async (req, res) => {
  const current = await prisma.notificationOutbox.findUnique({ where: { id: req.params.id } });
  const attempts = (current?.attempts ?? 0) + 1;
  await prisma.notificationOutbox.update({
    where: { id: req.params.id },
    data: { attempts, status: attempts >= 3 ? "failed" : "pending" },
  });
  res.status(204).send();
});

// --- Message log (debugging / proof the notification flow actually ran) ---

whatsappRouter.post("/whatsapp/log", async (req, res) => {
  const { phone, direction, messageType, payloadText, status } = req.body;
  const log = await prisma.whatsAppMessageLog.create({
    data: { phone, direction, messageType, payloadText, status },
  });
  res.status(201).json(log);
});

// --- Bot conversation state, kept in DB so it survives bot restarts ---

whatsappRouter.get("/whatsapp/session/:phone", async (req, res) => {
  const session = await prisma.whatsAppSession.findUnique({ where: { phone: req.params.phone } });
  res.json(session ?? { phone: req.params.phone, currentState: "idle", stateContext: null });
});

whatsappRouter.put("/whatsapp/session/:phone", async (req, res) => {
  const { currentState, stateContext, customerId } = req.body;
  const session = await prisma.whatsAppSession.upsert({
    where: { phone: req.params.phone },
    update: { currentState, stateContext, customerId },
    create: { phone: req.params.phone, currentState, stateContext, customerId },
  });
  res.json(session);
});
