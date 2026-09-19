// Formats a loose-item quantity (in kg) the way a kirana store would say it:
// under 1kg as grams ("100 g"), 1kg and up as kg ("1.5 kg", "2 kg").
export function formatQty(qty: number, unit: string): string {
  if (unit !== "kg") return `${qty}`;
  if (qty < 1) return `${Math.round(qty * 1000)} g`;
  const trimmed = Number(qty.toFixed(2)).toString();
  return `${trimmed} kg`;
}
