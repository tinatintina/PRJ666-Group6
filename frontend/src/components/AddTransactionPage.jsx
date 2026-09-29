import { useEffect, useState } from "react";
import "./AddTransactionPage.css";

// Local date as YYYY-MM-DD
function getTodayString() {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60000;

    return new Date(now.getTime() - offsetMs)
        .toISOString()
        .slice(0, 10);
}

function AddTransactionPage({ onSave, onCancel }) {
    const [type, setType] = useState("expense");
    const [amount, setAmount] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(getTodayString());

    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [categoryError, setCategoryError] = useState("");

    // Load categories from backend
    useEffect(() => {
        async function loadCategories() {
            try {
                const response = await fetch("/api/categories");
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || "Could not load categories."
                    );
                }

                setCategories(data.categories);
            } catch (error) {
                console.error("Category error:", error);
                setCategoryError("Could not load categories.");
            } finally {
                setLoadingCategories(false);
            }
        }

        loadCategories();
    }, []);

    // Only show categories that match Income or Expense
    const availableCategories = categories.filter(
        (category) =>
            category.category_type.toLowerCase() === type
    );

    function handleTypeChange(newType) {
        setType(newType);

        // Clear category because income and expense
        // have different category choices
        setCategoryId("");
    }

    function handleSubmit(event) {
        event.preventDefault();

        onSave({
            type,
            amount: Number(amount),
            categoryId: Number(categoryId),
            description: description.trim(),
            date,
        });
    }

    return (
        <div className="add-transaction-page">
            <header className="add-transaction-header">
                <button
                    type="button"
                    className="back-button"
                    onClick={onCancel}
                >
                    ← Back
                </button>

                <h1>Add Transaction</h1>
            </header>

            <main className="add-transaction-content">
                <form
                    className="add-transaction-card"
                    onSubmit={handleSubmit}
                >
                    <div className="form-group">
                        <span
                            className="field-label"
                            id="typeLabel"
                        >
                            Type
                        </span>

                        <div
                            className="type-toggle"
                            role="group"
                            aria-labelledby="typeLabel"
                        >
                            {["expense", "income"].map(
                                (option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        className={
                                            type === option
                                                ? "active-type"
                                                : ""
                                        }
                                        aria-pressed={
                                            type === option
                                        }
                                        onClick={() =>
                                            handleTypeChange(
                                                option
                                            )
                                        }
                                    >
                                        {option
                                            .charAt(0)
                                            .toUpperCase() +
                                            option.slice(1)}
                                    </button>
                                )
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="amount">
                            Amount ($)
                        </label>

                        <input
                            id="amount"
                            type="number"
                            inputMode="decimal"
                            placeholder="0.00"
                            min="0.01"
                            max="99999999.99"
                            step="0.01"
                            value={amount}
                            onChange={(event) =>
                                setAmount(event.target.value)
                            }
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="category">
                            Category
                        </label>

                        <select
                            id="category"
                            value={categoryId}
                            onChange={(event) =>
                                setCategoryId(
                                    event.target.value
                                )
                            }
                            disabled={loadingCategories}
                            required
                        >
                            <option value="">
                                {loadingCategories
                                    ? "Loading categories..."
                                    : "Select category..."}
                            </option>

                            {availableCategories.map(
                                (category) => (
                                    <option
                                        key={
                                            category.category_id
                                        }
                                        value={
                                            category.category_id
                                        }
                                    >
                                        {
                                            category.category_name
                                        }
                                    </option>
                                )
                            )}
                        </select>

                        {categoryError && (
                            <p>{categoryError}</p>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">
                            Description (optional)
                        </label>

                        <input
                            id="description"
                            type="text"
                            placeholder="e.g. Groceries at No Frills"
                            maxLength="255"
                            value={description}
                            onChange={(event) =>
                                setDescription(
                                    event.target.value
                                )
                            }
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="date">
                            Date
                        </label>

                        <input
                            id="date"
                            type="date"
                            value={date}
                            onChange={(event) =>
                                setDate(event.target.value)
                            }
                            required
                        />
                    </div>

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="save-button"
                        >
                            Save Transaction
                        </button>

                        <button
                            type="button"
                            className="cancel-button"
                            onClick={onCancel}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}

export default AddTransactionPage;
