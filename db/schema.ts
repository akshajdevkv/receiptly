import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const receipts = sqliteTable("receipts", {
  id: text("id").primaryKey(), merchant: text("merchant").notNull(),
  purchaseDate: text("purchase_date").notNull(), receiptNumber: text("receipt_number").notNull(),
  currency: text("currency").notNull(), subtotal: integer("subtotal_cents"), tax: integer("tax_cents"),
  tip: integer("tip_cents"), total: integer("total_cents"), paymentMethod: text("payment_method").notNull(),
  category: text("category").notNull(), itemsJson: text("items_json").notNull(), imageKey: text("image_key").notNull(),
  imageType: text("image_type").notNull(), createdAt: integer("created_at").notNull(),
});
