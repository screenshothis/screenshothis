ALTER TABLE "users" DROP CONSTRAINT "users_current_workspace_id_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "workspaces" DROP CONSTRAINT "workspaces_owner_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_current_workspace_id_workspaces_id_fk" FOREIGN KEY ("current_workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" DROP COLUMN "owner_id";