import { useState } from "react";
import "./TransactionsPage.css";

const sampleTransactions = [
    {
        id: 1,
        category: "Food & Dining",
        date: "Jul 19",
        amount: 12.5,
        type: "expense",
    },
    {
        id: 2,
        category: "Transport",
        date: "Jul 18",
        amount: 4,
        type: "expense",
    },
    {
        id: 3,
        category: "Part-time Job",
        date: "Jul 17",
        amount: 350,
        type: "income",
    },
    {
        id: 4,
        category: "Utilities",
        date: "Jul 16",
        amount: 45,
        type: "expense",
    },
    {
        id: 5,
        category: "Groceries",
        date: "Jul 15",
        amount: 38.2,
        type: "expense",
    },
    {
        id: 6,
        category: "Tuition Fee",
        date: "Jul 14",
        amount: 500,
        type: "expense",
    },
    {
        id: 7,
        category: "Scholarship",
        date: "Jul 12",
        amount: 800,
        type: "income",
    },
    {
        id: 8,
        category: "Entertainment",
        date: "Jul 12",
        amount: 15,
        type: "expense",
    },
];

function TransactionsPage() {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

    const filteredTransactions = sampleTransactions.filter((transaction) => {
        const matchesSearch = transaction.category
            .toLowerCase()
            .includes(search.toLowerCase());

        const matchesFilter =
            filter === "all" || transaction.type === filter;

        return matchesSearch && matchesFilter;
    });

    return (
        <div className="transactions-page">
            <header className="transactions-header">
                <div>
                    <p className="header-label">SMART SPEND</p>
                    <h1>Transactions</h1>
                    <p>Review and manage your recent financial activity.</p>
                </div>

                <button className="profile-button" aria-label="Open profile">
                    AD
                </button>
            </header>

            <main className="transactions-content">
                <section className="transactions-card">
                    <div className="transactions-toolbar">
                        <div className="search-container">
                            <span aria-hidden="true">⌕</span>

                            <input
                                type="search"
                                placeholder="Search transactions..."
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                            />
                        </div>

                        <div className="filter-buttons">
                            {["all", "income", "expense"].map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    className={filter === option ? "active-filter" : ""}
                                    onClick={() => setFilter(option)}
                                >
                                    {option.charAt(0).toUpperCase() + option.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="transaction-list">
                        {filteredTransactions.length > 0 ? (
                            filteredTransactions.map((transaction) => (
                                <article className="transaction-row" key={transaction.id}>
                                    <div
                                        className={`transaction-icon ${transaction.type}`}
                                        aria-hidden="true"
                                    >
                                        {transaction.type === "income" ? "↓" : "↑"}
                                    </div>

                                    <div className="transaction-details">
                                        <h2>{transaction.category}</h2>
                                        <p>{transaction.date}</p>
                                    </div>

                                    <p className={`transaction-amount ${transaction.type}`}>
                                        {transaction.type === "income" ? "+" : "-"}$
                                        {transaction.amount.toFixed(2)}
                                    </p>
                                </article>
                            ))
                        ) : (
                            <p className="empty-message">No transactions found.</p>
                        )}
                    </div>
                </section>
            </main>

            <button
                type="button"
                className="add-transaction-button"
                aria-label="Add transaction"
            >
                +
            </button>

            <nav className="bottom-navigation" aria-label="Main navigation">
                <button type="button">
                    <span aria-hidden="true">⌂</span>
                    Home
                </button>

                <button type="button" className="active-navigation">
                    <span aria-hidden="true">↕</span>
                    Transactions
                </button>

                <button type="button">
                    <span aria-hidden="true">▣</span>
                    Budget
                </button>

                <button type="button">
                    <span aria-hidden="true">▥</span>
                    Reports
                </button>

                <button type="button">
                    <span aria-hidden="true">●</span>
                    Profile
                </button>
            </nav>
        </div>
    );
}

export default TransactionsPage;