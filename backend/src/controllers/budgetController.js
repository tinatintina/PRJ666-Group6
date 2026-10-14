const pool = require("../config/db");

// Budget columns plus spending computed live from Expense transactions.
// remaining_balance is calculated on read so it can never drift out of sync.
// If your budgets table has extra columns (e.g. created_at), add them here.
const BUDGET_SELECT = `
    SELECT b.budget_id,
           b.user_id,
           b.month,
           b.budget_amount,
           COALESCE(SUM(t.amount), 0) AS total_spent,
           b.budget_amount - COALESCE(SUM(t.amount), 0) AS remaining_balance
    FROM budgets b
    LEFT JOIN transactions t
           ON t.user_id = b.user_id
          AND t.transaction_type = 'Expense'
          AND LEFT(t.transaction_date, 7) = LEFT(b.month, 7)
`;

const isValidAmount = (value) =>
    Number.isFinite(Number(value)) && Number(value) >= 0;


// GET all budgets for a user
const getBudgets = async (req, res) => {
    const { userId } = req.params;

    try {
        const [budgets] = await pool.query(
            `${BUDGET_SELECT}
             WHERE b.user_id = ?
             GROUP BY b.budget_id
             ORDER BY b.month DESC`,
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
            `${BUDGET_SELECT}
             WHERE b.budget_id = ?
             AND b.user_id = ?
             GROUP BY b.budget_id`,
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

    if (!isValidAmount(budgetAmount)) {
        return res.status(400).json({
            success: false,
            message: "Budget amount must be a valid non-negative number."
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

        // remaining_balance is still inserted to satisfy the column,
        // but reads now compute it from transactions.
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

    if (!isValidAmount(budgetAmount)) {
        return res.status(400).json({
            success: false,
            message: "Budget amount must be a valid non-negative number."
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

        // No longer resets remaining_balance; it is computed on read.
        const [result] = await pool.query(
            `UPDATE budgets
             SET month = ?,
                 budget_amount = ?
             WHERE budget_id = ?
             AND user_id = ?`,
            [
                month,
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