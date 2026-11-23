import { useEffect, useState } from "react";
import "./BudgetHistory.css";
import {
    formatMoney,
    getRateNote,
} from "../utils/currency";

// Number of months shown at once, and how far the arrows move.
const WINDOW_SIZE = 12;
const STEP = 12;

function getCurrentMonth() {
    const now = new Date();

    return `${now.getFullYear()}-${String(
        now.getMonth() + 1
    ).padStart(2, "0")}`;
}

// "2026-11" + 2 -> "2027-01"
function addMonths(month, count) {
    const [year, monthNumber] = month.split("-").map(Number);
    const date = new Date(year, monthNumber - 1 + count, 1);

    return `${date.getFullYear()}-${String(
        date.getMonth() + 1
    ).padStart(2, "0")}`;
}

function getShortLabel(month) {
    const [year, monthNumber] = month.split("-").map(Number);

    return new Date(year, monthNumber - 1, 1).toLocaleDateString(
        "en-CA",
        {
            month: "short",
            year: "numeric",
        }
    );
}

const STATUS_LABELS = {
    past: "Past",
    current: "Now",
    future: "Upcoming",
};

// Budget vs. spending for past, current and future months.
// Shown on the Reports page.
function BudgetHistory({ userId, currency = "CAD" }) {
    const currentMonth = getCurrentMonth();

    // "past": this month and earlier (this month at the top).
    // "upcoming": the next 12 months (nearest first).
    const [view, setView] = useState("past");

    // Last month shown in the "past" view. Starts at this month;
    // the arrows move it back to see older months.
    const [pastEndMonth, setPastEndMonth] =
        useState(currentMonth);

    const [months, setMonths] = useState([]);
    const [rateNote, setRateNote] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fromMonth =
        view === "past"
            ? addMonths(pastEndMonth, -(WINDOW_SIZE - 1))
            : addMonths(currentMonth, 1);

    const toMonth = addMonths(fromMonth, WINDOW_SIZE - 1);

    const atCurrentMonth = pastEndMonth >= currentMonth;

    useEffect(() => {
        async function loadHistory() {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `/api/budgets/${userId}/history?from=${fromMonth}&to=${toMonth}`
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Could not load budget history."
                    );
                }

                setMonths(data.months || []);
                setRateNote(
                    getRateNote(data.rateSource, data.rateDate)
                );
            } catch (loadError) {
                console.error(
                    "Budget history error:",
                    loadError
                );
                setError(loadError.message);
            } finally {
                setLoading(false);
            }
        }

        if (userId) {
            loadHistory();
        }
    }, [userId, fromMonth, toMonth, currency]);

    // Past view: most recent month first (this month at the top).
    // Upcoming view: nearest month first.
    const rows =
        view === "past" ? [...months].reverse() : months;

    const budgetedMonths = months.filter(
        (month) => month.hasBudget && month.status !== "future"
    );

    const monthsWithinBudget = budgetedMonths.filter(
        (month) => !month.overBudget
    ).length;

    const largestValue = Math.max(
        1,
        ...months.map((month) =>
            Math.max(
                Number(month.budgetAmount || 0),
                Number(month.totalSpent || 0)
            )
        )
    );

    return (
        <article className="report-chart-card budget-history">
            <div className="budget-history-top">
                <div className="report-card-heading">
                    <h2>Monthly Budgets</h2>
                    <p>
                        Compare your budget with what you
                        spent in past, current and upcoming
                        months.
                    </p>
                </div>

                <div className="budget-history-controls">
                    <div
                        className="budget-history-tabs"
                        role="group"
                        aria-label="Which months to show"
                    >
                        <button
                            type="button"
                            className={
                                view === "past"
                                    ? "active-history-tab"
                                    : ""
                            }
                            aria-pressed={view === "past"}
                            onClick={() => setView("past")}
                        >
                            Past &amp; current
                        </button>

                        <button
                            type="button"
                            className={
                                view === "upcoming"
                                    ? "active-history-tab"
                                    : ""
                            }
                            aria-pressed={view === "upcoming"}
                            onClick={() => setView("upcoming")}
                        >
                            Upcoming
                        </button>
                    </div>

                    <div
                        className="budget-history-range"
                        aria-label="Months shown"
                    >
                        {view === "past" && (
                            <button
                                type="button"
                                onClick={() =>
                                    setPastEndMonth(
                                        addMonths(pastEndMonth, -STEP)
                                    )
                                }
                                aria-label="Show earlier months"
                            >
                                ‹
                            </button>
                        )}

                        <span>
                            {view === "past"
                                ? `${getShortLabel(toMonth)} – ${getShortLabel(fromMonth)}`
                                : `${getShortLabel(fromMonth)} – ${getShortLabel(toMonth)}`}
                        </span>

                        {view === "past" && (
                            <button
                                type="button"
                                onClick={() =>
                                    setPastEndMonth(
                                        atCurrentMonth
                                            ? currentMonth
                                            : addMonths(pastEndMonth, STEP) > currentMonth
                                                ? currentMonth
                                                : addMonths(pastEndMonth, STEP)
                                    )
                                }
                                disabled={atCurrentMonth}
                                aria-label="Show later months"
                            >
                                ›
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {error && (
                <p className="reports-error">{error}</p>
            )}

            {loading ? (
                <p className="budget-history-status">
                    Loading budgets...
                </p>
            ) : (
                <>
                    {view === "past" && budgetedMonths.length > 0 && (
                        <p className="budget-history-score">
                            Within budget in{" "}
                            <strong>
                                {monthsWithinBudget} of{" "}
                                {budgetedMonths.length}
                            </strong>{" "}
                            budgeted months shown.
                        </p>
                    )}

                    <div className="budget-history-legend">
                        <span>
                            <i className="legend-budget" /> Budget
                        </span>
                        <span>
                            <i className="legend-spent" /> Spent
                        </span>
                        <span>
                            <i className="legend-over" /> Over budget
                        </span>
                    </div>

                    {view === "upcoming" && (
                        <p className="budget-history-hint">
                            {months.some((month) => month.hasBudget)
                                ? "Budgets you have planned for the coming months."
                                : "No upcoming budgets yet. Go to the Budget tab and use › to plan a future month."}
                        </p>
                    )}

                    <ul className="budget-history-list">
                        {rows.map((month) => {
                            const budget = Number(month.budgetAmount || 0);
                            const spent = Number(month.totalSpent || 0);

                            return (
                                <li
                                    key={month.month}
                                    className={`budget-history-row status-${month.status}`}
                                >
                                    <div className="budget-history-month">
                                        <strong>
                                            {getShortLabel(month.month)}
                                        </strong>
                                        <span
                                            className={`history-status history-status-${month.status}`}
                                        >
                                            {STATUS_LABELS[month.status]}
                                        </span>
                                    </div>

                                    <div className="budget-history-bars">
                                        <div className="history-bar-track">
                                            <div
                                                className="history-bar history-bar-budget"
                                                style={{
                                                    width: `${(budget / largestValue) * 100}%`,
                                                }}
                                            />
                                        </div>
                                        <div className="history-bar-track">
                                            <div
                                                className={
                                                    month.overBudget
                                                        ? "history-bar history-bar-over"
                                                        : "history-bar history-bar-spent"
                                                }
                                                style={{
                                                    width: `${(spent / largestValue) * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="budget-history-numbers">
                                        <span>
                                            {month.hasBudget
                                                ? formatMoney(budget, currency)
                                                : "No budget"}
                                        </span>
                                        {(month.status !== "future" || spent > 0) && (
                                            <span>
                                                {formatMoney(spent, currency)} spent
                                            </span>
                                        )}
                                        {month.hasBudget && (
                                            <span
                                                className={
                                                    month.overBudget
                                                        ? "history-over"
                                                        : "history-left"
                                                }
                                            >
                                                {month.overBudget
                                                    ? `${formatMoney(
                                                        Math.abs(month.remaining),
                                                        currency
                                                    )} over`
                                                    : `${formatMoney(
                                                        month.remaining,
                                                        currency
                                                    )} left`}
                                            </span>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>

                    {rateNote && (
                        <p className="budget-history-note">
                            Amounts are shown in {currency}.{" "}
                            {rateNote}
                        </p>
                    )}
                </>
            )}
        </article>
    );
}

export default BudgetHistory;
