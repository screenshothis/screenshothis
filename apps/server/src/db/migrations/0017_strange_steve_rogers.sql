ALTER TABLE "polar_customer_state" DROP CONSTRAINT "polar_customer_state_external_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "polar_customer_state" ADD CONSTRAINT "polar_customer_state_external_id_workspaces_id_fk" FOREIGN KEY ("external_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;