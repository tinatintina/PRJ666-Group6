const pool = require("../config/db");

// GET all budgets for a user
const getBudgets = async (req, res) => {
    const { userId } = req.params;

    try {
        const [budgets] = await pool.query(
            `SELECT *
             FROM budgets
             WHERE user_id = ?
             ORDER BY month DESC`,
            [userId]
        );

        return res.status(200).json({
            success: true,
            budgets
        });

    } catch (err) {
        console.error("Get budgets error:", err);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching budgets."
        });
    }
};


// GET one budget
const getBudgetById = async (req, res) => {
    const { userId, id } = req.params;

    try {
        const [budgets] = await pool.query(
            `SELECT *
             FROM budgets
             WHERE budget_id = ?
             AND user_id = ?`,
            [id, userId]
        );

        if (budgets.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Budget not found."
            });
        }

        return res.status(200).json({
            success: true,
            budget: budgets[0]
        });

    } catch (err) {
        console.error("Get budget error:", err);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching budget."
        });
    }
};


// CREATE budget
const createBudget = async (req, res) => {
    const {
        userId,
        month,
        budgetAmount
    } = req.body;

    if (!userId || !month || budgetAmount === undefined) {
        return res.status(400).json({
            success: false,
            message: "User ID, month, and budget amount are required."
        });
    }

    if (Number(budgetAmount) < 0) {
        return res.status(400).json({
            success: false,
            message: "Budget amount cannot be negative."
        });
    }

    try {
        // Check whether user exists
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

        // Check whether budget already exists for this month
        const [existingBudget] = await pool.query(
            `SELECT budget_id
             FROM budgets
             WHERE user_id = ?
             AND month = ?`,
            [userId, month]
        );

        if (existingBudget.length > 0) {
            return res.status(409).json({
                success: false,
                message: "A budget already exists for this month."
            });
        }

        const [result] = await pool.query(
            `INSERT INTO budgets
             (user_id, month, budget_amount, remaining_balance)
             VALUES (?, ?, ?, ?)`,
            [
                userId,
                month,
                budgetAmount,
                budgetAmount
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Budget created successfully.",
            budgetId: result.insertId
        });

    } catch (err) {
        console.error("Create budget error:", err);

        return res.status(500).json({
            success: false,
            message: "Server error while creating budget."
        });
    }
};


// UPDATE budget
const updateBudget = async (req, res) => {
    const { id } = req.params;

    const {
        userId,
        month,
        budgetAmount
    } = req.body;

    if (!userId || !month || budgetAmount === undefined) {
        return res.status(400).json({
            success: false,
            message: "User ID, month, and budget amount are required."
        });
    }

    if (Number(budgetAmount) < 0) {
        return res.status(400).json({
            success: false,
            message: "Budget amount cannot be negative."
        });
    }

    try {
        // Check whether another budget already exists for this month
        const [existingBudget] = await pool.query(
            `SELECT budget_id
             FROM budgets
             WHERE user_id = ?
             AND month = ?
             AND budget_id != ?`,
            [userId, month, id]
        );

        if (existingBudget.length > 0) {
            return res.status(409).json({
                success: false,
                message: "A budget already exists for this month."
            });
        }

        const [result] = await pool.query(
            `UPDATE budgets
             SET month = ?,
                 budget_amount = ?,
                 remaining_balance = ?
             WHERE budget_id = ?
             AND user_id = ?`,
            [
                month,
                budgetAmount,
                budgetAmount,
                id,
                userId
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Budget not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Budget updated successfully."
        });

    } catch (err) {
        console.error("Update budget error:", err);

        return res.status(500).json({
            success: false,
            message: "Server error while updating budget."
        });
    }
};

// DELETE budget
const deleteBudget = async (req, res) => {
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
            `DELETE FROM budgets
             WHERE budget_id = ?
             AND user_id = ?`,
            [id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Budget not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Budget deleted successfully."
        });

    } catch (err) {
        console.error("Delete budget error:", err);

        return res.status(500).json({
            success: false,
            message: "Server error while deleting budget."
        });
    }
};


module.exports = {
    getBudgets,
    getBudgetById,
    createBudget,
    updateBudget,
    deleteBudget
};

