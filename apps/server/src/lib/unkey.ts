import { Unkey } from "@unkey/api";

export const unkey = new Unkey({
	token: process.env.UNKEY_ROOT_KEY ?? "",
});
