const express = require("express");

const {
    getBudgets,
    getMonthlyBudgetSummary,
    getBudgetHistory,
    getBudgetById,
    createBudget,
    updateBudget,
    deleteBudget
} = require("../controllers/budgetController");

const router = express.Router();

router.get("/:userId", getBudgets);

// Past/current/future months. These must stay above "/:userId/:id".
router.get("/:userId/history", getBudgetHistory);
router.get("/:userId/month/:month", getMonthlyBudgetSummary);
router.get("/:userId/:id", getBudgetById);

router.post("/", createBudget);
router.put("/:id", updateBudget);
router.delete("/:id", deleteBudget);

module.exports = router;

