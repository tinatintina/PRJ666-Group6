
const pool = require("../config/db");

// GET default categories and this user's custom categories
const getCategories = async (req, res) => {
    const { userId } = req.query;

    try {
        let query = `
            SELECT *
            FROM categories
            WHERE user_id IS NULL
        `;
        const params = [];

        if (userId) {
            query += " OR user_id = ?";
            params.push(userId);
        }

        query += " ORDER BY category_type, category_name";

        const [categories] = await pool.query(query, params);

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
    const { userId } = req.query;

    try {
        let query = `
            SELECT *
            FROM categories
            WHERE category_id = ?
            AND user_id IS NULL
        `;
        const params = [id];

        if (userId) {
            query += " OR (category_id = ? AND user_id = ?)";
            params.push(id, userId);
        }

        const [categories] = await pool.query(query, params);

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


// CREATE a custom category
const createCategory = async (req, res) => {
    const { userId, categoryName, categoryType } = req.body;

    if (!userId || !categoryName || !categoryType) {
        return res.status(400).json({
            success: false,
            message: "User ID, category name, and category type are required."
        });
    }

    const name = categoryName.trim();

    if (!name || name.length > 100) {
        return res.status(400).json({
            success: false,
            message: "Category name must be between 1 and 100 characters."
        });
    }

    if (!["Income", "Expense"].includes(categoryType)) {
        return res.status(400).json({
            success: false,
            message: "Category type must be Income or Expense."
        });
    }

    try {
        const [users] = await pool.query(
            "SELECT user_id FROM users WHERE user_id = ?",
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const [existing] = await pool.query(
            `SELECT category_id
             FROM categories
             WHERE user_id = ?
             AND LOWER(category_name) = LOWER(?)
             AND category_type = ?`,
            [userId, name, categoryType]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "You already have a custom category with this name and type."
            });
        }

        const [result] = await pool.query(
            `INSERT INTO categories
                (category_name, category_type, user_id)
             VALUES (?, ?, ?)`,
            [name, categoryType, userId]
        );

        return res.status(201).json({
            success: true,
            message: "Custom category created successfully.",
            category: {
                category_id: result.insertId,
                category_name: name,
                category_type: categoryType,
                user_id: Number(userId)
            }
        });
    } catch (err) {
        console.error("Create category error:", err);
        return res.status(500).json({
            success: false,
            message: "Server error while creating category."
        });
    }
};


// UPDATE a custom category owned by the user
const updateCategory = async (req, res) => {
    const { id } = req.params;
    const { userId, categoryName, categoryType } = req.body;

    if (!userId || !categoryName || !categoryType) {
        return res.status(400).json({
            success: false,
            message: "User ID, category name, and category type are required."
        });
    }

    const name = categoryName.trim();

    if (!name || name.length > 100) {
        return res.status(400).json({
            success: false,
            message: "Category name must be between 1 and 100 characters."
        });
    }

    if (!["Income", "Expense"].includes(categoryType)) {
        return res.status(400).json({
            success: false,
            message: "Category type must be Income or Expense."
        });
    }

    try {
        const [existing] = await pool.query(
            `SELECT category_id
             FROM categories
             WHERE user_id = ?
             AND LOWER(category_name) = LOWER(?)
             AND category_type = ?
             AND category_id != ?`,
            [userId, name, categoryType, id]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "You already have a custom category with this name and type."
            });
        }

        const [result] = await pool.query(
            `UPDATE categories
             SET category_name = ?, category_type = ?
             WHERE category_id = ? AND user_id = ?`,
            [name, categoryType, id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Custom category not found or you do not have permission to update it."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Custom category updated successfully."
        });
    } catch (err) {
        console.error("Update category error:", err);
        return res.status(500).json({
            success: false,
            message: "Server error while updating category."
        });
    }
};


// DELETE a custom category owned by the user
const deleteCategory = async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({
            success: false,
            message: "User ID is required."
        });
    }

    try {
        const [result] = await pool.query(
            `DELETE FROM categories
             WHERE category_id = ? AND user_id = ?`,
            [id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Custom category not found or you do not have permission to delete it."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Custom category deleted successfully."
        });
    } catch (err) {
        if (err.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({
                success: false,
                message: "This category cannot be deleted because existing transactions use it."
            });
        }

        console.error("Delete category error:", err);
        return res.status(500).json({
            success: false,
            message: "Server error while deleting category."
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
