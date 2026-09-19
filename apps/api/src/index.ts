import express from "express";
import cors from "cors";
import { productsRouter } from "./routes/products";
import { customersRouter } from "./routes/customers";
import { ordersRouter } from "./routes/orders";
import { cartRouter } from "./routes/cart";
import { whatsappRouter } from "./routes/whatsapp";
import { geocodeRouter } from "./routes/geocode";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api", productsRouter);
app.use("/api", customersRouter);
app.use("/api", ordersRouter);
app.use("/api", cartRouter);
app.use("/api", whatsappRouter);
app.use("/api", geocodeRouter);

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
