import { verifyWebhook } from "@clerk/backend/webhooks";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

import { db } from "#/db";
import { users } from "#/db/schema/auth";
import { workspaces } from "#/db/schema/workspaces";

export async function handleClerkWebhook(c: Context) {
	try {
		if (!process.env.CLERK_WEBHOOK_SECRET) {
			throw new HTTPException(500, {
				message: "Error occurred -- no Clerk webhook secret",
			});
		}

		const evt = await verifyWebhook(c.req.raw);

		const eventType = evt.type;

		switch (eventType) {
			case "user.created": {
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

				await db.insert(workspaces).values({
					name: `${evt.data.first_name ?? evt.data.last_name ?? ""}'s Workspace`,
					isPersonal: true,
					ownerId: user[0]?.id,
				});

				break;
			}

			default:
				break;
		}

		return c.text("Webhook received");
	} catch (error) {
		console.error(error);

		throw new HTTPException(500, {
			message: "Error occurred -- could not verify webhook",
		});
	}
}
