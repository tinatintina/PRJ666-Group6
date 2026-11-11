import { useEffect, useState } from "react";
import "./AddTransactionPage.css";
import {
    getTodayString,
    hasErrors,
    MAX_AMOUNT,
    validateTransaction,
} from "../utils/validation";

function AddTransactionPage({
    userId,
    onSave,
    onCancel,
}) {
    const [type, setType] =
        useState("expense");

    const [amount, setAmount] =
        useState("");

    const [categoryId, setCategoryId] =
        useState("");

    const [
        customCategory,
        setCustomCategory,
    ] = useState("");

    const [
        description,
        setDescription,
    ] = useState("");

    const [date, setDate] =
        useState(getTodayString());

    const [
        categories,
        setCategories,
    ] = useState([]);

    const [
        loadingCategories,
        setLoadingCategories,
    ] = useState(true);

    const [
        categoryError,
        setCategoryError,
    ] = useState("");

    // Field-level validation errors
    const [errors, setErrors] =
        useState({});

    // Error returned by the server on save
    const [submitError, setSubmitError] =
        useState("");

    const [saving, setSaving] =
        useState(false);

    // Remove a field's error as soon as the user edits it
    function clearError(field) {
        setSubmitError("");

        setErrors((current) => {
            if (!current[field]) {
                return current;
            }

            const next = { ...current };
            delete next[field];
            return next;
        });
    }

    // Load default categories and custom
    // categories for the logged-in user
    useEffect(() => {
        async function loadCategories() {
            if (!userId) {
                setCategoryError(
                    "No logged-in user found."
                );

                setLoadingCategories(false);
                return;
            }

            try {
                setLoadingCategories(true);
                setCategoryError("");

                const response = await fetch(
                    `/api/categories?userId=${userId}`
                );

                const data =
                    await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message ||
                        "Could not load categories."
                    );
                }

                setCategories(
                    data.categories
                );
            } catch (error) {
                console.error(
                    "Category error:",
                    error
                );

                setCategoryError(
                    "Could not load categories."
                );
            } finally {
                setLoadingCategories(false);
            }
        }

        loadCategories();
    }, [userId]);

    // Only show categories that match
    // the selected transaction type
    const availableCategories =
        categories.filter(
            (category) =>
                category.category_type.toLowerCase() ===
                type
        );

    function handleTypeChange(newType) {
        setType(newType);
        setCategoryId("");
        setCustomCategory("");
        clearError("category");
    }

    function handleCategoryChange(event) {
        const selectedCategory =
            event.target.value;

        setCategoryId(
            selectedCategory
        );

        clearError("category");

        if (
            selectedCategory !== "other"
        ) {
            setCustomCategory("");
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (saving) {
            return;
        }

        const validationErrors =
            validateTransaction({
                amount,
                categoryId,
                customCategory,
                description,
                date,
            });

        setErrors(validationErrors);
        setSubmitError("");

        if (hasErrors(validationErrors)) {
            return;
        }

        try {
            setSaving(true);

            await onSave({
            type,
            amount: Number(amount),

            categoryId:
                categoryId === "other"
                    ? null
                    : Number(categoryId),

            customCategory:
                categoryId === "other"
                    ? customCategory.trim()
                    : "",

            description:
                description.trim(),

            date,
            });
        } catch (error) {
            setSubmitError(
                error.message ||
                "Could not save transaction."
            );
        } finally {
            setSaving(false);
        }
    }

    // Props for an input that has an error message under it
    function errorProps(field) {
        return errors[field]
            ? {
                "aria-invalid": true,
                "aria-describedby": `${field}-error`,
                className: "input-error",
            }
            : {};
    }

    function renderError(field) {
        return errors[field] ? (
            <p
                id={`${field}-error`}
                className="field-error"
                role="alert"
            >
                {errors[field]}
            </p>
        ) : null;
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

                <h1>
                    Add Transaction
                </h1>
            </header>

            <main className="add-transaction-content">
                <form
                    className="add-transaction-card"
                    onSubmit={handleSubmit}
                    noValidate
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
                            {[
                                "expense",
                                "income",
                            ].map(
                                (option) => (
                                    <button
                                        key={
                                            option
                                        }
                                        type="button"
                                        className={
                                            type ===
                                                option
                                                ? "active-type"
                                                : ""
                                        }
                                        aria-pressed={
                                            type ===
                                            option
                                        }
                                        onClick={() =>
                                            handleTypeChange(
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
                            max={MAX_AMOUNT}
                            step="0.01"
                            value={amount}
                            onChange={(
                                event
                            ) => {
                                setAmount(
                                    event.target
                                        .value
                                );
                                clearError("amount");
                            }}
                            required
                            {...errorProps("amount")}
                        />

                        {renderError("amount")}
                    </div>

                    <div className="form-group">
                        <label htmlFor="category">
                            Category
                        </label>

                        <select
                            id="category"
                            value={categoryId}
                            onChange={
                                handleCategoryChange
                            }
                            disabled={
                                loadingCategories
                            }
                            required
                            {...(categoryId !== "other"
                                ? errorProps("category")
                                : {})}
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

                            {!loadingCategories && (
                                <option value="other">
                                    Other
                                </option>
                            )}
                        </select>

                        {categoryId ===
                            "other" && (
                                <input
                                    id="customCategory"
                                    className="custom-category-input"
                                    type="text"
                                    value={
                                        customCategory
                                    }
                                    onChange={(
                                        event
                                    ) => {
                                        setCustomCategory(
                                            event
                                                .target
                                                .value
                                        );
                                        clearError("category");
                                    }}
                                    placeholder="Enter your category"
                                    maxLength="100"
                                    required
                                    aria-label="Custom category name"
                                    {...errorProps("category")}
                                    className={
                                        errors.category
                                            ? "custom-category-input input-error"
                                            : "custom-category-input"
                                    }
                                />
                            )}

                        {renderError("category")}

                        {categoryError && (
                            <p className="category-error">
                                {
                                    categoryError
                                }
                            </p>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">
                            Description
                            (optional)
                        </label>

                        <input
                            id="description"
                            type="text"
                            placeholder="e.g. Groceries at No Frills"
                            maxLength="255"
                            value={
                                description
                            }
                            onChange={(
                                event
                            ) => {
                                setDescription(
                                    event.target
                                        .value
                                );
                                clearError("description");
                            }}
                            {...errorProps("description")}
                        />

                        {renderError("description")}
                    </div>

                    <div className="form-group">
                        <label htmlFor="date">
                            Date
                        </label>

                        <input
                            id="date"
                            type="date"
                            value={date}
                            min="2000-01-01"
                            max={getTodayString()}
                            onChange={(
                                event
                            ) => {
                                setDate(
                                    event.target
                                        .value
                                );
                                clearError("date");
                            }}
                            required
                            {...errorProps("date")}
                        />

                        {renderError("date")}
                    </div>

                    {submitError && (
                        <p
                            className="form-submit-error"
                            role="alert"
                        >
                            {submitError}
                        </p>
                    )}

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="save-button"
                            disabled={saving}
                        >
                            {saving
                                ? "Saving..."
                                : "Save Transaction"}
                        </button>

                        <button
                            type="button"
                            className="cancel-button"
                            onClick={
                                onCancel
                            }
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