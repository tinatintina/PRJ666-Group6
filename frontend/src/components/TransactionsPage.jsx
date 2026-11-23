import { useEffect, useState } from "react";
import "./TransactionsPage.css";
import { PageHeaderIcon } from "./NavIcon";
import {
    formatMoney,
    getDisplayAmount,
    isForeignAmount,
} from "../utils/currency";

function TransactionsPage({
    userId,
    currency = "CAD",
    onAddTransaction,
}) {
    const [transactions, setTransactions] =
        useState([]);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Delete: which row is asking "are you sure?",
    // which row is being deleted, and the result message
    const [confirmDeleteId, setConfirmDeleteId] =
        useState(null);
    const [deletingId, setDeletingId] =
        useState(null);
    const [deleteMessage, setDeleteMessage] =
        useState(null);

    async function handleDelete(transaction) {
        try {
            setDeletingId(transaction.transaction_id);
            setDeleteMessage(null);

            const response = await fetch(
                `/api/transactions/${transaction.transaction_id}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({ userId }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Could not delete transaction."
                );
            }

            setTransactions((current) =>
                current.filter(
                    (item) =>
                        item.transaction_id !==
                        transaction.transaction_id
                )
            );

            setDeleteMessage({
                type: "success",
                text: "Transaction deleted.",
            });
        } catch (deleteError) {
            console.error(
                "Delete transaction error:",
                deleteError
            );

            setDeleteMessage({
                type: "error",
                text: deleteError.message,
            });
        } finally {
            setDeletingId(null);
            setConfirmDeleteId(null);
        }
    }

    useEffect(() => {
        async function loadTransactions() {
            if (!userId) {
                setError(
                    "No logged-in user found."
                );
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(
                    `/api/transactions/${userId}?currency=${currency}`
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                            "Could not load transactions."
                    );
                }

                setTransactions(
                    data.transactions
                );
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
    }, [userId, currency]);

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
            "en-US",
            {
                month: "short",
                day: "numeric",
            }
        );
    }

    const filteredTransactions =
        transactions.filter(
            (transaction) => {
                const category =
                    transaction.category_name ||
                    "";

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

                <PageHeaderIcon name="transactions" />
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

                        <div className="toolbar-actions">
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

                        <button
                            type="button"
                            className="add-transaction-toolbar-button"
                            onClick={onAddTransaction}
                        >
                            <span aria-hidden="true">+</span>
                            Add Transaction
                        </button>
                        </div>
                    </div>

                    {deleteMessage && (
                        <p
                            className={`delete-message delete-message-${deleteMessage.type}`}
                            role={
                                deleteMessage.type ===
                                "error"
                                    ? "alert"
                                    : "status"
                            }
                        >
                            {deleteMessage.text}
                        </p>
                    )}

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

                                            <div className="transaction-amount-group">
                                                <p
                                                    className={`transaction-amount ${type}`}
                                                >
                                                    {type ===
                                                    "income"
                                                        ? "+"
                                                        : "-"}
                                                    {formatMoney(
                                                        transaction.amount,
                                                        transaction.currency ||
                                                            currency
                                                    )}
                                                </p>

                                                {isForeignAmount(
                                                    transaction,
                                                    currency
                                                ) && (
                                                    <p className="transaction-converted">
                                                        ≈{" "}
                                                        {formatMoney(
                                                            getDisplayAmount(
                                                                transaction
                                                            ),
                                                            currency
                                                        )}
                                                    </p>
                                                )}
                                            </div>

                                            <div
                                                className={
                                                    confirmDeleteId ===
                                                    transaction.transaction_id
                                                        ? "transaction-actions confirming"
                                                        : "transaction-actions"
                                                }
                                            >
                                                {confirmDeleteId ===
                                                transaction.transaction_id ? (
                                                    <>
                                                        <span className="delete-confirm-text">
                                                            Delete?
                                                        </span>

                                                        <button
                                                            type="button"
                                                            className="delete-cancel-button"
                                                            onClick={() =>
                                                                setConfirmDeleteId(
                                                                    null
                                                                )
                                                            }
                                                            disabled={
                                                                deletingId ===
                                                                transaction.transaction_id
                                                            }
                                                        >
                                                            No
                                                        </button>

                                                        <button
                                                            type="button"
                                                            className="delete-confirm-button"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    transaction
                                                                )
                                                            }
                                                            disabled={
                                                                deletingId ===
                                                                transaction.transaction_id
                                                            }
                                                        >
                                                            {deletingId ===
                                                            transaction.transaction_id
                                                                ? "Deleting..."
                                                                : "Yes, delete"}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="delete-transaction-button"
                                                        aria-label={`Delete ${
                                                            transaction.category_name
                                                        } transaction`}
                                                        title="Delete transaction"
                                                        onClick={() => {
                                                            setDeleteMessage(
                                                                null
                                                            );
                                                            setConfirmDeleteId(
                                                                transaction.transaction_id
                                                            );
                                                        }}
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        </article>
                                    );
                                }
                            )
                        ) : (
                            <div className="empty-message">
                                <p>
                                    {transactions.length === 0
                                        ? "You have no transactions yet."
                                        : "No transactions found."}
                                </p>

                                {transactions.length === 0 && (
                                    <button
                                        type="button"
                                        className="add-transaction-toolbar-button"
                                        onClick={onAddTransaction}
                                    >
                                        <span aria-hidden="true">+</span>
                                        Add your first transaction
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}

export default TransactionsPage;