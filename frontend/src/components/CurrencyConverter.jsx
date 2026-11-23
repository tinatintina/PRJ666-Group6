import { useEffect, useState } from "react";
import "./CurrencyConverter.css";
import {
    CURRENCIES,
    formatMoney,
    getRateNote,
} from "../utils/currency";

// Converts an amount between any two supported currencies
// using the backend's exchange rates.
function CurrencyConverter({ defaultCurrency = "CAD" }) {
    const [amount, setAmount] = useState("100");
    const [from, setFrom] = useState(
        defaultCurrency === "USD" ? "CAD" : "USD"
    );
    const [to, setTo] = useState(defaultCurrency);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");

    const numericAmount = Number(amount);
    const isValidAmount =
        amount !== "" &&
        Number.isFinite(numericAmount) &&
        numericAmount >= 0;
    const resultKey = `${amount}|${from}|${to}`;

    useEffect(() => {

        if (!isValidAmount) {
            return;
        }

        const requestKey = resultKey;

        let cancelled = false;

        const timer = setTimeout(async () => {
            try {
                const response = await fetch(
                    `/api/currency/convert?amount=${numericAmount}&from=${from}&to=${to}`
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Could not convert currency."
                    );
                }

                if (!cancelled) {
                    setResult({ ...data, key: requestKey });
                    setError("");
                }
            } catch (convertError) {
                if (!cancelled) {
                    setResult(null);
                    setError(convertError.message);
                }
            }
        }, 300);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [numericAmount, from, to, isValidAmount, resultKey]);

    const currentResult =
        isValidAmount && result?.key === resultKey
            ? result
            : null;

    const shownError =
        amount !== "" && !isValidAmount
            ? "Enter a valid amount."
            : error;

    function swapCurrencies() {
        setFrom(to);
        setTo(from);
    }

    return (
        <section className="currency-converter">
            <h2>Currency Converter</h2>
            <p className="currency-converter-intro">
                Check what an amount is worth in another
                currency.
            </p>

            <div className="currency-converter-row">
                <div className="form-group">
                    <label htmlFor="converterAmount">
                        Amount
                    </label>
                    <input
                        id="converterAmount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={amount}
                        onChange={(event) =>
                            setAmount(event.target.value)
                        }
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="converterFrom">
                        From
                    </label>
                    <select
                        id="converterFrom"
                        value={from}
                        onChange={(event) =>
                            setFrom(event.target.value)
                        }
                    >
                        {CURRENCIES.map((code) => (
                            <option key={code} value={code}>
                                {code}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    type="button"
                    className="currency-swap-button"
                    onClick={swapCurrencies}
                    aria-label="Swap currencies"
                >
                    ⇄
                </button>

                <div className="form-group">
                    <label htmlFor="converterTo">To</label>
                    <select
                        id="converterTo"
                        value={to}
                        onChange={(event) =>
                            setTo(event.target.value)
                        }
                    >
                        {CURRENCIES.map((code) => (
                            <option key={code} value={code}>
                                {code}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {shownError && (
                <p className="field-error" role="alert">
                    {shownError}
                </p>
            )}

            {currentResult && (
                <div
                    className="currency-converter-result"
                    aria-live="polite"
                >
                    <strong>
                        {formatMoney(currentResult.amount, currentResult.from)} ={" "}
                        {formatMoney(currentResult.convertedAmount, currentResult.to)}
                    </strong>
                    <span>
                        1 {currentResult.from} = {currentResult.rate} {currentResult.to}.{" "}
                        {getRateNote(currentResult.rateSource, currentResult.rateDate)}
                    </span>
                </div>
            )}
        </section>
    );
}

export default CurrencyConverter;
