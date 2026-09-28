const express = require("express");

const {
    getTransactions,
    getTransactionById,
    createTransaction,
    updateTransaction,
    deleteTransaction
} = require("../controllers/transactionController");

const router = express.Router();

router.get("/:userId", getTransactions);
router.get("/:userId/:id", getTransactionById);

router.post("/", createTransaction);
router.put("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);

module.exports = router;

