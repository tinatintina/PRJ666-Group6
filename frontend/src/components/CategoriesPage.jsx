import { useState } from "react";
import "./CategoriesPage.css";

const startingCategories = [
    { id: 1, name: "Food & Dining", icon: "🍴", type: "Expense" },
    { id: 2, name: "Transportation", icon: "🚗", type: "Expense" },
    { id: 3, name: "Groceries", icon: "🛒", type: "Expense" },
    { id: 4, name: "Utilities", icon: "💡", type: "Expense" },
    { id: 5, name: "Entertainment", icon: "🎬", type: "Expense" },
    { id: 6, name: "Education", icon: "🎓", type: "Expense" },
    { id: 7, name: "Salary", icon: "💰", type: "Income" },
    { id: 8, name: "Other Income", icon: "📈", type: "Income" },
];

function CategoriesPage() {
    const [categories, setCategories] = useState(startingCategories);
    const [showForm, setShowForm] = useState(false);
    const [categoryName, setCategoryName] = useState("");
    const [categoryType, setCategoryType] = useState("Expense");

    function handleAddCategory(event) {
        event.preventDefault();

        const newCategory = {
            id: Date.now(),
            name: categoryName.trim(),
            icon: categoryType === "Income" ? "💰" : "🧾",
            type: categoryType,
        };

        setCategories([...categories, newCategory]);
        setCategoryName("");
        setCategoryType("Expense");
        setShowForm(false);
    }

    return (
        <main className="categories-page">
            <header className="categories-header">
                <div>
                    <p className="categories-brand">SMART SPEND</p>
                    <h1>Categories</h1>
                    <p>Organize your income and expenses.</p>
                </div>

                <div className="categories-header-actions">

                    <div className="categories-avatar">AD</div>
                </div>
            </header>

            <section className="categories-content">
                <div className="categories-toolbar">
                    <div>
                        <h2>Your Categories</h2>
                        <p>{categories.length} categories</p>
                    </div>

                    <button
                        className="add-category-button"
                        type="button"
                        onClick={() => setShowForm(true)}
                    >
                        + Add Category
                    </button>
                </div>

                {showForm && (
                    <form
                        className="category-form"
                        onSubmit={handleAddCategory}
                    >
                        <div>
                            <label htmlFor="categoryName">
                                Category Name
                            </label>

                            <input
                                id="categoryName"
                                type="text"
                                value={categoryName}
                                onChange={(event) =>
                                    setCategoryName(event.target.value)
                                }
                                placeholder="Enter category name"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="categoryType">
                                Category Type
                            </label>

                            <select
                                id="categoryType"
                                value={categoryType}
                                onChange={(event) =>
                                    setCategoryType(event.target.value)
                                }
                            >
                                <option value="Expense">Expense</option>
                                <option value="Income">Income</option>
                            </select>
                        </div>

                        <div className="category-form-buttons">
                            <button type="submit">Save Category</button>

                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                <div className="categories-grid">
                    {categories.map((category) => (
                        <article className="category-card" key={category.id}>
                            <div
                                className={`category-icon ${category.type === "Income"
                                    ? "income-icon"
                                    : "expense-icon"
                                    }`}
                            >
                                {category.icon}
                            </div>

                            <div className="category-details">
                                <h3>{category.name}</h3>

                                <span
                                    className={
                                        category.type === "Income"
                                            ? "income-label"
                                            : "expense-label"
                                    }
                                >
                                    {category.type}
                                </span>
                            </div>

                            <button
                                className="category-options"
                                type="button"
                                aria-label={`Options for ${category.name}`}
                            >
                                ⋮
                            </button>
                        </article>
                    ))}
                </div>
            </section>
        </main>
    );
}

export default CategoriesPage;