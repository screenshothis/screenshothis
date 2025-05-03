import { drizzle } from "drizzle-orm/d1";

export const db = drizzle(process.env.DATABASE_URL || "");
