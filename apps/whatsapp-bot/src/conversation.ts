import { api } from "./apiClient";
import { formatRupees } from "./format";
import { loadSession, saveSession, type ChatContext } from "./session";

const GREETINGS = ["hi", "hello", "hey", "namaste", "menu", "start"];

function mainMenuText(): string {
  return [
    "Welcome to Gupta General Store! 🛒",
    "",
    "1. Browse by Category",
    "2. Search a product by name",
    "3. My Cart",
    "4. My Past Orders / Reorder",
    "5. Talk to a person",
    "",
    "Reply with a number.",
  ].join("\n");
}

async function ensureCustomer(phone: string, profileName: string | undefined, ctx: ChatContext) {
  if (ctx.customerId) return ctx.customerId;
  const { data } = await api.post("/customers/identify", {
    phone,
    name: profileName,
    whatsappProfileName: profileName,
    channel: "whatsapp",
  });
  ctx.customerId = data.id;
  return data.id as string;
}

async function ensureCart(customerId: string, ctx: ChatContext) {
  if (ctx.cartId) return ctx.cartId;
  const { data } = await api.get(`/cart/${customerId}`, { params: { channel: "whatsapp" } });
  ctx.cartId = data.id;
  return data.id as string;
}

async function renderCategories(): Promise<{ text: string; ids: string[] }> {
  const { data } = await api.get("/categories");
  const lines = data.map((c: any, i: number) => `${i + 1}. ${c.name}`);
  return {
    text: ["Categories:", ...lines, "", "Reply with a number, or 0 for the main menu."].join("\n"),
    ids: data.map((c: any) => c.id),
  };
}

async function renderProducts(categoryId: string): Promise<{ text: string; ids: string[] }> {
  const { data } = await api.get("/products", { params: { categoryId, pageSize: 10 } });
  if (data.items.length === 0) {
    return { text: "No products found in this category. Reply 0 for the main menu.", ids: [] };
  }
  const lines = data.items.map(
    (p: any, i: number) => `${i + 1}. ${p.name} (${p.packSize ?? p.unit}) - ${formatRupees(p.priceInPaise)}`
  );
  return {
    text: ["Products:", ...lines, "", "Reply with a number to add to cart, or 0 for the main menu."].join("\n"),
    ids: data.items.map((p: any) => p.id),
  };
}

async function renderSearchResults(query: string): Promise<{ text: string; ids: string[] }> {
  const { data } = await api.get("/products", { params: { q: query } });
  const items = data.items as any[];
  if (items.length === 0) {
    return { text: `No products matched "${query}". Try a different word, or reply 0 for the main menu.`, ids: [] };
  }
  const lines = items.map((p, i) => `${i + 1}. ${p.name} (${p.packSize ?? p.unit}) - ${formatRupees(p.priceInPaise)}`);
  return {
    text: ["Found these:", ...lines, "", "Reply with a number to add to cart, or 0 for the main menu."].join("\n"),
    ids: items.map((p) => p.id),
  };
}

function parseInt10(text: string): number | null {
  const n = Number(text.trim());
  return Number.isInteger(n) ? n : null;
}

