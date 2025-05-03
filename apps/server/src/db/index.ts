import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

export const db = drizzle(process.env.DATABASE_URL || "");

await migrate(db, {
	migrationsFolder: "./migrations",
});
