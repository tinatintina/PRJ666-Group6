const {
    SUPPORTED_CURRENCIES,
    DEFAULT_CURRENCY,
    normalizeCurrency,
    isSupportedCurrency
} = require("../config/currencies");

const {
    getRates,
    createConverter,
    roundMoney
} = require("../services/exchangeRates");


// GET supported currencies
const getCurrencies = (req, res) => {
    return res.status(200).json({
        success: true,
        defaultCurrency: DEFAULT_CURRENCY,
        currencies: SUPPORTED_CURRENCIES
    });
};


// GET exchange rates (optional ?base=USD, default CAD)
const getExchangeRates = async (req, res) => {
    const base = normalizeCurrency(req.query.base || DEFAULT_CURRENCY);

    if (!isSupportedCurrency(base)) {
        return res.status(400).json({
            success: false,
            message: `Currency must be one of: ${SUPPORTED_CURRENCIES.join(", ")}.`
        });
    }

    try {
        const { rates, date, source } = await getRates(base);

        const roundedRates = {};
        for (const [code, rate] of Object.entries(rates)) {
            roundedRates[code] = Number(rate.toFixed(6));
        }

        return res.status(200).json({
            success: true,
            base,
            rates: roundedRates,
            rateDate: date,
            rateSource: source
        });

    } catch (err) {
        console.error("Get exchange rates error:", err);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching exchange rates."
        });
    }
};


// GET convert an amount: ?amount=100&from=USD&to=CAD
const convertAmount = async (req, res) => {
    const amount = Number(req.query.amount);
    const from = normalizeCurrency(req.query.from);
    const to = normalizeCurrency(req.query.to);

    if (req.query.amount === undefined || !Number.isFinite(amount) || amount < 0) {
        return res.status(400).json({
            success: false,
            message: "Amount must be a valid non-negative number."
        });
    }

    if (!isSupportedCurrency(from) || !isSupportedCurrency(to)) {
        return res.status(400).json({
            success: false,
            message: `From and to currencies must be one of: ${SUPPORTED_CURRENCIES.join(", ")}.`
        });
    }

    try {
        const { convert, info } = await createConverter(to);
        const converted = convert(amount, from);

        return res.status(200).json({
            success: true,
            amount,
            from,
            to,
            convertedAmount: roundMoney(converted),
            rate: Number(convert(1, from).toFixed(6)),
            rateDate: info.rateDate,
            rateSource: info.rateSource
        });

    } catch (err) {
        console.error("Convert amount error:", err);

        return res.status(500).json({
            success: false,
            message: "Server error while converting currency."
        });
    }
};


module.exports = {
    getCurrencies,
    getExchangeRates,
    convertAmount
};
