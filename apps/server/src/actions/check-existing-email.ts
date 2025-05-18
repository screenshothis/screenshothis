import { db } from "#/db";

export async function checkExistingEmail(email: string, userId: string) {
	return db.query.users.findFirst({
		where: (users, { and, eq, ne }) =>
			and(eq(users.email, email), ne(users.id, userId)),
	});
}
