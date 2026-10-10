import { useEffect, useState } from "react";
import "./TransactionsPage.css";

function TransactionsPage({ onAddTransaction }) {
    const [transactions, setTransactions] = useState([]);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadTransactions() {
            try {
                // Temporary user ID until login is fully connected
                const userId = 1;

                const response = await fetch(
                    `/api/transactions/${userId}`
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Could not load transactions."
                    );
                }

                setTransactions(data.transactions);
            } catch (error) {
                console.error(
                    "Transaction error:",
                    error
                );

                setError(
                    "Could not load transactions."
                );
            } finally {
                setLoading(false);
            }
        }

        loadTransactions();
    }, []);

    function formatDate(dateValue) {
        if (!dateValue) {
            return "";
        }

        const dateOnly = dateValue.split("T")[0];
        const [year, month, day] = dateOnly.split("-");

        const date = new Date(
            Number(year),
            Number(month) - 1,
            Number(day)
        );

        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    }

    const filteredTransactions = transactions.filter(
        (transaction) => {
            const category =
                transaction.category_name || "";

            const description =
                transaction.description || "";

            const matchesSearch =
                category
                    .toLowerCase()
                    .includes(
                        search.toLowerCase()
                    ) ||
                description
                    .toLowerCase()
                    .includes(
                        search.toLowerCase()
                    );

            const matchesFilter =
                filter === "all" ||
                transaction.transaction_type.toLowerCase() ===
                filter;

            return (
                matchesSearch &&
                matchesFilter
            );
        }
    );

    return (
        <div className="transactions-page">
            <header className="transactions-header">
                <div>
                    <p className="header-label">
                        SMART SPEND
                    </p>

                    <h1>Transactions</h1>

                    <p>
                        Review and manage your
                        recent financial activity.
                    </p>
                </div>

                <button
                    className="profile-button"
                    aria-label="Open profile"
                >
                    AD
                </button>
            </header>

            <main className="transactions-content">
                <section className="transactions-card">
                    <div className="transactions-toolbar">
                        <div className="search-container">
                            <span aria-hidden="true">
                                ⌕
                            </span>

                            <input
                                type="search"
                                placeholder="Search transactions..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                            />
                        </div>

                        <div className="filter-buttons">
                            {[
                                "all",
                                "income",
                                "expense",
                            ].map(
                                (option) => (
                                    <button
                                        key={
                                            option
                                        }
                                        type="button"
                                        className={
                                            filter ===
                                                option
                                                ? "active-filter"
                                                : ""
                                        }
                                        onClick={() =>
                                            setFilter(
                                                option
                                            )
                                        }
                                    >
                                        {option
                                            .charAt(
                                                0
                                            )
                                            .toUpperCase() +
                                            option.slice(
                                                1
                                            )}
                                    </button>
                                )
                            )}
                        </div>
                    </div>

                    <div className="transaction-list">
                        {loading ? (
                            <p className="empty-message">
                                Loading transactions...
                            </p>
                        ) : error ? (
                            <p className="empty-message">
                                {error}
                            </p>
                        ) : filteredTransactions.length >
                            0 ? (
                            filteredTransactions.map(
                                (
                                    transaction
                                ) => {
                                    const type =
                                        transaction.transaction_type.toLowerCase();

                                    return (
                                        <article
                                            className="transaction-row"
                                            key={
                                                transaction.transaction_id
                                            }
                                        >
                                            <div
                                                className={`transaction-icon ${type}`}
                                                aria-hidden="true"
                                            >
                                                {type ===
                                                    "income"
                                                    ? "↓"
                                                    : "↑"}
                                            </div>

                                            <div className="transaction-details">
                                                <h2>
                                                    {
                                                        transaction.category_name
                                                    }
                                                </h2>

                                                <p>
                                                    {formatDate(
                                                        transaction.transaction_date
                                                    )}
                                                </p>
                                            </div>

                                            <p
                                                className={`transaction-amount ${type}`}
                                            >
                                                {type ===
                                                    "income"
                                                    ? "+"
                                                    : "-"}
                                                $
                                                {Number(
                                                    transaction.amount
                                                ).toFixed(
                                                    2
                                                )}
                                            </p>
                                        </article>
                                    );
                                }
                            )
                        ) : (
                            <p className="empty-message">
                                No transactions found.
                            </p>
                        )}
                    </div>
                </section>
            </main>

            <button
                type="button"
                className="add-transaction-button"
                aria-label="Add transaction"
                onClick={onAddTransaction}
            >
                +
            </button>

        </div>
    );
}

export default TransactionsPage;