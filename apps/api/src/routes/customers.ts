import { Router } from "express";
import { findOrCreateCustomerByPhone, getCustomerByPhone, saveAddress } from "../services/customerService";

export const customersRouter = Router();

// Used by website checkout: identify (or create) a customer by phone.
customersRouter.post("/customers/identify", async (req, res) => {
  try {
    const { phone, name, channel, whatsappProfileName } = req.body;
    const customer = await findOrCreateCustomerByPhone(phone, {
      name,
      whatsappProfileName,
      sourceChannel: channel === "whatsapp" ? "whatsapp" : "website",
    });
    res.json(customer);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

customersRouter.get("/customers/by-phone/:phone", async (req, res) => {
  const customer = await getCustomerByPhone(req.params.phone);
  if (!customer) return res.status(404).json({ error: "Customer not found" });
  res.json(customer);
});

customersRouter.post("/customers/:id/address", async (req, res) => {
  const { fullAddress, pincode } = req.body;
  const address = await saveAddress(req.params.id, fullAddress, pincode);
  res.json(address);
});
