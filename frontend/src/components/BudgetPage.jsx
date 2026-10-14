import {
    useEffect,
    useState,
} from "react";

import "./BudgetPage.css";

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

function BudgetPage({ userId }) {
    const [budgets, setBudgets] =
        useState([]);

    const [
        transactions,
        setTransactions,
    ] = useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const currentMonth =
        getCurrentMonth();

    const currentMonthLabel =
        getCurrentMonthLabel();

    async function loadBudgetData() {
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
                budgetResponse,
                transactionResponse,
            ] = await Promise.all([
                fetch(
                    `/api/budgets/${userId}`
                ),

                fetch(
                    `/api/transactions/${userId}`
                ),
            ]);

            const budgetData =
                await budgetResponse.json();

            const transactionData =
                await transactionResponse.json();

            if (!budgetResponse.ok) {
                throw new Error(
                    budgetData.message ||
                        "Could not load budget."
                );
            }

            if (!transactionResponse.ok) {
                throw new Error(
                    transactionData.message ||
                        "Could not load transactions."
                );
            }

            setBudgets(
                budgetData.budgets || []
            );

            setTransactions(
                transactionData.transactions ||
                    []
            );
        } catch (error) {
            console.error(
                "Budget error:",
                error
            );

            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadBudgetData();
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

    const monthlyExpenses =
        transactions.filter(
            (transaction) => {
                const transactionType =
                    (
                        transaction.transaction_type ||
                        ""
                    ).toLowerCase();

                const transactionDate =
                    transaction.transaction_date ||
                    "";

                return (
                    transactionType ===
                        "expense" &&
                    transactionDate.startsWith(
                        currentMonth
                    )
                );
            }
        );

    const totalSpent =
        monthlyExpenses.reduce(
            (total, transaction) =>
                total +
                Number(
                    transaction.amount ||
                        0
                ),
            0
        );

    const remaining =
        monthlyBudget - totalSpent;

    const spentPercentage =
        monthlyBudget > 0
            ? Math.min(
                  Math.round(
                      (totalSpent /
                          monthlyBudget) *
                          100
                  ),
                  100
              )
            : 0;

    const spendingByCategory =
        monthlyExpenses.reduce(
            (categories, transaction) => {
                const category =
                    transaction.category_name ||
                    "Other";

                if (!categories[category]) {
                    categories[category] = 0;
                }

                categories[category] +=
                    Number(
                        transaction.amount ||
                            0
                    );

                return categories;
            },
            {}
        );

    async function handleBudgetSave() {
        if (!userId) {
            alert(
                "Please log in again."
            );

            return;
        }

        const enteredAmount =
            window.prompt(
                `Enter your budget for ${currentMonthLabel}:`,
                currentBudget
                    ? currentBudget.budget_amount
                    : ""
            );

        if (enteredAmount === null) {
            return;
        }

        const budgetAmount =
            Number(enteredAmount);

        if (
            Number.isNaN(
                budgetAmount
            ) ||
            budgetAmount < 0
        ) {
            alert(
                "Please enter a valid budget amount."
            );

            return;
        }

        try {
            let response;

            if (currentBudget) {
                response = await fetch(
                    `/api/budgets/${currentBudget.budget_id}`,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            userId,
                            month:
                                currentMonth,
                            budgetAmount,
                        }),
                    }
                );
            } else {
                response = await fetch(
                    "/api/budgets",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            userId,
                            month:
                                currentMonth,
                            budgetAmount,
                        }),
                    }
                );
            }

            const data =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Could not save budget."
                );
            }

            await loadBudgetData();
        } catch (error) {
            console.error(
                "Save budget error:",
                error
            );

            alert(error.message);
        }
    }

    if (loading) {
        return (
            <main className="budget-page">
                <section className="budget-content">
                    <p>
                        Loading budget...
                    </p>
                </section>
            </main>
        );
    }

    return (
        <main className="budget-page">
            <header className="budget-header">
                <div>
                    <p className="budget-brand">
                        SMART SPEND
                    </p>

                    <h1>
                        Monthly Budget
                    </h1>

                    <p>
                        Track your spending
                        and stay within your
                        budget.
                    </p>
                </div>

                <div className="budget-avatar">
                    $
                </div>
            </header>

            <section className="budget-content">
                {error && (
                    <p className="category-error">
                        {error}
                    </p>
                )}

                <div className="overall-budget-card">
                    <p className="budget-month">
                        {currentMonthLabel} ·
                        Overall Budget
                    </p>

                    <h2>
                        $
                        {monthlyBudget.toLocaleString(
                            "en-CA",
                            {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                            }
                        )}
                    </h2>

                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{
                                width: `${spentPercentage}%`,
                            }}
                        />
                    </div>

                    <div className="budget-summary">
                        <span>
                            Spent: $
                            {totalSpent.toLocaleString(
                                "en-CA",
                                {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                }
                            )}
                        </span>

                        <span>
                            {spentPercentage}%
                        </span>

                        <span>
                            Left: $
                            {remaining.toLocaleString(
                                "en-CA",
                                {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                }
                            )}
                        </span>
                    </div>

                    <button
                        type="button"
                        className="edit-budget-button"
                        onClick={
                            handleBudgetSave
                        }
                    >
                        {currentBudget
                            ? "Edit Budget"
                            : "Set Budget"}
                    </button>
                </div>

                <div className="category-budgets">
                    <h2>
                        Spending by Category
                    </h2>

                    {Object.keys(
                        spendingByCategory
                    ).length === 0 ? (
                        <p>
                            No expenses recorded
                            for this month yet.
                        </p>
                    ) : (
                        Object.entries(
                            spendingByCategory
                        ).map(
                            ([
                                category,
                                spent,
                            ]) => {
                                const percentage =
                                    monthlyBudget >
                                    0
                                        ? Math.min(
                                              (spent /
                                                  monthlyBudget) *
                                                  100,
                                              100
                                          )
                                        : 0;

                                return (
                                    <article
                                        className="category-budget"
                                        key={
                                            category
                                        }
                                    >
                                        <div className="category-budget-header">
                                            <h3>
                                                {
                                                    category
                                                }
                                            </h3>

                                            <span>
                                                $
                                                {spent.toLocaleString(
                                                    "en-CA",
                                                    {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    }
                                                )}{" "}
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
            </section>
        </main>
    );
}

export default BudgetPage;