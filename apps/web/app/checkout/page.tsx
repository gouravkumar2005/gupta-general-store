"use client";

import { useState } from "react";
import { CheckCircle2, MessageCircle, Banknote, MapPin } from "lucide-react";
import { useCart } from "@/lib/cart";
import { api, formatRupees, type Order } from "@/lib/api";
import LocationPicker from "../LocationPicker";

export default function CheckoutPage() {
  const { lines, totalInPaise, clear } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [colonyArea, setColonyArea] = useState("");
  const [houseNo, setHouseNo] = useState("");
  const [landmark, setLandmark] = useState("");
  const [addressLabel, setAddressLabel] = useState<"Home" | "Work" | "Other">("Home");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  if (placedOrder) {
    return (
      <div className="max-w-lg mx-auto text-center py-14 space-y-3 bg-white rounded-2xl border">
        <CheckCircle2 className="mx-auto text-green-600 animate-pop" size={64} strokeWidth={1.5} />
        <h1 className="text-xl font-extrabold text-gray-900">Order placed!</h1>
        <p className="text-gray-600 font-medium">
          Order #{placedOrder.orderNumber} · {formatRupees(placedOrder.totalInPaise)}
        </p>
        <p className="text-gray-500 text-sm max-w-xs mx-auto bg-brand-light rounded-lg px-3 py-2 flex items-start gap-1.5 text-left">
          <MessageCircle size={16} className="shrink-0 mt-0.5" />
          <span>A confirmation message has been sent to your WhatsApp ({phone}). It will reach you soon.</span>
        </p>
        <a
          href="/orders"
          className="inline-block mt-4 bg-brand text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-brand-dark transition"
        >
          View my orders
        </a>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (lines.length === 0) return;
    setSubmitting(true);
    try {
      const deliveryAddress = [
        houseNo.trim(),
        colonyArea.trim(),
        address.trim(),
        landmark.trim() ? `Landmark: ${landmark.trim()}` : "",
      ]
        .filter(Boolean)
        .join(", ");
      const order = await api.placeOrder({
        phone,
        name,
        deliveryAddress,
        paymentMethod: "cod",
        items: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        label: addressLabel,
      });
      clear();
      setPlacedOrder(order);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-extrabold text-gray-900">Checkout</h1>

      <form onSubmit={submit} className="space-y-4 bg-white border rounded-2xl p-5">
        <div>
          <label className="block text-sm font-semibold mb-1 text-gray-700">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1 text-gray-700">WhatsApp / Phone Number</label>
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="10-digit mobile number"
            className="w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <p className="text-xs text-gray-500 mt-1.5 flex items-start gap-1">
            <MessageCircle size={13} className="shrink-0 mt-0.5" />
            <span>
              We use this to identify you (repeat customers see saved order history) and send the order
              confirmation on WhatsApp.
            </span>
          </p>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-semibold text-gray-700">Delivery Address</label>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark transition"
            >
              <MapPin size={13} />
              {coords ? "Change location on map" : "Select on map"}
            </button>
          </div>
          <textarea
            required
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setCoords(null);
            }}
            placeholder="Street, area, city..."
            className="w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand"
            rows={3}
          />
          {coords && (
            <p className="text-xs text-gray-400 mt-1">
              📍 Map gives the general area only — please add your colony/mohalla name below, it won&apos;t be filled
              in automatically.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1 text-gray-700">Colony/Area/Mohalla</label>
          <input
            value={colonyArea}
            onChange={(e) => setColonyArea(e.target.value)}
            placeholder="e.g. Ganesh Vihar Colony, Sitapur"
            className="w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700">House/Flat/Floor No.</label>
            <input
              value={houseNo}
              onChange={(e) => setHouseNo(e.target.value)}
              placeholder="e.g. Flat 302, 2nd floor"
              className="w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-700">Landmark</label>
            <input
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="e.g. near XYZ temple"
              className="w-full border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1 text-gray-700">Address Type</label>
          <div className="flex gap-2">
            {(["Home", "Work", "Other"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setAddressLabel(l)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition ${
                  addressLabel === l
                    ? "border-brand bg-brand-light text-brand-dark"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1 text-gray-700">Payment</label>
          <div className="text-sm border rounded-lg px-3 py-2.5 bg-brand-light text-gray-700 font-medium flex items-center gap-2">
            <Banknote size={16} />
            Cash on Delivery <span className="text-gray-400 font-normal">(online payment coming soon)</span>
          </div>
        </div>

        <div className="border-t pt-3 flex items-center justify-between font-bold text-gray-900">
          <span>Total</span>
          <span className="text-lg">{formatRupees(totalInPaise)}</span>
        </div>

        {error && <p className="text-red-600 text-sm font-medium">{error}</p>}

        <button
          type="submit"
          disabled={submitting || lines.length === 0}
          className="w-full bg-brand text-white py-3.5 rounded-xl font-bold shadow-md hover:bg-brand-dark transition disabled:opacity-50"
        >
          {submitting ? "Placing order..." : "Place Order"}
        </button>
      </form>

      <LocationPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onConfirm={(result) => {
          setAddress(result.address);
          setCoords({ latitude: result.latitude, longitude: result.longitude });
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
