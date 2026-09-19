import { api } from "./apiClient";
import { formatRupees } from "./format";
import type { MessageSender } from "./messageSender";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jitter(baseMs: number, spreadMs: number) {
  return baseMs + Math.random() * spreadMs;
}

function buildConfirmationText(order: any): string {
  const name = order.customer?.name ? order.customer.name : "there";
  return `Namaste ${name}! Your order #${order.orderNumber} has been placed. Total: ${formatRupees(
    order.totalInPaise
  )}. It will reach you soon. Thank you for shopping with Gupta General Store!`;
}

/**
 * Polls the NotificationOutbox (populated by the API whenever a WEBSITE
 * order is created) and sends the WhatsApp confirmation message. Runs on a
 * deliberate poll interval with jittered per-message delay rather than
 * firing instantly/in bursts - unofficial WhatsApp sessions are more likely
 * to get flagged by bulk/robotic-looking send patterns.
 */
export async function startNotificationPoller(sender: MessageSender, intervalMs = 5000) {
  while (true) {
    try {
      const { data: pending } = await api.get("/notifications/pending");
      for (const notification of pending) {
        if (!notification.order) continue;
        try {
          await sender.send(notification.phone, buildConfirmationText(notification.order));
          await api.post(`/notifications/${notification.id}/mark-sent`);
          await api.post("/whatsapp/log", {
            phone: notification.phone,
            direction: "out",
            messageType: "notification",
            payloadText: notification.template,
            status: "sent",
          });
        } catch (err) {
          console.error("Failed to send notification", notification.id, err);
          await api.post(`/notifications/${notification.id}/mark-failed`);
        }
        // Small randomized gap between messages, even within one poll batch.
        await sleep(jitter(3000, 4000));
      }
    } catch (err) {
      console.error("Notification poller error:", err);
    }
    await sleep(intervalMs);
  }
}
