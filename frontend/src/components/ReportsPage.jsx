import { useEffect, useState } from "react";
import "./ReportsPage.css";

const months = [
    { value: "all", label: "All" },
    { value: "01", label: "Jan" },
    { value: "02", label: "Feb" },
    { value: "03", label: "Mar" },
    { value: "04", label: "Apr" },
    { value: "05", label: "May" },
    { value: "06", label: "Jun" },
    { value: "07", label: "Jul" },
    { value: "08", label: "Aug" },
    { value: "09", label: "Sep" },
    { value: "10", label: "Oct" },
    { value: "11", label: "Nov" },
    { value: "12", label: "Dec" },
];

const categoryColors = [
    "#22c55e",
    "#0f172a",
    "#3b82f6",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#64748b",
];

function ReportsPage({ userId }) {
    const [transactions, setTransactions] =
        useState([]);
    const [selectedMonth, setSelectedMonth] =
        useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadTransactions() {
            try {
                const response = await fetch(
                    `/api/transactions/${userId}`
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Could not load report data."
                    );
                }

                setTransactions(data.transactions);
            } catch (loadError) {
                console.error(
                    "Reports error:",
                    loadError
                );
                setError(
                    "Could not load report data."
                );
            } finally {
                setLoading(false);
            }
        }

        if (userId) {
            loadTransactions();
        }
    }, [userId]);

    const selectedTransactions =
        selectedMonth === "all"
            ? transactions
            : transactions.filter(
                (transaction) =>
                    String(
                        transaction.transaction_date
                    ).slice(5, 7) === selectedMonth
            );

    const totalIncome = selectedTransactions
        .filter(
            (transaction) =>
                transaction.transaction_type ===
                "Income"
        )
        .reduce(
            (total, transaction) =>
                total + Number(transaction.amount),
            0
        );

    const totalExpense = selectedTransactions
        .filter(
            (transaction) =>
                transaction.transaction_type ===
                "Expense"
        )
        .reduce(
            (total, transaction) =>
                total + Number(transaction.amount),
            0
        );

    const netAmount = totalIncome - totalExpense;
    const largestTotal = Math.max(
        totalIncome,
        totalExpense,
        1
    );

    const categoryTotals = {};

    selectedTransactions
        .filter(
            (transaction) =>
                transaction.transaction_type ===
                "Expense"
        )
        .forEach((transaction) => {
            const category =
                transaction.category_name || "Other";

            categoryTotals[category] =
                (categoryTotals[category] || 0) +
                Number(transaction.amount);
        });

    const categories = Object.entries(categoryTotals)
        .map(([name, amount]) => ({
            name,
            amount,
            percentage:
                totalExpense > 0
                    ? (amount / totalExpense) * 100
                    : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

    const chartSections = categories.map(
        (category, index) => {
            const start = categories
                .slice(0, index)
                .reduce(
                    (total, previousCategory) =>
                        total +
                        previousCategory.percentage,
                    0
                );

            const end =
                start + category.percentage;

            return `${categoryColors[
                index % categoryColors.length
            ]} ${start}% ${end}%`;
        }
    );

    const donutBackground =
        chartSections.length > 0
            ? `conic-gradient(${chartSections.join(
                ", "
            )})`
            : "#e2e8f0";

    function formatMoney(amount) {
        return new Intl.NumberFormat("en-CA", {
            style: "currency",
            currency: "CAD",
        }).format(amount);
    }

    if (loading) {
        return (
            <main className="reports-page">
                <p className="reports-status">
                    Loading reports...
                </p>
            </main>
        );
    }

    return (
        <main className="reports-page">
            <header className="reports-header">
                <div>
                    <p className="reports-brand">
                        SMART SPEND
                    </p>
                    <h1>Reports</h1>
                    <p>
                        Understand your income and
                        spending.
                    </p>
                </div>

                <div className="reports-header-icon">
                    {"\u25A5"}
                </div>
            </header>

            <section className="reports-content">
                {error && (
                    <p className="reports-error">
                        {error}
                    </p>
                )}

                <div className="month-filter">
                    {months.map((month) => (
                        <button
                            key={month.value}
                            type="button"
                            className={
                                selectedMonth ===
                                    month.value
                                    ? "active-month"
                                    : ""
                            }
                            onClick={() =>
                                setSelectedMonth(
                                    month.value
                                )
                            }
                        >
                            {month.label}
                        </button>
                    ))}
                </div>

                <section className="reports-summary">
                    <article className="report-summary-card">
                        <p>Income</p>
                        <h2 className="report-income">
                            {formatMoney(totalIncome)}
                        </h2>
                    </article>

                    <article className="report-summary-card">
                        <p>Expenses</p>
                        <h2 className="report-expense">
                            {formatMoney(totalExpense)}
                        </h2>
                    </article>

                    <article className="report-summary-card">
                        <p>Net</p>
                        <h2
                            className={
                                netAmount >= 0
                                    ? "report-income"
                                    : "report-expense"
                            }
                        >
                            {formatMoney(netAmount)}
                        </h2>
                    </article>
                </section>

                <section className="reports-grid">
                    <article className="report-chart-card">
                        <div className="report-card-heading">
                            <h2>
                                Income vs. Expenses
                            </h2>
                            <p>
                                Financial comparison for
                                the selected period.
                            </p>
                        </div>

                        <div className="bar-chart">
                            <div className="bar-column">
                                <span>
                                    {formatMoney(
                                        totalIncome
                                    )}
                                </span>

                                <div
                                    className="chart-bar income-bar"
                                    style={{
                                        height: `${Math.max(
                                            (totalIncome /
                                                largestTotal) *
                                            180,
                                            totalIncome > 0
                                                ? 12
                                                : 0
                                        )}px`,
                                    }}
                                />

                                <strong>Income</strong>
                            </div>

                            <div className="bar-column">
                                <span>
                                    {formatMoney(
                                        totalExpense
                                    )}
                                </span>

                                <div
                                    className="chart-bar expense-bar"
                                    style={{
                                        height: `${Math.max(
                                            (totalExpense /
                                                largestTotal) *
                                            180,
                                            totalExpense > 0
                                                ? 12
                                                : 0
                                        )}px`,
                                    }}
                                />

                                <strong>Expenses</strong>
                            </div>
                        </div>
                    </article>

                    <article className="report-chart-card">
                        <div className="report-card-heading">
                            <h2>
                                Spending by Category
                            </h2>
                            <p>
                                Expense distribution for
                                the selected period.
                            </p>
                        </div>

                        {categories.length > 0 ? (
                            <div className="category-chart">
                                <div
                                    className="donut-chart"
                                    style={{
                                        background:
                                            donutBackground,
                                    }}
                                    aria-label="Expense category chart"
                                >
                                    <div>
                                        <span>Total</span>
                                        <strong>
                                            {formatMoney(
                                                totalExpense
                                            )}
                                        </strong>
                                    </div>
                                </div>

                                <div className="category-legend">
                                    {categories.map(
                                        (
                                            category,
                                            index
                                        ) => (
                                            <div
                                                className="legend-row"
                                                key={
                                                    category.name
                                                }
                                            >
                                                <span
                                                    className="legend-color"
                                                    style={{
                                                        backgroundColor:
                                                            categoryColors[
                                                            index %
                                                            categoryColors.length
                                                            ],
                                                    }}
                                                />

                                                <span className="legend-name">
                                                    {
                                                        category.name
                                                    }
                                                </span>

                                                <strong>
                                                    {category.percentage.toFixed(
                                                        0
                                                    )}
                                                    %
                                                </strong>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="reports-empty">
                                No expense data for this
                                period.
                            </p>
                        )}
                    </article>
                </section>
            </section>
        </main>
    );
}

export default ReportsPage;