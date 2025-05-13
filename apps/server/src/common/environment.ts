import type { Session, User } from "better-auth";

export type Environment = {
	CORS_ORIGIN: string;
};

export type Variables = {
	workspaceId: string;
	session: Session | null;
	user: User | null;
};
