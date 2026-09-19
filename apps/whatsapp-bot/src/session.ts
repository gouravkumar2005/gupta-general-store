import { api } from "./apiClient";

export type ChatContext = {
  customerId?: string;
  cartId?: string;
  lastListItems?: string[]; // ids in the order they were last numbered/displayed
  categoryId?: string; // currently drilled-into category, when browsing
  pendingProductId?: string; // product awaiting a quantity reply
  pendingAddress?: string; // address collected, awaiting final YES confirm
};

export type ChatSession = {
  phone: string;
  currentState: string;
  context: ChatContext;
};

/**
 * Conversation state is stored in the API's DB (WhatsAppSession table), not
 * in this process's memory, so a bot restart doesn't drop mid-conversation
 * customers back to square one.
 */
export async function loadSession(phone: string): Promise<ChatSession> {
  const { data } = await api.get(`/whatsapp/session/${encodeURIComponent(phone)}`);
  return {
    phone,
    currentState: data.currentState ?? "idle",
    context: data.stateContext ? JSON.parse(data.stateContext) : {},
  };
}

export async function saveSession(session: ChatSession): Promise<void> {
  await api.put(`/whatsapp/session/${encodeURIComponent(session.phone)}`, {
    currentState: session.currentState,
    stateContext: JSON.stringify(session.context),
    customerId: session.context.customerId,
  });
}
