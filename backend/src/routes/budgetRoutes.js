const express = require("express");

const {
    getBudgets,
    getBudgetById,
    createBudget,
    updateBudget,
    deleteBudget
} = require("../controllers/budgetController");

const router = express.Router();

router.get("/:userId", getBudgets);
router.get("/:userId/:id", getBudgetById);

router.post("/", createBudget);
router.put("/:id", updateBudget);
router.delete("/:id", deleteBudget);

module.exports = router;

