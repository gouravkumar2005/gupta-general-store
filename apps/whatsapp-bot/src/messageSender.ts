/**
 * Abstraction the conversation logic and notification poller depend on.
 * The only concrete implementation today is the whatsapp-web.js transport
 * (whatsappTransport.ts). If the unofficial library ever needs to be
 * swapped for the official Meta Cloud API, a new class implementing this
 * interface is all that's needed — conversation.ts never changes.
 */
export interface MessageSender {
  send(phone: string, text: string): Promise<void>;
}
