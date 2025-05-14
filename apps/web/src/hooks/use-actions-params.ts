import { parseAsStringLiteral, useQueryStates } from "nuqs";

export function useActionsParams() {
	const [params, setParams] = useQueryStates({
		action: parseAsStringLiteral(["create"]),
		resource: parseAsStringLiteral(["api-key"]),
	});

	return {
		...params,
		setParams,
	};
}
