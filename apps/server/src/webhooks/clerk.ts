import { verifyWebhook } from "@clerk/backend/webhooks";
import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

import type { Variables } from "#/common/environment";
import { db } from "#/db";
import { accessTokens } from "#/db/schema/access-tokens";
import { users } from "#/db/schema/auth";
import { workspaces } from "#/db/schema/workspaces";
import { unkey } from "#/lib/unkey";

export async function handleClerkWebhook(c: Context<{ Variables: Variables }>) {
	try {
		if (!process.env.CLERK_WEBHOOK_SIGNING_SECRET) {
			throw new HTTPException(500, {
				message: "Error occurred -- no Clerk webhook secret",
			});
		}

		const evt = await verifyWebhook(c.req.raw, {
			signingSecret: process.env.CLERK_WEBHOOK_SIGNING_SECRET,
		});

		const eventType = evt.type;

		if (eventType === "user.created") {
			const email = evt.data.email_addresses[0]?.email_address;

			if (!email) {
				throw new HTTPException(400, {
					message: "Error occurred -- no email address",
				});
			}

			const user = await db
				.insert(users)
				.values({
					externalId: evt.data.id ?? "",
					username: evt.data.username ?? null,
					firstName: evt.data.first_name ?? null,
					lastName: evt.data.last_name ?? null,
					imageUrl: evt.data.image_url,
					email,
				})
				.returning({ id: users.id });

			if (!user[0]?.id) {
				throw new HTTPException(500, {
					message: "Error occurred -- could not create user",
				});
			}

			const workspace = await db
				.insert(workspaces)
				.values({
					name: `${evt.data.first_name ?? evt.data.last_name ?? ""}'s Workspace`,
					isPersonal: true,
					ownerId: user[0]?.id,
				})
				.returning({ id: workspaces.id, name: workspaces.name });

			if (!workspace[0]?.id) {
				throw new HTTPException(500, {
					message: "Error occurred -- could not create workspace",
				});
			}

			const key = await unkey.keys.create({
				apiId: process.env.UNKEY_API_ID ?? "",
				name: `${workspace[0]?.name} API Key`,
				externalId: workspace[0]?.id,
			});

			if (!key.result) {
				throw new HTTPException(500, {
					message: "Error occurred -- could not create key",
				});
			}

			await db.insert(accessTokens).values({
				token: key.result.key,
				externalId: key.result.keyId,
				workspaceId: workspace[0]?.id,
			});

			return c.text("Webhook received");
		}

		if (eventType === "user.updated") {
			const email = evt.data.email_addresses[0]?.email_address;
			if (!email) {
				throw new HTTPException(400, {
					message: "Error occurred -- no email address",
				});
			}
			await db
				.update(users)
				.set({
					externalId: evt.data.id ?? "",
					username: evt.data.username ?? null,
					firstName: evt.data.first_name ?? null,
					lastName: evt.data.last_name ?? null,
					imageUrl: evt.data.image_url,
				})
				.where(eq(users.email, email));
			return c.text("Webhook received");
		}

		if (eventType === "user.deleted") {
			const externalId = evt.data.id;
			if (!externalId) {
				throw new HTTPException(400, {
					message: "Error occurred -- no external ID",
				});
			}
			await db.delete(users).where(eq(users.externalId, externalId));
			return c.text("Webhook received");
		}

		// For all other event types, return 200 OK
		return c.text("Webhook received");
	} catch (error) {
		console.error(error);
		throw new HTTPException(500, {
			message: "Error occurred -- could not verify webhook",
		});
	}
}
