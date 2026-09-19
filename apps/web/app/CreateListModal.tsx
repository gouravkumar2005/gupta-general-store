"use client";

import { useEffect, useRef, useState } from "react";
import { X, ClipboardList, Loader2, CheckCircle2, XCircle, Mic, MicOff } from "lucide-react";
import { api, formatRupees, type Product } from "@/lib/api";
import { useCart } from "@/lib/cart";
import QuantityControl from "./QuantityControl";

type MatchResult = {
  term: string;
  product: Product | null;
  quantity: number;
};

const UNIT_WORDS =
  "kgs?|kilo(?:gram)?s?|gm?s?|grams?|ltr|litres?|liters?|l|ml|pcs?|pieces?|packets?|dozen";
const ITEM_QTY_RE = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:${UNIT_WORDS})?\\b`, "gi");

function parseListText(raw: string): { term: string; quantity: number }[] {
  const chunks = raw
    .split(/[,\n]+/)
    .map((c) => c.trim())
    .filter(Boolean);

  const parsed: { term: string; quantity: number }[] = [];
  for (const chunk of chunks) {
    ITEM_QTY_RE.lastIndex = 0;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = ITEM_QTY_RE.exec(chunk))) {
      const name = chunk.slice(lastIndex, match.index).trim();
      lastIndex = ITEM_QTY_RE.lastIndex;
      if (name) parsed.push({ term: name, quantity: parseFloat(match[1]) || 1 });
    }
    const trailing = chunk.slice(lastIndex).trim();
    if (trailing) parsed.push({ term: trailing, quantity: 1 });
  }

  // de-dupe by term, keeping the first occurrence's quantity
  const seen = new Map<string, { term: string; quantity: number }>();
  for (const item of parsed) {
    const key = item.term.toLowerCase();
    if (!seen.has(key)) seen.set(key, item);
  }
  return Array.from(seen.values());
}

export default function CreateListModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MatchResult[] | null>(null);
  const [listening, setListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const lastFinalTextRef = useRef("");
  const { addItem } = useCart();

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    setMicSupported(!!SpeechRecognition);
  }, []);

  if (!open) return null;

  function toggleListening() {
    const SpeechRecognition = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    setMicError(null);
    lastFinalTextRef.current = "";
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event: any) => {
      // In continuous mode, some browsers keep re-finalizing the WHOLE
      // running sentence so far instead of just the newest word — e.g.
      // saying "atta", "chini", "dal" one at a time produces final results
      // "atta", "atta chini", "atta chini dal", not three independent
      // words. Taking each raw final result as its own line (as before)
      // printed the whole growing sentence again each time. Instead, diff
      // the latest final transcript against what we've already shown and
      // only add the new suffix as a line.
      let latestFinal: string | null = null;
      for (let i = event.results.length - 1; i >= 0; i--) {
        if (event.results[i].isFinal) {
          latestFinal = event.results[i][0].transcript.trim();
          break;
        }
      }
      if (!latestFinal) return;

      const prev = lastFinalTextRef.current;
      const delta = prev && latestFinal.toLowerCase().startsWith(prev.toLowerCase())
        ? latestFinal.slice(prev.length).trim()
        : latestFinal;
      lastFinalTextRef.current = latestFinal;

      if (delta) {
        setText((prevText) => (prevText.trim() ? prevText.trim() + "\n" : "") + delta);
      }
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = (event: any) => {
      setListening(false);
      const messages: Record<string, string> = {
        "not-allowed": "Microphone access was blocked. Allow it in your browser's site settings and try again.",
        "service-not-allowed": "Microphone access was blocked. Allow it in your browser's site settings and try again.",
        "no-speech": "Didn't catch that — no speech detected. Try again.",
        "audio-capture": "No microphone found on this device.",
        network: "Voice recognition needs an internet connection.",
        aborted: "",
      };
      const message = messages[event.error] ?? "Couldn't start voice input. Please try again.";
      if (message) setMicError(message);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setMicError("Couldn't start voice input. Please try again.");
    }
  }

  async function findItems() {
    const terms = parseListText(text);
    if (terms.length === 0) return;

    setLoading(true);
    try {
      const matches = await Promise.all(
        terms.map(async ({ term, quantity }) => {
          const r = await api.getProducts({ q: term });
          const product = r.items[0] ?? null;
          const floor = product?.isLoose ? product.minOrderQty ?? 0.1 : 1;
          return { term, product, quantity: Math.max(floor, quantity) };
        })
      );
      setResults(matches);
    } finally {
      setLoading(false);
    }
  }

  function updateQty(index: number, qty: number) {
    setResults((prev) =>
      prev &&
      prev.map((r, i) => {
        if (i !== index) return r;
        const floor = r.product?.isLoose ? r.product.minOrderQty ?? 0.1 : 1;
        return { ...r, quantity: qty === 0 ? floor : Math.max(floor, qty) };
      })
    );
  }

  const matchedCount = results?.filter((r) => r.product).length ?? 0;

  function addAllToCart() {
    results?.forEach((r) => {
      if (r.product) addItem(r.product, r.quantity);
    });
    close();
  }

  function close() {
    setText("");
    setResults(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col animate-slide-up sm:animate-pop">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <ClipboardList className="text-brand-dark" size={20} />
            <h2 className="font-extrabold text-gray-900">Create your list</h2>
          </div>
          <button onClick={close} className="text-gray-400 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {!results ? (
            <>
              <p className="text-sm text-gray-500">
                Type or paste your shopping list — one item per line, or separated by commas. We&apos;ll find
                matching products for you.
                {micSupported && (
                  <> Or tap the mic and say your list, like &ldquo;chini 1 kg atta 2 kg&rdquo;.</>
                )}
              </p>
              <div className="relative">
                <textarea
                  autoFocus
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={"e.g.\nAtta\nChini\nToor dal\nBiscuit"}
                  rows={6}
                  className="w-full border rounded-lg px-3 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-brand-dark"
                />
                {micSupported && (
                  <button
                    type="button"
                    onClick={toggleListening}
                    title={listening ? "Stop listening" : "Speak your list"}
                    className={`absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition ${
                      listening
                        ? "bg-red-500 text-white animate-pulse"
                        : "bg-brand text-white hover:bg-brand-dark"
                    }`}
                  >
                    {listening ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>
                )}
              </div>
              {micError && <p className="text-xs text-red-600 font-medium">{micError}</p>}
            </>
          ) : (
            <div className="space-y-2">
              {results.map((r, i) => (
                <div key={r.term + i} className="flex items-center gap-3 border rounded-lg p-2.5">
                  {r.product ? (
                    <CheckCircle2 className="text-brand shrink-0" size={18} />
                  ) : (
                    <XCircle className="text-gray-300 shrink-0" size={18} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-400">You typed &ldquo;{r.term}&rdquo;</div>
                    {r.product ? (
                      <>
                        <div className="text-sm font-semibold text-gray-900 truncate">{r.product.name}</div>
                        <div className="text-xs text-gray-500">{formatRupees(r.product.priceInPaise)}</div>
                      </>
                    ) : (
                      <div className="text-sm text-gray-400 italic">No match found</div>
                    )}
                  </div>
                  {r.product && (
                    <div className={r.product.isLoose ? "w-28 shrink-0" : "w-20 shrink-0"}>
                      <QuantityControl
                        product={r.product}
                        quantity={r.quantity}
                        onChange={(next) => updateQty(i, next)}
                        size="sm"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 border-t">
          {!results ? (
            <button
              onClick={findItems}
              disabled={loading || !text.trim()}
              className="w-full bg-brand text-white py-3 rounded-xl font-bold shadow-md hover:bg-brand-dark transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="animate-spin" size={18} />}
              {loading ? "Finding items..." : "Find Items"}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setResults(null)}
                className="px-4 py-3 rounded-xl font-semibold border text-gray-600 hover:bg-gray-50 transition"
              >
                Edit list
              </button>
              <button
                onClick={addAllToCart}
                disabled={matchedCount === 0}
                className="flex-1 bg-brand text-white py-3 rounded-xl font-bold shadow-md hover:bg-brand-dark transition disabled:opacity-50"
              >
                Add {matchedCount} item{matchedCount === 1 ? "" : "s"} to Cart
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
