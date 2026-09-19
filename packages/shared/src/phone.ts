/**
 * Single source of truth for phone normalization. Both the website checkout
 * and the WhatsApp bot's inbound sender ID must go through this before any
 * Customer lookup/insert, or the same person ends up as two customers.
 *
 * Normalizes to E.164 for Indian mobile numbers: +91XXXXXXXXXX
 */
export function normalizePhone(raw: string): string | null {
  if (!raw) return null;

  // whatsapp-web.js ids look like "919876543210@c.us" or "919876543210@g.us"
  let digits = raw.split("@")[0].replace(/\D/g, "");

  // Strip a leading "0" trunk prefix (e.g. 09876543210)
  if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  // Strip a leading country code "91" if present, so we can re-add it consistently
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }

  if (digits.length !== 10) {
    return null; // not a valid Indian mobile number
  }

  return `+91${digits}`;
}

export function isValidPhone(raw: string): boolean {
  return normalizePhone(raw) !== null;
}