export async function handleIncomingMessage(
  phone: string,
  rawText: string,
  profileName: string | undefined
): Promise<string[]> {
  const text = (rawText ?? "").trim();
  const lower = text.toLowerCase();

  const session = await loadSession(phone);
  const ctx = session.context;
  let state = session.currentState;

  const customerId = await ensureCustomer(phone, profileName, ctx);

  // Global resets, available from any state.
  if (GREETINGS.includes(lower) || text === "0") {
    state = "menu";
    await saveSession({ phone, currentState: state, context: ctx });
    return [mainMenuText()];
  }

  const replies: string[] = [];

  if (state === "idle") {
    state = "menu";
    replies.push(mainMenuText());
  } else if (state === "menu") {
    const choice = parseInt10(text);
    if (choice === 1) {
      const { text: msg, ids } = await renderCategories();
      ctx.lastListItems = ids;
      state = "browse_category";
      replies.push(msg);
    } else if (choice === 2) {
      state = "await_search";
      replies.push("Type the product name you're looking for (e.g. chini, atta, biscuit):");
    } else if (choice === 3) {
      replies.push(await cartSummary(customerId, ctx));
      state = "cart";
    } else if (choice === 4) {
      const { data } = await api.get(`/orders/history/${phone}`);
      if (data.length === 0) {
        replies.push("You have no past orders yet. Reply 0 for the main menu.");
      } else {
        const lines = data
          .slice(0, 5)
          .map((o: any, i: number) => `${i + 1}. #${o.orderNumber} - ${formatRupees(o.totalInPaise)} - ${o.status}`);
        ctx.lastListItems = data.slice(0, 5).map((o: any) => o.id);
        replies.push(["Your recent orders:", ...lines, "", "Reply 'R' + number to reorder, e.g. R1. Or 0 for menu."].join("\n"));
      }
      state = "orders";
    } else if (choice === 5) {
      replies.push("You can call the store directly at the number on our storefront. Reply 0 for the main menu.");
      state = "menu";
    } else {
      replies.push("Sorry, I didn't understand. " + mainMenuText());
    }
  } else if (state === "browse_category") {
    const choice = parseInt10(text);
    if (choice && ctx.lastListItems && ctx.lastListItems[choice - 1]) {
      const categoryId = ctx.lastListItems[choice - 1];
      ctx.categoryId = categoryId;
      const { text: msg, ids } = await renderProducts(categoryId);
      ctx.lastListItems = ids;
      state = "browse_products";
      replies.push(msg);
    } else {
      replies.push("Please reply with a valid category number, or 0 for the main menu.");
    }
  } else if (state === "browse_products" || state === "await_search") {
    if (state === "await_search") {
      const { text: msg, ids } = await renderSearchResults(text);
      ctx.lastListItems = ids;
      if (ids.length > 0) state = "browse_products";
      replies.push(msg);
    } else {
      const choice = parseInt10(text);
      if (choice && ctx.lastListItems && ctx.lastListItems[choice - 1]) {
        ctx.pendingProductId = ctx.lastListItems[choice - 1];
        state = "await_quantity";
        replies.push("How many units? (reply a number, e.g. 2)");
      } else {
        replies.push("Please reply with a valid product number, or 0 for the main menu.");
      }
    }
  } else if (state === "await_quantity") {
    const qty = parseInt10(text);
    if (qty && qty > 0 && ctx.pendingProductId) {
      const cartId = await ensureCart(customerId, ctx);
      await api.post(`/cart/${cartId}/items`, { productId: ctx.pendingProductId, quantity: qty });
      ctx.pendingProductId = undefined;
      replies.push("Added to cart! ✅");
      replies.push(await cartSummary(customerId, ctx));
      state = "cart";
    } else {
      replies.push("Please reply with a valid quantity, e.g. 2");
    }
  } else if (state === "cart") {
    if (lower === "checkout") {
      state = "checkout_address";
      replies.push("Please type your delivery address:");
    } else {
      replies.push("Reply 'checkout' to place the order, or 0 for the main menu.");
    }
  } else if (state === "checkout_address") {
    ctx.pendingAddress = text;
    await ensureCart(customerId, ctx);
    const { data: cart } = await api.get(`/cart/${customerId}`, { params: { channel: "whatsapp" } });
    const total = cart.items.reduce((sum: number, it: any) => sum + it.product.priceInPaise * it.quantity, 0);
    state = "checkout_confirm";
    replies.push(`Order total: ${formatRupees(total)}. Payment: Cash on Delivery.\nReply YES to confirm the order.`);
  } else if (state === "checkout_confirm") {
    if (["yes", "y", "haan", "ha"].includes(lower)) {
      const { data: cart } = await api.get(`/cart/${customerId}`, { params: { channel: "whatsapp" } });
      const items = cart.items.map((it: any) => ({ productId: it.productId, quantity: it.quantity }));
      const { data: order } = await api.post("/orders", {
        phone,
        channel: "whatsapp",
        items,
        deliveryAddress: ctx.pendingAddress,
        paymentMethod: "cod",
      });
      await api.delete(`/cart/${cart.id}`);
      ctx.pendingAddress = undefined;
      state = "idle";
      replies.push(
        `Order placed! ✅ Order #${order.orderNumber}, Total: ${formatRupees(order.totalInPaise)}. It will reach you soon. Thank you!`
      );
    } else {
      state = "cart";
      replies.push("Order not confirmed. " + (await cartSummary(customerId, ctx)));
    }
  } else if (state === "orders") {
    const match = /^r(\d+)$/i.exec(text);
    if (match && ctx.lastListItems) {
      const idx = Number(match[1]) - 1;
      const orderId = ctx.lastListItems[idx];
      if (orderId) {
        const { data: order } = await api.get(`/orders/history/${phone}`).then((r) => ({
          data: r.data.find((o: any) => o.id === orderId),
        }));
        if (order) {
          const cartId = await ensureCart(customerId, ctx);
          for (const item of order.items) {
            await api.post(`/cart/${cartId}/items`, { productId: item.productId, quantity: item.quantity });
          }
          replies.push("Items added to your cart from that order.");
          replies.push(await cartSummary(customerId, ctx));
          state = "cart";
        }
      }
    } else {
      replies.push("Reply 'R' + order number to reorder (e.g. R1), or 0 for the main menu.");
    }
  } else {
    state = "menu";
    replies.push(mainMenuText());
  }

  await saveSession({ phone, currentState: state, context: ctx });
  return replies;
}

async function cartSummary(customerId: string, ctx: ChatContext): Promise<string> {
  const { data: cart } = await api.get(`/cart/${customerId}`, { params: { channel: "whatsapp" } });
  ctx.cartId = cart.id;
  if (cart.items.length === 0) {
    return "Your cart is empty. Reply 1 to browse categories or 2 to search.";
  }
  let total = 0;
  const lines = cart.items.map((it: any) => {
    const lineTotal = it.product.priceInPaise * it.quantity;
    total += lineTotal;
    return `- ${it.product.name} x${it.quantity} = ${formatRupees(lineTotal)}`;
  });
  return ["Your cart:", ...lines, `Total: ${formatRupees(total)}`, "", "Reply 'checkout' to place the order."].join(
    "\n"
  );
}
