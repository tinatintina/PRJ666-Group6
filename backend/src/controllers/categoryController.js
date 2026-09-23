const pool = require("../config/db");

// GET all categories
const getCategories = async (req, res) => {
    try {
        const [categories] = await pool.query(
            "SELECT * FROM categories ORDER BY category_type, category_name"
        );

        return res.status(200).json({
            success: true,
            categories
        });

    } catch (err) {
        console.error("Get categories error:", err);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching categories."
        });
    }
};


// GET one category
const getCategoryById = async (req, res) => {
    const { id } = req.params;

    try {
        const [categories] = await pool.query(
            "SELECT * FROM categories WHERE category_id = ?",
            [id]
        );

        if (categories.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Category not found."
            });
        }

        return res.status(200).json({
            success: true,
            category: categories[0]
        });

    } catch (err) {
        console.error("Get category error:", err);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching category."
        });
    }
};


// CREATE category
const createCategory = async (req, res) => {
    const { categoryName, categoryType } = req.body;

    if (!categoryName || !categoryType) {
        return res.status(400).json({
            success: false,
            message: "Category name and category type are required."
        });
    }

    if (!["Income", "Expense"].includes(categoryType)) {
        return res.status(400).json({
            success: false,
            message: "Category type must be Income or Expense."
        });
    }

    try {
        const [result] = await pool.query(
            `INSERT INTO categories (category_name, category_type)
             VALUES (?, ?)`,
            [categoryName, categoryType]
        );

        return res.status(201).json({
            success: true,
            message: "Category created successfully.",
            categoryId: result.insertId
        });

    } catch (err) {
        console.error("Create category error:", err);

        return res.status(500).json({
            success: false,
            message: "Server error while creating category."
        });
    }
};


// UPDATE category
const updateCategory = async (req, res) => {
    const { id } = req.params;
    const { categoryName, categoryType } = req.body;

    if (!categoryName || !categoryType) {
        return res.status(400).json({
            success: false,
            message: "Category name and category type are required."
        });
    }

    if (!["Income", "Expense"].includes(categoryType)) {
        return res.status(400).json({
            success: false,
            message: "Category type must be Income or Expense."
        });
    }

    try {
        const [result] = await pool.query(
            `UPDATE categories
             SET category_name = ?, category_type = ?
             WHERE category_id = ?`,
            [categoryName, categoryType, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Category not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Category updated successfully."
        });

    } catch (err) {
        console.error("Update category error:", err);

        return res.status(500).json({
            success: false,
            message: "Server error while updating category."
        });
    }
};


// DELETE category
const deleteCategory = async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query(
            "DELETE FROM categories WHERE category_id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Category not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Category deleted successfully."
        });

    } catch (err) {
        console.error("Delete category error:", err);

        return res.status(500).json({
            success: false,
            message: "Category cannot be deleted because it may be used by existing transactions."
        });
    }
};


module.exports = {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};

