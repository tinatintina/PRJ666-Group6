import "./BudgetPage.css";

const categoryBudgets = [
    { name: "Food & Dining", spent: 120, limit: 200 },
    { name: "Transport", spent: 35, limit: 60 },
    { name: "Utilities", spent: 45, limit: 80 },
    { name: "Entertainment", spent: 30, limit: 50 },
    { name: "Clothing", spent: 0, limit: 40 },
];

function BudgetPage() {
    const monthlyBudget = 1500;
    const totalSpent = 1150;
    const remaining = monthlyBudget - totalSpent;
    const spentPercentage = Math.round(
        (totalSpent / monthlyBudget) * 100
    );

    return (
        <main className="budget-page">
            <header className="budget-header">
                <div>
                    <p className="budget-brand">SMART SPEND</p>
                    <h1>Monthly Budget</h1>
                    <p>Track your spending and stay within your budget.</p>
                </div>

                <div className="budget-avatar">AD</div>
            </header>

            <section className="budget-content">
                <div className="overall-budget-card">
                    <p className="budget-month">October 2026 · Overall Budget</p>
                    <h2>${monthlyBudget.toLocaleString()}</h2>

                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${spentPercentage}%` }}
                        />
                    </div>

                    <div className="budget-summary">
                        <span>Spent: ${totalSpent.toLocaleString()}</span>
                        <span>{spentPercentage}%</span>
                        <span>Left: ${remaining.toLocaleString()}</span>
                    </div>

                    <button type="button" className="edit-budget-button">
                        Edit Budget
                    </button>
                </div>

                <div className="category-budgets">
                    <h2>Category Budgets</h2>

                    {categoryBudgets.map((category) => {
                        const percentage = Math.min(
                            (category.spent / category.limit) * 100,
                            100
                        );

                        return (
                            <article
                                className="category-budget"
                                key={category.name}
                            >
                                <div className="category-budget-header">
                                    <h3>{category.name}</h3>

                                    <span>
                                        ${category.spent} / ${category.limit}
                                    </span>
                                </div>

                                <div className="progress-bar category-progress">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </article>
                        );
                    })}
                </div>
            </section>
        </main>
    );
}

export default BudgetPage;