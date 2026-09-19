"use client";

import { useEffect, useState } from "react";
import { api, formatRupees, type Order } from "@/lib/api";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  function refresh() {
    setLoading(true);
    api
      .adminGetOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function deliver(id: string) {
    await api.adminMarkDelivered(id);
    refresh();
  }

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">Orders</h1>
      {orders.length === 0 && <p className="text-gray-500">No orders yet.</p>}
      {orders.map((o) => (
        <div key={o.id} className="border rounded-lg bg-white p-4 flex items-center justify-between gap-4">
          <div>
            <div className="font-medium">
              #{o.orderNumber} - {formatRupees(o.totalInPaise)}
            </div>
            <div className="text-xs text-gray-500">
              {o.customer?.phone} - {o.customer?.name ?? "no name"} - via {o.channel} -{" "}
              {new Date(o.createdAt).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">{o.deliveryAddress}</div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                o.status === "delivered" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
              }`}
            >
              {o.status}
            </span>
            {o.status !== "delivered" && (
              <button
                onClick={() => deliver(o.id)}
                className="bg-brand hover:bg-brand-dark text-white text-sm px-3 py-2 rounded-lg font-semibold whitespace-nowrap transition"
              >
                Mark Delivered
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
