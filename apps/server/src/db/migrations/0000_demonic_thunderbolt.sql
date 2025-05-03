CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`external_id` text NOT NULL,
	`username` text,
	`first_name` text,
	`last_name` text,
	`image_url` text NOT NULL,
	`email` text NOT NULL,
	`created_at` bigint DEFAULT 0 NOT NULL,
	`updated_at` bigint
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_external_id_unique` ON `users` (`external_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);