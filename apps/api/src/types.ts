// SQLite (used for local/demo) has no native Prisma enum support, so these
// channel/status fields are stored as plain strings in the DB and typed as
// unions here in application code instead.
export type Channel = "website" | "whatsapp";
export type OrderStatusValue = "placed" | "delivered";
export type PaymentMethod = "cod" | "online";
export type PaymentStatusValue = "pending" | "paid" | "failed";
