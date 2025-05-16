import { resolveCurrencyFormat } from "@sumup/intl";
import type { Currency, Locale } from "@sumup/intl/dist/es/types";

type CurrencyFormatterOptions = {
	locale?: Locale | Array<Locale>;
	currency?: Currency;
	options?: Intl.NumberFormatOptions;
	amount: number;
};

export function currencyFormatter(opts?: CurrencyFormatterOptions | null) {
	const { locale = "en", currency = "USD", options, amount } = opts || {};
	const format = resolveCurrencyFormat(locale, currency);
	const value = amount ?? 0;

	if (!format) {
		throw new Error("Currency format not found");
	}

	return new Intl.NumberFormat(locale, {
		...format,
		...options,
	}).format(value);
}
