const pool = require("../config/db");


// GET ALL TRANSACTIONS FOR A USER
const getTransactions = async (req, res) => {
    const { userId } = req.params;

    try {
        const [transactions] = await pool.query(
            `SELECT
                t.transaction_id,
                t.user_id,
                t.category_id,
                c.category_name,
                t.amount,
                t.currency,
                t.transaction_date,
                t.transaction_type,
                t.description
            FROM transactions t
            JOIN categories c
                ON t.category_id = c.category_id
            WHERE t.user_id = ?
            ORDER BY t.transaction_date DESC`,
            [userId]
        );

        return res.status(200).json({
            success: true,
            transactions
        });

    } catch (err) {
        console.error("Get transactions error:", err);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching transactions."
        });
    }
};


// GET ONE TRANSACTION
const getTransactionById = async (req, res) => {
    const { userId, id } = req.params;

    try {
        const [transactions] = await pool.query(
            `SELECT
                t.transaction_id,
                t.user_id,
                t.category_id,
                c.category_name,
                t.amount,
                t.currency,
                t.transaction_date,
                t.transaction_type,
                t.description
            FROM transactions t
            JOIN categories c
                ON t.category_id = c.category_id
            WHERE t.transaction_id = ?
            AND t.user_id = ?`,
            [id, userId]
        );

        if (transactions.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found."
            });
        }

        return res.status(200).json({
            success: true,
            transaction: transactions[0]
        });

    } catch (err) {
        console.error("Get transaction error:", err);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching transaction."
        });
    }
};


// CREATE TRANSACTION
const createTransaction = async (req, res) => {
    const {
        userId,
        categoryId,
        amount,
        currency,
        transactionDate,
        transactionType,
        description
    } = req.body;

    if (
        !userId ||
        !categoryId ||
        !amount ||
        !currency ||
        !transactionDate ||
        !transactionType
    ) {
        return res.status(400).json({
            success: false,
            message:
                "User, category, amount, currency, date, and transaction type are required."
        });
    }

    if (Number(amount) <= 0) {
        return res.status(400).json({
            success: false,
            message: "Transaction amount must be greater than zero."
        });
    }

    if (!["Income", "Expense"].includes(transactionType)) {
        return res.status(400).json({
            success: false,
            message: "Transaction type must be Income or Expense."
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

        const [categories] = await pool.query(
            `SELECT category_id
            FROM categories
            WHERE category_id = ?
            AND category_type = ?`,
            [categoryId, transactionType]
        );

        if (categories.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid category for this transaction type."
            });
        }

        const [result] = await pool.query(
            `INSERT INTO transactions
            (
                user_id,
                category_id,
                amount,
                currency,
                transaction_date,
                transaction_type,
                description
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                categoryId,
                amount,
                currency,
                transactionDate,
                transactionType,
                description || null
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Transaction created successfully.",
            transactionId: result.insertId
        });

    } catch (err) {
        console.error("Create transaction error:", err);

        return res.status(500).json({
            success: false,
            message: "Server error while creating transaction."
        });
    }
};


// UPDATE TRANSACTION
const updateTransaction = async (req, res) => {
    const { id } = req.params;

    const {
        userId,
        categoryId,
        amount,
        currency,
        transactionDate,
        transactionType,
        description
    } = req.body;

    if (
        !userId ||
        !categoryId ||
        !amount ||
        !currency ||
        !transactionDate ||
        !transactionType
    ) {
        return res.status(400).json({
            success: false,
            message:
                "User, category, amount, currency, date, and transaction type are required."
        });
    }

    if (Number(amount) <= 0) {
        return res.status(400).json({
            success: false,
            message: "Transaction amount must be greater than zero."
        });
    }

    try {
        const [result] = await pool.query(
            `UPDATE transactions
            SET
                category_id = ?,
                amount = ?,
                currency = ?,
                transaction_date = ?,
                transaction_type = ?,
                description = ?
            WHERE transaction_id = ?
            AND user_id = ?`,
            [
                categoryId,
                amount,
                currency,
                transactionDate,
                transactionType,
                description || null,
                id,
                userId
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Transaction updated successfully."
        });

    } catch (err) {
        console.error("Update transaction error:", err);

        return res.status(500).json({
            success: false,
            message: "Server error while updating transaction."
        });
    }
};


// DELETE TRANSACTION
const deleteTransaction = async (req, res) => {
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
            `DELETE FROM transactions
            WHERE transaction_id = ?
            AND user_id = ?`,
            [id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Transaction deleted successfully."
        });

    } catch (err) {
        console.error("Delete transaction error:", err);

        return res.status(500).json({
            success: false,
            message: "Server error while deleting transaction."
        });
    }
};


module.exports = {
    getTransactions,
    getTransactionById,
    createTransaction,
    updateTransaction,
    deleteTransaction
};
