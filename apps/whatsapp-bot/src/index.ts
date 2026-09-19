import { WhatsAppTransport } from "./whatsappTransport";
import { handleIncomingMessage } from "./conversation";
import { startNotificationPoller } from "./notificationPoller";
import { api } from "./apiClient";

async function main() {
  const transport = new WhatsAppTransport();

  transport.start(async (phone, text, profileName) => {
    console.log(`[handling] phone=${phone} text=${JSON.stringify(text)}`);
    const replies = await handleIncomingMessage(phone, text, profileName);
    console.log(`[replying] ${replies.length} message(s) to ${phone}`);
    for (const reply of replies) {
      await api
        .post("/whatsapp/log", {
          phone,
          direction: "out",
          messageType: "text",
          payloadText: reply,
          status: "sent",
        })
        .catch(() => {});
    }
    return replies;
  });

  // Runs alongside the transport - picks up website-originated orders and
  // sends the automatic WhatsApp confirmation.
  startNotificationPoller(transport).catch((err) => {
    console.error("Notification poller crashed:", err);
  });
}

main().catch((err) => {
  console.error("Fatal error starting WhatsApp bot:", err);
  process.exit(1);
});
