/**
 * The ONLY file in this service that imports whatsapp-web.js. Everything
 * else (conversation.ts, notification poller) talks to WhatsApp only
 * through the MessageSender interface and the onIncoming callback below —
 * this is the transport/logic decoupling called out in the plan, so that
 * swapping to the official Meta Cloud API later means writing one new
 * adapter file, not touching bot logic.
 */
import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { normalizePhone } from "@gupta/shared";
import type { MessageSender } from "./messageSender";

export type IncomingHandler = (phone: string, text: string, profileName?: string) => Promise<string[]>;

function toWhatsAppChatId(phone: string): string {
  // phone is E.164 "+91XXXXXXXXXX" -> whatsapp-web.js wants "91XXXXXXXXXX@c.us"
  return `${phone.replace("+", "")}@c.us`;
}

export class WhatsAppTransport implements MessageSender {
  private client: Client;
  private ready = false;

  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth({ dataPath: ".wwebjs_auth" }),
      puppeteer: { headless: true },
      // Fetch the current WhatsApp Web client version at startup instead of
      // using whatsapp-web.js's bundled one - a stale bundled version is the
      // most common cause of "Couldn't link device, try again later" on the
      // phone, since WhatsApp's servers reject sessions from an old client.
      webVersionCache: {
        type: "remote",
        // {version} is resolved at runtime against WhatsApp's own current
        // version, so this stays correct without needing to hardcode/update
        // a version number here.
        remotePath: "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/{version}.html",
      },
    });
  }

  start(onIncoming: IncomingHandler) {
    this.client.on("qr", (qr) => {
      console.log("Scan this QR code with the dedicated store WhatsApp number:");
      qrcode.generate(qr, { small: true });
    });

    this.client.on("ready", () => {
      this.ready = true;
      console.log("WhatsApp bot is ready.");
    });

    this.client.on("disconnected", (reason) => {
      this.ready = false;
      console.error("WhatsApp session disconnected:", reason, "- restart and re-scan the QR code.");
    });

    this.client.on("message", async (message) => {
      console.log(`[incoming] from=${message.from} isStatus=${message.isStatus} fromMe=${message.fromMe} body=${JSON.stringify(message.body)}`);

      // Ignore group chats, status updates, and messages from the bot's own number.
      if (message.from.endsWith("@g.us") || message.isStatus || message.fromMe) {
        console.log("[incoming] ignored (group/status/from-self)");
        return;
      }

      // Newer WhatsApp accounts can appear with a privacy "@lid" sender id
      // instead of the classic "<digits>@c.us" phone-based id. Neither
      // message.from nor contact.number expose the real phone number for
      // these - they return the lid pseudo-id too - so ask WhatsApp's
      // dedicated lid->phone resolver for it.
      const contact = await message.getContact().catch(() => undefined);
      const profileName = contact?.pushname || contact?.name;

      let phone = normalizePhone(message.from);
      if (!phone && message.from.endsWith("@lid")) {
        const resolved = await this.client.getContactLidAndPhone([message.from]).catch((err) => {
          console.warn("[incoming] getContactLidAndPhone failed:", err);
          return [];
        });
        console.log(`[incoming] lid resolution result: ${JSON.stringify(resolved)}`);
        phone = normalizePhone(resolved[0]?.pn ?? "");
      }
      if (!phone) {
        console.warn(
          `[incoming] could not resolve a phone number (from="${message.from}", contact.number="${contact?.number}") - message dropped`
        );
        return;
      }

      try {
        const replies = await onIncoming(phone, message.body ?? "", profileName);
        for (const reply of replies) {
          // Reply on the exact same chat the message came from (works for
          // both classic @c.us chats and @lid privacy chats) rather than
          // reconstructing a chat id from the phone number, which would fail
          // to reach @lid users.
          await message.reply(reply);
        }
      } catch (err) {
        console.error("Error handling incoming WhatsApp message:", err);
      }
    });

    this.client.initialize();
  }

  /**
   * Used only for proactive, non-reply sends (e.g. the website-order
   * confirmation) where there's no incoming message to reply to, so a chat
   * id has to be constructed from the phone number.
   */
  async send(phone: string, text: string): Promise<void> {
    if (!this.ready) {
      throw new Error("WhatsApp client is not ready yet");
    }
    await this.client.sendMessage(toWhatsAppChatId(phone), text);
  }
}
