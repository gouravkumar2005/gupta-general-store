"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { X, LocateFixed, Search, MapPin, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

type LocationResult = {
  address: string;
  pincode: string | null;
  latitude: number;
  longitude: number;
};

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629]; // India, whole-country view
const DEFAULT_ZOOM = 5;

export default function LocationPicker({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (result: LocationResult) => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [locating, setLocating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);

  // Mount the Leaflet map on open (dynamic import: Leaflet touches `window`,
  // so it must never run during SSR).
  useEffect(() => {
    if (!open || !mapContainerRef.current || mapRef.current) return;
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !mapContainerRef.current) return;
      const map = L.map(mapContainerRef.current).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);
      mapRef.current = map;
      setReady(true);
      setTimeout(() => map.invalidateSize(), 100);

      // Best-effort: try to center on the user's current location right away.
      // Silent (no error message) since this is opportunistic, not user-initiated.
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => map.setView([pos.coords.latitude, pos.coords.longitude], 16),
          () => {},
          { timeout: 5000 }
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Tear the map down when the picker closes so reopening starts fresh
  // (Leaflet errors if you re-init a map onto a container that already has one).
  useEffect(() => {
    if (!open && mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      setReady(false);
      setPickerError(null);
    }
  }, [open]);

  if (!open) return null;

  function useCurrentLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    setPickerError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapRef.current?.setView([pos.coords.latitude, pos.coords.longitude], 16);
        setLocating(false);
      },
      () => {
        setPickerError("Couldn't get your location. Allow location access, or search/pan the map instead.");
        setLocating(false);
      },
      { timeout: 8000 }
    );
  }

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setPickerError(null);
    try {
      const results = await api.geocodeSearch(query.trim());
      if (results.length === 0) {
        setPickerError("No matching place found.");
        return;
      }
      mapRef.current?.setView([results[0].lat, results[0].lon], 16);
    } catch {
      setPickerError("Search failed. Try again.");
    } finally {
      setSearching(false);
    }
  }

  async function confirmLocation() {
    if (!mapRef.current) return;
    setConfirming(true);
    setPickerError(null);
    try {
      const center = mapRef.current.getCenter();
      const result = await api.geocodeReverse(center.lat, center.lng);
      onConfirm({
        address: result.displayName,
        pincode: result.pincode,
        latitude: center.lat,
        longitude: center.lng,
      });
    } catch {
      setPickerError("Couldn't fetch the address for this spot. Try again.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] flex flex-col animate-slide-up sm:animate-pop">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <MapPin className="text-brand-dark" size={20} />
            <h2 className="font-extrabold text-gray-900">Select delivery location</h2>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto">
          <form onSubmit={search} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for area, street..."
                className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition disabled:opacity-50"
            >
              {searching ? <Loader2 className="animate-spin" size={16} /> : "Go"}
            </button>
          </form>

          <div className="relative h-64 sm:h-80 rounded-xl overflow-hidden border bg-gray-50">
            <div ref={mapContainerRef} className="absolute inset-0" />
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="animate-spin text-gray-400" size={24} />
              </div>
            )}
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full z-[1000]">
              <MapPin className="text-rose-600 drop-shadow-lg" size={36} strokeWidth={2} fill="currentColor" />
            </div>
          </div>

          {pickerError && <p className="text-xs text-red-600 font-medium">{pickerError}</p>}

          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={locating}
            className="w-full flex items-center justify-center gap-2 border-2 border-brand text-brand font-semibold py-2.5 rounded-lg hover:bg-brand-light transition disabled:opacity-50"
          >
            {locating ? <Loader2 className="animate-spin" size={16} /> : <LocateFixed size={16} />}
            Use current location
          </button>
        </div>

        <div className="p-4 border-t flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 rounded-xl font-semibold border text-gray-600 hover:bg-gray-50 transition"
          >
            Skip, I&apos;ll type it
          </button>
          <button
            type="button"
            onClick={confirmLocation}
            disabled={!ready || confirming}
            className="flex-1 bg-brand text-white py-3 rounded-xl font-bold shadow-md hover:bg-brand-dark transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {confirming && <Loader2 className="animate-spin" size={18} />}
            {confirming ? "Locating address..." : "Confirm this location"}
          </button>
        </div>
      </div>
    </div>
  );
}
