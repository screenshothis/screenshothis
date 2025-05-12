ALTER TABLE "users" DROP CONSTRAINT "users_current_workspace_id_workspaces_id_fk";
--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "active_workspace_id" text;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD COLUMN "role" text;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD COLUMN "status" text NOT NULL;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD COLUMN "expires_at" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD COLUMN "inviter_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD COLUMN "role" text NOT NULL;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "workspace_invitations" ADD CONSTRAINT "workspace_invitations_inviter_id_users_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "current_workspace_id";--> statement-breakpoint
ALTER TABLE "workspaces" DROP COLUMN "is_personal";--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_slug_unique" UNIQUE("slug");