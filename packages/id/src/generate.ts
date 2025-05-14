import baseX from "base-x";

const b58 = baseX("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz");

const prefixes = {
	user: "user",
	workspace: "ws",
	organization: "ws", // better-auth/organization
	workspaceMember: "wsmem",
	member: "wsmem", // better-auth/organization
	workspaceInvitation: "wsinv",
	invitation: "wsinv", // better-auth/organization
	screenshot: "ss",
	polarCustomerState: "plrcs",
	session: "se",
	account: "acct",
	verification: "vrf",
	requestLimit: "rl",
	apikey: "key",
} as const;

export function generateId<TPrefix extends keyof typeof prefixes>(
	prefix: TPrefix | string,
	numRandomBytes = 8,
) {
	const timestampBytes = 4;
	const totalBytes = timestampBytes + numRandomBytes;
	const buf = crypto.getRandomValues(new Uint8Array(totalBytes));

	/**
	 * epoch starts more recently so that the 32-bit number space gives a
	 * significantly higher useful lifetime of around 136 years
	 * from 2023-11-14T22:13:20Z to 2159-12-22T04:41:36Z.
	 */
	const EPOCH_TIMESTAMP_SEC = 1_700_000_000; // In seconds

	// Calculate seconds since epoch
	const t = Math.floor(Date.now() / 1000) - EPOCH_TIMESTAMP_SEC;

	buf[0] = (t >>> 24) & 255;
	buf[1] = (t >>> 16) & 255;
	buf[2] = (t >>> 8) & 255;
	buf[3] = t & 255;

	return `${prefixes[prefix as keyof typeof prefixes] ?? prefix}_${b58.encode(buf)}` as const;
}
