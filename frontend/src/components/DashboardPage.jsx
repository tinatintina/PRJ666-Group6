import {
    useEffect,
    useState,
} from "react";

import "./DashboardPage.css";
import { PageHeaderIcon } from "./NavIcon";
import {
    formatMoney,
    getDisplayAmount,
} from "../utils/currency";

function getCurrentMonth() {
    const now = new Date();

    const year = now.getFullYear();

    const month = String(
        now.getMonth() + 1
    ).padStart(2, "0");

    return `${year}-${month}`;
}

function getCurrentMonthLabel() {
    return new Date().toLocaleDateString(
        "en-CA",
        {
            month: "long",
            year: "numeric",
        }
    );
}

function formatDate(dateValue) {
    if (!dateValue) {
        return "";
    }

    const dateOnly =
        dateValue.split("T")[0];

    const [year, month, day] =
        dateOnly.split("-");

    const date = new Date(
        Number(year),
        Number(month) - 1,
        Number(day)
    );

    return date.toLocaleDateString(
        "en-CA",
        {
            month: "short",
            day: "numeric",
        }
    );
}

function DashboardPage({
    userId,
    currency = "CAD",
    firstName,
    onNavigate,
}) {
    const [
        transactions,
        setTransactions,
    ] = useState([]);

    const [budgets, setBudgets] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const currentMonth =
        getCurrentMonth();

    const currentMonthLabel =
        getCurrentMonthLabel();

    useEffect(() => {
        async function loadDashboard() {
            if (!userId) {
                setError(
                    "No logged-in user found."
                );

                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError("");

                const [
                    transactionResponse,
                    budgetResponse,
                ] = await Promise.all([
                    fetch(
                        `/api/transactions/${userId}?currency=${currency}`
                    ),

                    fetch(
                        `/api/budgets/${userId}`
                    ),
                ]);

                const transactionData =
                    await transactionResponse.json();

                const budgetData =
                    await budgetResponse.json();

                if (
                    !transactionResponse.ok
                ) {
                    throw new Error(
                        transactionData.message ||
                        "Could not load transactions."
                    );
                }

                if (!budgetResponse.ok) {
                    throw new Error(
                        budgetData.message ||
                        "Could not load budget."
                    );
                }

                setTransactions(
                    transactionData.transactions ||
                    []
                );

                setBudgets(
                    budgetData.budgets ||
                    []
                );
            } catch (error) {
                console.error(
                    "Dashboard error:",
                    error
                );

                setError(error.message);
            } finally {
                setLoading(false);
            }
        }

        loadDashboard();
    }, [userId, currency]);

    const currentBudget =
        budgets.find(
            (budget) =>
                budget.month ===
                currentMonth
        );

    const monthlyBudget =
        Number(
            currentBudget?.budget_amount ||
            0
        );

    const monthlyTransactions =
        transactions.filter(
            (transaction) =>
                (
                    transaction.transaction_date ||
                    ""
                ).startsWith(
                    currentMonth
                )
        );

    const totalIncome =
        monthlyTransactions
            .filter(
                (transaction) =>
                    (
                        transaction.transaction_type ||
                        ""
                    ).toLowerCase() ===
                    "income"
            )
            .reduce(
                (total, transaction) =>
                    total +
                    getDisplayAmount(
                        transaction
                    ),
                0
            );

    const totalExpenses =
        monthlyTransactions
            .filter(
                (transaction) =>
                    (
                        transaction.transaction_type ||
                        ""
                    ).toLowerCase() ===
                    "expense"
            )
            .reduce(
                (total, transaction) =>
                    total +
                    getDisplayAmount(
                        transaction
                    ),
                0
            );

    const remainingBudget =
        monthlyBudget -
        totalExpenses;

    const spendingHealth =
        monthlyBudget > 0
            ? Math.max(
                0,
                Math.round(
                    (remainingBudget /
                        monthlyBudget) *
                    100
                )
            )
            : 0;

    const recentTransactions =
        transactions.slice(0, 5);

    if (loading) {
        return (
            <main className="dashboard-page">
                <div className="dashboard-content">
                    <p>
                        Loading dashboard...
                    </p>
                </div>
            </main>
        );
    }

    return (
        <main className="dashboard-page">
            <header className="dashboard-header">
                <div>
                    <p className="dashboard-brand">
                        SMART SPEND
                    </p>

                    <h1>
                        Welcome
                        {firstName
                            ? `, ${firstName}`
                            : ""}
                    </h1>

                    <p>
                        Here is your financial
                        overview for{" "}
                        {currentMonthLabel}.
                    </p>
                </div>

                <PageHeaderIcon name="home" />
            </header>

            <section className="dashboard-content">
                {error && (
                    <p className="dashboard-error">
                        {error}
                    </p>
                )}

                <div className="dashboard-summary">
                    <article className="summary-card">
                        <p>Total Income</p>
                        <h2 className="income-value">
                            +{formatMoney(totalIncome, currency)}
                        </h2>
                    </article>

                    <article className="summary-card">
                        <p>Total Expenses</p>
                        <h2 className="expense-value">
                            -{formatMoney(totalExpenses, currency)}
                        </h2>
                    </article>

                    <article className="summary-card">
                        <p>Remaining Budget</p>

                        <h2>
                            {formatMoney(remainingBudget, currency)}
                        </h2>
                    </article>

                    <article className="summary-card">
                        <p>Spending Health</p>

                        <h2>{spendingHealth} / 100</h2>
                        <div className="health-bar">
                            <div className="health-bar-fill"
                                style={{
                                    width: `${spendingHealth}%`,
                                }}
                            />
                        </div>
                    </article>
                </div>

                <div className="quick-actions-card">
                    <h2>Quick Actions</h2>

                    <div className="quick-actions">
                        <button
                            type="button"
                            onClick={() =>
                                onNavigate("add-transaction")
                            }
                        >
                            + Transaction
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                onNavigate("budget")
                            }
                        >
                            Budget
                        </button>

                        <button
                            type="button"
                            onClick={() => onNavigate("reports")}
                        >
                            Reports
                        </button>

                        <button type="button" disabled>
                            Goals
                        </button>

                        <button type="button" disabled>
                            Settings
                        </button>
                    </div>
                </div>

                <div className="recent-transactions-card">
                    <div className="recent-heading">
                        <div>
                            <h2>
                                Recent Transactions
                            </h2>

                            <p>
                                Your latest activity.
                            </p>
                        </div>
                    </div>

                    {recentTransactions.length ===
                        0 ? (
                        <p className="dashboard-empty">
                            No transactions yet.
                        </p>
                    ) : (
                        <div className="dashboard-transaction-list">
                            {recentTransactions.map(
                                (
                                    transaction
                                ) => {
                                    const type =
                                        (
                                            transaction.transaction_type ||
                                            ""
                                        ).toLowerCase();

                                    return (
                                        <article
                                            className="dashboard-transaction"
                                            key={
                                                transaction.transaction_id
                                            }
                                        >
                                            <div
                                                className={`dashboard-transaction-icon ${type}`}
                                            >
                                                {type ===
                                                    "income"
                                                    ? "↓"
                                                    : "↑"}
                                            </div>

                                            <div className="dashboard-transaction-details">
                                                <h3>
                                                    {transaction.category_name ||
                                                        "Transaction"}
                                                </h3>

                                                <p>
                                                    {transaction.description ||
                                                        "No description"}{" "}
                                                    ·{" "}
                                                    {formatDate(
                                                        transaction.transaction_date
                                                    )}
                                                </p>
                                            </div>

                                            <strong
                                                className={`dashboard-transaction-amount ${type}`}
                                            >
                                                {type ===
                                                    "income"
                                                    ? "+"
                                                    : "-"}
                                                {formatMoney(
                                                    getDisplayAmount(
                                                        transaction
                                                    ),
                                                    currency
                                                )}
                                            </strong>
                                        </article>
                                    );
                                }
                            )}
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}

export default DashboardPage;