import { useEffect, useState } from "react";
import "./BudgetPage.css";
import { PageHeaderIcon } from "./NavIcon";
import {
    formatMoney,
    getRateNote,
} from "../utils/currency";

function getCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    return `${year}-${month}`;
}

// "2026-11" + 1 -> "2026-12"
function addMonths(month, count) {
    const [year, monthNumber] = month.split("-").map(Number);
    const date = new Date(year, monthNumber - 1 + count, 1);

    return `${date.getFullYear()}-${String(
        date.getMonth() + 1
    ).padStart(2, "0")}`;
}

// "2026-11" -> "November 2026"
function getMonthLabel(month) {
    const [year, monthNumber] = month.split("-").map(Number);

    return new Date(year, monthNumber - 1, 1).toLocaleDateString(
        "en-CA",
        {
            month: "long",
            year: "numeric",
        }
    );
}

const STATUS_LABELS = {
    past: "Past month",
    current: "This month",
    future: "Upcoming month",
};

function BudgetPage({ userId, currency = "CAD" }) {
    // The month being viewed ("YYYY-MM"). Users can move to
    // past months to review them or future months to plan ahead.
    const [selectedMonth, setSelectedMonth] =
        useState(getCurrentMonth);

    const [summary, setSummary] = useState(null);
    const [rateNote, setRateNote] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showBudgetForm, setShowBudgetForm] =
        useState(false);
    const [budgetInput, setBudgetInput] = useState("");
    const [formError, setFormError] = useState("");
    const [savingBudget, setSavingBudget] =
        useState(false);
    const [refreshBudget, setRefreshBudget] =
        useState(0);

    const currentMonth = getCurrentMonth();
    const monthLabel = getMonthLabel(selectedMonth);

    useEffect(() => {
        async function loadBudgetData() {
            if (!userId) {
                setError("No logged-in user found.");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `/api/budgets/${userId}/month/${selectedMonth}`
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Could not load budget."
                    );
                }

                setSummary(data.summary);
                setRateNote(
                    getRateNote(data.rateSource, data.rateDate)
                );
            } catch (loadError) {
                console.error("Budget error:", loadError);
                setSummary(null);
                setError(loadError.message);
            } finally {
                setLoading(false);
            }
        }

        loadBudgetData();
    }, [userId, selectedMonth, refreshBudget, currency]);

    const hasBudget = Boolean(summary?.hasBudget);
    const monthlyBudget = Number(summary?.budgetAmount || 0);
    const totalSpent = Number(summary?.totalSpent || 0);
    const remaining = monthlyBudget - totalSpent;
    const overBudget = hasBudget && totalSpent > monthlyBudget;

    // Budget was set in another currency (before the user changed
    // their preferred currency). Show what was originally entered.
    const budgetSetInOtherCurrency =
        hasBudget &&
        summary.budgetCurrency &&
        summary.budgetCurrency !== currency;
    const status = summary?.status ||
        (selectedMonth < currentMonth
            ? "past"
            : selectedMonth > currentMonth
                ? "future"
                : "current");

    const spentPercentage =
        monthlyBudget > 0
            ? Math.min(
                Math.round((totalSpent / monthlyBudget) * 100),
                100
            )
            : 0;

    const spendingByCategory =
        summary?.spendingByCategory || [];

    function changeMonth(month) {
        if (/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
            setShowBudgetForm(false);
            setSelectedMonth(month);
        }
    }

    function openBudgetForm() {
        setBudgetInput(
            hasBudget ? String(monthlyBudget) : ""
        );
        setFormError("");
        setShowBudgetForm(true);
    }

    async function handleBudgetSave(event) {
        event.preventDefault();

        if (!userId) {
            setFormError("Please log in again.");
            return;
        }

        const budgetAmount = Number(budgetInput);

        if (
            budgetInput === "" ||
            Number.isNaN(budgetAmount) ||
            budgetAmount < 0
        ) {
            setFormError(
                "Please enter a valid budget amount."
            );
            return;
        }

        try {
            setSavingBudget(true);
            setFormError("");

            const isUpdate = hasBudget && summary.budgetId;

            const response = await fetch(
                isUpdate
                    ? `/api/budgets/${summary.budgetId}`
                    : "/api/budgets",
                {
                    method: isUpdate ? "PUT" : "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        userId,
                        month: selectedMonth,
                        budgetAmount,
                        currency,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Could not save budget."
                );
            }

            setShowBudgetForm(false);
            setRefreshBudget((value) => value + 1);
        } catch (saveError) {
            console.error("Save budget error:", saveError);
            setFormError(saveError.message);
        } finally {
            setSavingBudget(false);
        }
    }

    return (
        <main className="budget-page">
            <header className="budget-header">
                <div>
                    <p className="budget-brand">
                        SMART SPEND
                    </p>

                    <h1>Monthly Budget</h1>

                    <p>
                        Review past months and plan
                        budgets for upcoming ones.
                    </p>
                </div>

                <PageHeaderIcon name="budget" />
            </header>

            <section className="budget-content">
                <nav
                    className="month-navigator"
                    aria-label="Choose a month"
                >
                    <button
                        type="button"
                        className="month-nav-button"
                        onClick={() =>
                            changeMonth(addMonths(selectedMonth, -1))
                        }
                        aria-label="Previous month"
                    >
                        ‹
                    </button>

                    <div className="month-navigator-center">
                        <label
                            className="month-navigator-label"
                            htmlFor="budgetMonth"
                        >
                            {monthLabel}
                        </label>

                        <input
                            id="budgetMonth"
                            type="month"
                            value={selectedMonth}
                            onChange={(event) =>
                                changeMonth(event.target.value)
                            }
                        />
                    </div>

                    <button
                        type="button"
                        className="month-nav-button"
                        onClick={() =>
                            changeMonth(addMonths(selectedMonth, 1))
                        }
                        aria-label="Next month"
                    >
                        ›
                    </button>
                </nav>

                {selectedMonth !== currentMonth && (
                    <button
                        type="button"
                        className="month-today-button"
                        onClick={() => changeMonth(currentMonth)}
                    >
                        Back to this month
                    </button>
                )}

                {error && (
                    <p className="budget-error">
                        {error}
                    </p>
                )}

                {loading ? (
                    <p>Loading budget...</p>
                ) : (
                    <>
                        <div className="overall-budget-card">
                            <div className="budget-card-top">
                                <p className="budget-month">
                                    {monthLabel} - Overall Budget
                                </p>

                                <span
                                    className={`month-status month-status-${status}`}
                                >
                                    {STATUS_LABELS[status]}
                                </span>
                            </div>

                            {hasBudget ? (
                                <>
                                    <h2>
                                        {formatMoney(monthlyBudget, currency)}
                                    </h2>

                                    {budgetSetInOtherCurrency && (
                                        <p className="budget-original-currency">
                                            Set as{" "}
                                            {formatMoney(
                                                summary.originalBudgetAmount,
                                                summary.budgetCurrency
                                            )}{" "}
                                            ({summary.budgetCurrency}),
                                            converted to {currency}.
                                        </p>
                                    )}

                                    <div className="progress-bar">
                                        <div
                                            className={
                                                overBudget
                                                    ? "progress-fill progress-fill-over"
                                                    : "progress-fill"
                                            }
                                            style={{
                                                width: `${spentPercentage}%`,
                                            }}
                                        />
                                    </div>

                                    <div className="budget-summary">
                                        <span>
                                            Spent:{" "}
                                            {formatMoney(totalSpent, currency)}
                                        </span>

                                        <span>
                                            {summary.percentUsed ?? spentPercentage}%
                                        </span>

                                        <span
                                            className={
                                                overBudget
                                                    ? "budget-over-text"
                                                    : ""
                                            }
                                        >
                                            {overBudget
                                                ? `Over by: ${formatMoney(
                                                    Math.abs(remaining),
                                                    currency
                                                )}`
                                                : `Left: ${formatMoney(
                                                    remaining,
                                                    currency
                                                )}`}
                                        </span>
                                    </div>

                                    {status === "past" && (
                                        <p className="budget-month-note">
                                            {overBudget
                                                ? "You went over budget this month."
                                                : "You stayed within budget this month."}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <div className="no-budget">
                                    <h2>No budget set</h2>

                                    <p>
                                        {status === "future"
                                            ? "Plan ahead by setting a budget for this month."
                                            : status === "past"
                                                ? `No budget was set for this month. You spent ${formatMoney(totalSpent, currency)}.`
                                                : "Set a budget to start tracking your spending."}
                                    </p>
                                </div>
                            )}

                            <button
                                type="button"
                                className="edit-budget-button"
                                onClick={openBudgetForm}
                            >
                                {hasBudget
                                    ? "Edit Budget"
                                    : "Set Budget"}
                            </button>
                        </div>

                        <div className="category-budgets">
                            <h2>Spending by Category</h2>

                            {spendingByCategory.length === 0 ? (
                                <p>
                                    {status === "future"
                                        ? "No expenses recorded for this month yet."
                                        : "No expenses recorded for this month."}
                                </p>
                            ) : (
                                spendingByCategory.map(
                                    ({ categoryName, amount }) => {
                                        const percentage =
                                            monthlyBudget > 0
                                                ? Math.min(
                                                    (amount / monthlyBudget) * 100,
                                                    100
                                                )
                                                : totalSpent > 0
                                                    ? (amount / totalSpent) * 100
                                                    : 0;

                                        return (
                                            <article
                                                className="category-budget"
                                                key={categoryName}
                                            >
                                                <div className="category-budget-header">
                                                    <h3>{categoryName}</h3>

                                                    <span>
                                                        {formatMoney(amount, currency)}{" "}
                                                        spent
                                                    </span>
                                                </div>

                                                <div className="progress-bar category-progress">
                                                    <div
                                                        className="progress-fill"
                                                        style={{
                                                            width: `${percentage}%`,
                                                        }}
                                                    />
                                                </div>
                                            </article>
                                        );
                                    }
                                )
                            )}
                        </div>

                        {rateNote && (
                            <p className="budget-rate-note">
                                Amounts are shown in {currency}.{" "}
                                {rateNote}
                            </p>
                        )}
                    </>
                )}

                {showBudgetForm && (
                    <div className="budget-form-overlay">
                        <form
                            className="budget-form-card"
                            onSubmit={handleBudgetSave}
                            noValidate
                        >
                            <h2>
                                {hasBudget
                                    ? "Edit Monthly Budget"
                                    : "Set Monthly Budget"}
                            </h2>

                            <p>
                                Enter your overall budget for{" "}
                                {monthLabel} in {currency}.
                                {budgetSetInOtherCurrency &&
                                    ` It was set in ${summary.budgetCurrency}; saving will store it in ${currency}.`}
                            </p>

                            <div className="budget-form-group">
                                <label htmlFor="budgetAmount">
                                    Budget Amount ({currency})
                                </label>

                                <input
                                    id="budgetAmount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={budgetInput}
                                    onChange={(event) => {
                                        setBudgetInput(event.target.value);
                                        setFormError("");
                                    }}
                                    aria-invalid={Boolean(formError)}
                                    autoFocus
                                    required
                                />

                                {formError && (
                                    <p
                                        className="field-error"
                                        role="alert"
                                    >
                                        {formError}
                                    </p>
                                )}
                            </div>

                            <div className="budget-form-actions">
                                <button
                                    type="button"
                                    className="budget-cancel-button"
                                    onClick={() =>
                                        setShowBudgetForm(false)
                                    }
                                    disabled={savingBudget}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="budget-save-button"
                                    disabled={savingBudget}
                                >
                                    {savingBudget
                                        ? "Saving..."
                                        : "Save Budget"}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </section>
        </main>
    );
}

export default BudgetPage;
