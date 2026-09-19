"use client";

import { useState } from "react";
import { Lightbulb, CheckCircle2, Clock, MessageCircle, Globe } from "lucide-react";
import { api, formatRupees, type Order } from "@/lib/api";

export default function OrdersPage() {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.getOrderHistory(phone);
      setOrders(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-extrabold text-gray-900">My Orders</h1>
      <form onSubmit={lookup} className="flex gap-2">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Enter your phone number"
          className="flex-1 border rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <button className="bg-brand text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-brand-dark transition">
          View
        </button>
      </form>

      {loading && <p className="text-gray-500">Loading...</p>}

      {orders && orders.length === 0 && (
        <p className="text-gray-500 text-center py-8">No orders found for this number.</p>
      )}

      <p className="text-xs text-gray-400 bg-brand-light rounded-lg px-3 py-2 flex items-start gap-1.5">
        <Lightbulb size={14} className="shrink-0 mt-0.5" />
        <span>Orders placed here or via our WhatsApp bot both show up in this same history.</span>
      </p>

      <div className="space-y-3">
        {orders?.map((o) => (
          <div key={o.id} className="border rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-gray-900">#{o.orderNumber}</span>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                  o.status === "delivered" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                }`}
              >
                {o.status === "delivered" ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={13} /> Delivered
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Clock size={13} /> Placed
                  </span>
                )}
              </span>
            </div>
            <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
              via{" "}
              {o.channel === "whatsapp" ? (
                <span className="flex items-center gap-1">
                  <MessageCircle size={12} /> WhatsApp
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Globe size={12} /> Website
                </span>
              )}
              · {new Date(o.createdAt).toLocaleString()}
            </div>
            <ul className="text-sm text-gray-700 mb-2 space-y-0.5">
              {o.items.map((it) => (
                <li key={it.id}>
                  {it.productNameSnapshot} <span className="text-gray-400">x{it.quantity}</span>
                </li>
              ))}
            </ul>
            <div className="text-right font-bold text-gray-900 border-t pt-2">{formatRupees(o.totalInPaise)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
