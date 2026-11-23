// Currencies the app supports everywhere (profile, transactions, conversion).
// Keep this list in sync with the Preferred Currency dropdown in the frontend.
const SUPPORTED_CURRENCIES = ["CAD", "USD", "EUR", "GBP", "INR", "AUD", "JPY", "CNY"];

const DEFAULT_CURRENCY = "CAD";

const normalizeCurrency = (value) =>
    String(value || "").trim().toUpperCase();

const isSupportedCurrency = (value) =>
    SUPPORTED_CURRENCIES.includes(normalizeCurrency(value));

module.exports = {
    SUPPORTED_CURRENCIES,
    DEFAULT_CURRENCY,
    normalizeCurrency,
    isSupportedCurrency
};
