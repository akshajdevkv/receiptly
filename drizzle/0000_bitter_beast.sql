CREATE TABLE `receipts` (
	`id` text PRIMARY KEY NOT NULL,
	`merchant` text NOT NULL,
	`purchase_date` text NOT NULL,
	`receipt_number` text NOT NULL,
	`currency` text NOT NULL,
	`subtotal_cents` integer,
	`tax_cents` integer,
	`tip_cents` integer,
	`total_cents` integer,
	`payment_method` text NOT NULL,
	`category` text NOT NULL,
	`items_json` text NOT NULL,
	`image_key` text NOT NULL,
	`image_type` text NOT NULL,
	`created_at` integer NOT NULL
);
