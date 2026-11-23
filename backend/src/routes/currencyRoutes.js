const express = require("express");

const {
    getCurrencies,
    getExchangeRates,
    convertAmount
} = require("../controllers/currencyController");

const router = express.Router();

// List supported currencies
router.get("/", getCurrencies);

// Exchange rates, e.g. /api/currency/rates?base=USD
router.get("/rates", getExchangeRates);

// Convert, e.g. /api/currency/convert?amount=100&from=USD&to=CAD
router.get("/convert", convertAmount);

module.exports = router;
