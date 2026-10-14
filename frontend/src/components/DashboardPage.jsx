import {
    useEffect,
    useState,
} from "react";

import "./DashboardPage.css";

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

function formatMoney(amount) {
    return Number(
        amount || 0
    ).toLocaleString(
        "en-CA",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
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
    firstName,
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
                        `/api/transactions/${userId}`
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
    }, [userId]);

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
                    Number(
                        transaction.amount ||
                            0
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
                    Number(
                        transaction.amount ||
                            0
                    ),
                0
            );

    const remainingBudget =
        monthlyBudget -
        totalExpenses;

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

                <div className="dashboard-avatar">
                    $
                </div>
            </header>

            <section className="dashboard-content">
                {error && (
                    <p className="dashboard-error">
                        {error}
                    </p>
                )}

                <div className="dashboard-summary">
                    <article className="summary-card">
                        <p>
                            Monthly Budget
                        </p>

                        <h2>
                            $
                            {formatMoney(
                                monthlyBudget
                            )}
                        </h2>
                    </article>

                    <article className="summary-card">
                        <p>
                            Total Income
                        </p>

                        <h2 className="income-value">
                            +$
                            {formatMoney(
                                totalIncome
                            )}
                        </h2>
                    </article>

                    <article className="summary-card">
                        <p>
                            Total Expenses
                        </p>

                        <h2 className="expense-value">
                            -$
                            {formatMoney(
                                totalExpenses
                            )}
                        </h2>
                    </article>

                    <article className="summary-card">
                        <p>
                            Remaining Budget
                        </p>

                        <h2>
                            $
                            {formatMoney(
                                remainingBudget
                            )}
                        </h2>
                    </article>
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
                                                $
                                                {formatMoney(
                                                    transaction.amount
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