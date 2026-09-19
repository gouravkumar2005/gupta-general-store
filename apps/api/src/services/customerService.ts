import { normalizePhone } from "@gupta/shared";
import { prisma } from "../lib/db";
import { Channel } from "../types";

/**
 * The one place a Customer row is looked up or created. Every entry point
 * (website checkout, WhatsApp inbound message) must go through this so the
 * same phone number always maps to the same customer, regardless of which
 * channel it came from.
 */
export async function findOrCreateCustomerByPhone(
  rawPhone: string,
  opts: { name?: string; whatsappProfileName?: string; sourceChannel: Channel }
) {
  const phone = normalizePhone(rawPhone);
  if (!phone) {
    throw new Error(`Invalid phone number: ${rawPhone}`);
  }

  const existing = await prisma.customer.findUnique({ where: { phone } });
  if (existing) {
    // Fill in a name if we learn one later and didn't have it before.
    if (opts.name && !existing.name) {
      return prisma.customer.update({
        where: { id: existing.id },
        data: { name: opts.name },
      });
    }
    return existing;
  }

  return prisma.customer.create({
    data: {
      phone,
      name: opts.name,
      whatsappProfileName: opts.whatsappProfileName,
      sourceChannel: opts.sourceChannel,
    },
  });
}

export async function getCustomerByPhone(rawPhone: string) {
  const phone = normalizePhone(rawPhone);
  if (!phone) return null;
  return prisma.customer.findUnique({
    where: { phone },
    include: { addresses: true },
  });
}

export async function saveAddress(
  customerId: string,
  fullAddress: string,
  pincode?: string,
  latitude?: number,
  longitude?: number,
  label: string = "Home"
) {
  // Keep it simple for the demo: one default address per customer, upsert-style.
  const existing = await prisma.address.findFirst({
    where: { customerId, isDefault: true },
  });
  if (existing) {
    return prisma.address.update({
      where: { id: existing.id },
      data: { fullAddress, pincode, latitude, longitude, label },
    });
  }
  return prisma.address.create({
    data: { customerId, fullAddress, pincode, latitude, longitude, label, isDefault: true },
  });
}
