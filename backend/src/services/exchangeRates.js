const {
    SUPPORTED_CURRENCIES,
    DEFAULT_CURRENCY,
    normalizeCurrency
} = require("../config/currencies");

// Free exchange-rate API (European Central Bank reference rates, no API key).
// Docs: https://frankfurter.dev
const RATES_API_URL = "https://api.frankfurter.dev/v1/latest";

// Rates are refreshed at most every 12 hours (the ECB publishes once a day).
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

// When the API is unreachable, wait this long before trying it again so
// every request does not wait on a failing network call.
const RETRY_AFTER_FAILURE_MS = 5 * 60 * 1000;

// Used only if the rates API cannot be reached (e.g. no internet during a demo).
// Approximate values: how much 1 CAD is worth in each currency.
const FALLBACK_RATES_FROM_CAD = {
    CAD: 1,
    USD: 0.72,
    EUR: 0.62,
    GBP: 0.54,
    INR: 61,
    AUD: 1.1,
    JPY: 108,
    CNY: 5.2
};

let cache = null; // { ratesFromCad, date, source, fetchedAt }

const fetchLiveRates = async () => {
    const symbols = SUPPORTED_CURRENCIES
        .filter((code) => code !== DEFAULT_CURRENCY)
        .join(",");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
        const response = await fetch(
            `${RATES_API_URL}?base=${DEFAULT_CURRENCY}&symbols=${symbols}`,
            { signal: controller.signal }
        );

        if (!response.ok) {
            throw new Error(`Rates API responded with ${response.status}`);
        }

        const data = await response.json();

        return {
            ratesFromCad: { ...data.rates, [DEFAULT_CURRENCY]: 1 },
            date: data.date,
            source: "live"
        };
    } finally {
        clearTimeout(timeout);
    }
};

// Returns rates relative to CAD, using the cache when it is fresh.
const getRatesFromCad = async () => {
    const isFresh =
        cache &&
        cache.source === "live" &&
        Date.now() - cache.fetchedAt < CACHE_TTL_MS;

    const recentlyFailed =
        cache &&
        cache.lastFailedAt &&
        Date.now() - cache.lastFailedAt < RETRY_AFTER_FAILURE_MS;

    if (isFresh || recentlyFailed) {
        return cache;
    }

    try {
        const live = await fetchLiveRates();
        cache = { ...live, fetchedAt: Date.now() };
    } catch (err) {
        console.warn("Exchange rates unavailable, using fallback rates:", err.message);

        // Keep the last live rates if we have them; otherwise use the fallback.
        if (!cache) {
            cache = {
                ratesFromCad: FALLBACK_RATES_FROM_CAD,
                date: null,
                source: "fallback",
                fetchedAt: Date.now()
            };
        }

        cache.lastFailedAt = Date.now();
    }

    return cache;
};

// Rates for any base currency, e.g. getRates("USD") -> { CAD: 1.39, EUR: 0.86, ... }
const getRates = async (base = DEFAULT_CURRENCY) => {
    const from = normalizeCurrency(base);
    const { ratesFromCad, date, source } = await getRatesFromCad();

    const rates = {};

    for (const code of SUPPORTED_CURRENCIES) {
        rates[code] = ratesFromCad[code] / ratesFromCad[from];
    }

    return { base: from, rates, date, source };
};

// Builds a converter that reuses one set of rates for many amounts.
const createConverter = async (targetCurrency) => {
    const to = normalizeCurrency(targetCurrency);
    const { ratesFromCad, date, source } = await getRatesFromCad();

    const convert = (amount, fromCurrency) => {
        const from = normalizeCurrency(fromCurrency) || to;

        if (from === to) {
            return Number(amount);
        }

        const fromRate = ratesFromCad[from];
        const toRate = ratesFromCad[to];

        if (!fromRate || !toRate) {
            throw new Error(`Unsupported currency conversion: ${from} to ${to}`);
        }

        return (Number(amount) / fromRate) * toRate;
    };

    return {
        convert,
        info: { currency: to, rateDate: date, rateSource: source }
    };
};

const roundMoney = (value) =>
    Math.round((Number(value) + Number.EPSILON) * 100) / 100;

module.exports = {
    getRates,
    createConverter,
    roundMoney
};
