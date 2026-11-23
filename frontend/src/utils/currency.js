// Shared currency helpers for Smart Spend.
// Keep this list in sync with backend/src/config/currencies.js.
export const CURRENCIES = [
    "CAD",
    "USD",
    "EUR",
    "GBP",
    "INR",
    "AUD",
    "JPY",
    "CNY",
];

export const DEFAULT_CURRENCY = "CAD";

// formatMoney(1234.5, "USD") -> "US$1,234.50"
export function formatMoney(amount, currency = DEFAULT_CURRENCY) {
    try {
        return new Intl.NumberFormat("en-CA", {
            style: "currency",
            currency: currency || DEFAULT_CURRENCY,
        }).format(Number(amount || 0));
    } catch {
        return `${Number(amount || 0).toFixed(2)} ${currency}`;
    }
}

// The amount to use in totals. When transactions are loaded with
// ?currency=XXX the API adds converted_amount in that currency.
export function getDisplayAmount(transaction) {
    return Number(
        transaction.converted_amount ?? transaction.amount ?? 0
    );
}

// True when a transaction was entered in a different currency
// from the one the page is showing.
export function isForeignAmount(transaction, displayCurrency) {
    return (
        Boolean(transaction.currency) &&
        Boolean(displayCurrency) &&
        transaction.currency !== displayCurrency
    );
}

// Short note explaining which exchange rates were used.
export function getRateNote(rateSource, rateDate) {
    if (rateSource === "live" && rateDate) {
        return `Exchange rates from ${rateDate} (European Central Bank).`;
    }

    if (rateSource === "fallback") {
        return "Live exchange rates are unavailable, so approximate rates are used.";
    }

    return "";
}
