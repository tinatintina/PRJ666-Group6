const express = require("express");

const {
    getTransactions,
    getTransactionById,
    createTransaction,
    updateTransaction,
    deleteTransaction
} = require("../controllers/transactionController");

const router = express.Router();


// Get all transactions for one user
router.get("/:userId", getTransactions);


// Get one transaction
router.get("/:userId/:id", getTransactionById);


// Create transaction
router.post("/", createTransaction);


// Update transaction
router.put("/:id", updateTransaction);


// Delete transaction
router.delete("/:id", deleteTransaction);


module.exports = router;
