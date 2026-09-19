const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

async function request(path: string, options?: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export type Category = {
  id: string;
  name: string;
  slug: string;
  children: Category[];
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  unit: string;
  packSize?: string;
  priceInPaise: number;
  mrpInPaise?: number;
  imageUrl?: string;
  isAvailable: boolean;
  categoryId: string;
  category?: Category;
  isLoose?: boolean;
  minOrderQty?: number;
};

export type OrderItem = {
  id: string;
  productId: string;
  productNameSnapshot: string;
  unitPriceSnapshot: number;
  quantity: number;
  lineTotalInPaise: number;
};

export type Order = {
  id: string;
  orderNumber: string;
  channel: "website" | "whatsapp";
  status: "placed" | "delivered";
  paymentMethod: string;
  totalInPaise: number;
  deliveryAddress: string;
  createdAt: string;
  items: OrderItem[];
  customer?: { phone: string; name?: string };
};

export const api = {
  getCategories: (): Promise<Category[]> => request("/categories"),
  getProducts: (params: { categoryId?: string; q?: string } = {}) => {
    const search = new URLSearchParams();
    if (params.categoryId) search.set("categoryId", params.categoryId);
    if (params.q) search.set("q", params.q);
    return request(`/products?${search.toString()}`) as Promise<{ items: Product[]; total: number }>;
  },
  getProduct: (id: string): Promise<Product> => request(`/products/${id}`),
  placeOrder: (payload: {
    phone: string;
    name?: string;
    items: { productId: string; quantity: number }[];
    deliveryAddress: string;
    paymentMethod: "cod" | "online";
    latitude?: number;
    longitude?: number;
    label?: string;
  }): Promise<Order> => request("/orders", { method: "POST", body: JSON.stringify({ ...payload, channel: "website" }) }),
  getOrderHistory: (phone: string): Promise<Order[]> => request(`/orders/history/${encodeURIComponent(phone)}`),

  geocodeSearch: (q: string): Promise<{ displayName: string; lat: number; lon: number }[]> =>
    request(`/geocode/search?q=${encodeURIComponent(q)}`),
  geocodeReverse: (lat: number, lon: number): Promise<{ displayName: string; pincode: string | null }> =>
    request(`/geocode/reverse?lat=${lat}&lon=${lon}`),

  // Admin
  adminGetProducts: (): Promise<Product[]> => request("/admin/products"),
  adminGetCategoriesFlat: (): Promise<Category[]> => request("/admin/categories/flat"),
  adminCreateProduct: (payload: Record<string, unknown>) =>
    request("/admin/products", { method: "POST", body: JSON.stringify(payload) }),
  adminUpdateProduct: (id: string, payload: Record<string, unknown>) =>
    request(`/admin/products/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  adminCreateCategory: (payload: Record<string, unknown>) =>
    request("/admin/categories", { method: "POST", body: JSON.stringify(payload) }),
  adminGetOrders: (): Promise<Order[]> => request("/admin/orders"),
  adminMarkDelivered: (orderId: string) => request(`/admin/orders/${orderId}/deliver`, { method: "POST" }),
};

export function formatRupees(paise: number): string {
  return `Rs.${(paise / 100).toFixed(0)}`;
}
