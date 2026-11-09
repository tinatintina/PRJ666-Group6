const express = require("express");

const {
    getTransactions,
    getTransactionTotals,
    getTransactionById,
    createTransaction,
    updateTransaction,
    deleteTransaction
} = require("../controllers/transactionController");

const router = express.Router();


// Get all transactions for one user
router.get("/:userId", getTransactions);


// Get income/expense totals (optional ?month=YYYY-MM)
// Must stay above "/:userId/:id" so "totals" is not treated as an ID
router.get("/:userId/totals", getTransactionTotals);


// Get one transaction
router.get("/:userId/:id", getTransactionById);


// Create transaction
router.post("/", createTransaction);


// Update transaction
router.put("/:id", updateTransaction);


// Delete transaction
router.delete("/:id", deleteTransaction);


module.exports = router;
