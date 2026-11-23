const pool = require("../config/db");
const {
    DEFAULT_CURRENCY,
    SUPPORTED_CURRENCIES,
    normalizeCurrency,
    isSupportedCurrency
} = require("../config/currencies");
const {
    createConverter,
    roundMoney
} = require("../services/exchangeRates");

// Budget columns plus spending computed live from Expense transactions.
// remaining_balance is calculated on read so it can never drift out of sync.
// If your budgets table has extra columns (e.g. created_at), add them here.
const BUDGET_SELECT = `
    SELECT b.budget_id,
           b.user_id,
           b.month,
           b.budget_amount,
           b.currency AS budget_currency,
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

// Budgets are stored per month as "YYYY-MM".
const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

const isValidMonth = (value) =>
    typeof value === "string" && MONTH_PATTERN.test(value);

const MAX_HISTORY_MONTHS = 36;

const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

// "2026-11" + 2 -> "2027-01"
const addMonths = (month, count) => {
    const [year, monthNumber] = month.split("-").map(Number);
    const date = new Date(year, monthNumber - 1 + count, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const listMonths = (from, to) => {
    const months = [];
    for (let month = from; month <= to; month = addMonths(month, 1)) {
        months.push(month);
    }
    return months;
};

const getMonthStatus = (month) => {
    const current = getCurrentMonth();
    if (month < current) return "past";
    if (month > current) return "future";
    return "current";
};

// Each budget is saved in the currency it was entered in (budgets.currency).
// When budgets are read, the budget amount and all spending are converted into
// the user's current preferred currency so they can be compared fairly.

// Returns the budget with budget_amount converted into the target currency.
// The amount as it was entered is kept in original_budget_amount.
const convertBudget = (budget, convert, targetCurrency) => {
    if (!budget) {
        return budget;
    }

    const budgetCurrency =
        normalizeCurrency(budget.budget_currency) || targetCurrency;

    return {
        ...budget,
        budget_currency: budgetCurrency,
        original_budget_amount: Number(budget.budget_amount),
        budget_amount: roundMoney(
            convert(budget.budget_amount, budgetCurrency)
        )
    };
};

// Currency to save a budget in: the one sent by the frontend, or the
// user's preferred currency if none was sent.
const resolveBudgetCurrency = async (currency, userId) => {
    if (currency !== undefined && currency !== null && currency !== "") {
        const code = normalizeCurrency(currency);
        return isSupportedCurrency(code) ? { currency: code } : { error: true };
    }

    return { currency: (await getUserCurrency(userId)) || DEFAULT_CURRENCY };
};

const getUserCurrency = async (userId) => {
    const [users] = await pool.query(
        "SELECT preferred_currency FROM users WHERE user_id = ?",
        [userId]
    );

    if (users.length === 0) {
        return null;
    }

    return users[0].preferred_currency || DEFAULT_CURRENCY;
};

// Income, expenses and spending by category for each month in [from, to],
// converted into one currency. Returns { [month]: { income, expense, byCategory } }.
const getMonthlyActivity = async (userId, from, to, convert) => {
    const [rows] = await pool.query(
        `SELECT DATE_FORMAT(t.transaction_date, '%Y-%m') AS month,
                t.transaction_type,
                t.currency,
                c.category_name,
                SUM(t.amount) AS total
         FROM transactions t
         JOIN categories c ON t.category_id = c.category_id
         WHERE t.user_id = ?
         AND t.transaction_date >= ?
         AND t.transaction_date < ?
         GROUP BY month, t.transaction_type, t.currency, c.category_name`,
        [userId, `${from}-01`, `${addMonths(to, 1)}-01`]
    );

    const activity = {};

    for (const row of rows) {
        const monthData = activity[row.month] ||
            (activity[row.month] = { income: 0, expense: 0, byCategory: {} });

        const amount = convert(row.total, row.currency);

        if (String(row.transaction_type).toLowerCase() === "income") {
            monthData.income += amount;
        } else {
            monthData.expense += amount;
            monthData.byCategory[row.category_name] =
                (monthData.byCategory[row.category_name] || 0) + amount;
        }
    }

    return activity;
};

// Builds the summary returned for one month (with or without a budget).
const buildMonthSummary = (month, budget, monthActivity) => {
    const activity = monthActivity || { income: 0, expense: 0, byCategory: {} };
    const budgetAmount = budget ? Number(budget.budget_amount) : null;
    const spent = roundMoney(activity.expense);

    return {
        month,
        status: getMonthStatus(month),
        hasBudget: Boolean(budget),
        budgetId: budget ? budget.budget_id : null,
        budgetAmount,
        budgetCurrency: budget ? budget.budget_currency : null,
        originalBudgetAmount: budget ? budget.original_budget_amount : null,
        totalIncome: roundMoney(activity.income),
        totalSpent: spent,
        remaining: budget ? roundMoney(budgetAmount - spent) : null,
        percentUsed: budget && budgetAmount > 0
            ? Math.round((spent / budgetAmount) * 100)
            : null,
        overBudget: budget ? spent > budgetAmount : false
    };
};

// Replaces SQL-summed spending with spending converted into the user's currency,
// so transactions in other currencies are counted correctly.
const applyConvertedSpending = async (budgets, userId) => {
    if (budgets.length === 0) {
        return budgets;
    }

    const currency = (await getUserCurrency(userId)) || DEFAULT_CURRENCY;
    const { convert } = await createConverter(currency);

    const months = budgets.map((b) => String(b.month).slice(0, 7)).sort();
    const activity = await getMonthlyActivity(
        userId, months[0], months[months.length - 1], convert
    );

    return budgets.map((row) => {
        const budget = convertBudget(row, convert, currency);
        const spent = roundMoney(activity[String(budget.month).slice(0, 7)]?.expense || 0);

        return {
            ...budget,
            currency,
            total_spent: spent,
            remaining_balance: roundMoney(Number(budget.budget_amount) - spent)
        };
    });
};


// GET budget summary for any month (past, current or future)
// /api/budgets/:userId/month/:month   e.g. /api/budgets/4/month/2026-12
const getMonthlyBudgetSummary = async (req, res) => {
    const { userId, month } = req.params;

    if (!isValidMonth(month)) {
        return res.status(400).json({
            success: false,
            message: "Month must be in YYYY-MM format."
        });
    }

    try {
        const currency = await getUserCurrency(userId);

        if (!currency) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const { convert, info } = await createConverter(currency);

        const [budgets] = await pool.query(
            `SELECT budget_id, budget_amount, currency AS budget_currency
             FROM budgets
             WHERE user_id = ?
             AND LEFT(month, 7) = ?
             LIMIT 1`,
            [userId, month]
        );

        const activity = await getMonthlyActivity(userId, month, month, convert);
        const summary = buildMonthSummary(
            month,
            convertBudget(budgets[0], convert, info.currency),
            activity[month]
        );

        const spendingByCategory = Object.entries(activity[month]?.byCategory || {})
            .map(([categoryName, amount]) => ({
                categoryName,
                amount: roundMoney(amount)
            }))
            .sort((a, b) => b.amount - a.amount);

        return res.status(200).json({
            success: true,
            currency: info.currency,
            rateDate: info.rateDate,
            rateSource: info.rateSource,
            previousMonth: addMonths(month, -1),
            nextMonth: addMonths(month, 1),
            summary: {
                ...summary,
                spendingByCategory
            }
        });

    } catch (err) {
        console.error("Get monthly budget summary error:", err);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching the monthly budget."
        });
    }
};


// GET budget vs spending for a range of months (for reports and history)
// /api/budgets/:userId/history?from=2026-01&to=2026-12
// Defaults: 6 months back to 3 months ahead. Max 36 months.
const getBudgetHistory = async (req, res) => {
    const { userId } = req.params;
    const current = getCurrentMonth();
    const from = req.query.from || addMonths(current, -6);
    const to = req.query.to || addMonths(current, 3);

    if (!isValidMonth(from) || !isValidMonth(to)) {
        return res.status(400).json({
            success: false,
            message: "From and to must be in YYYY-MM format."
        });
    }

    if (from > to) {
        return res.status(400).json({
            success: false,
            message: "From month must be before or equal to the to month."
        });
    }

    const months = listMonths(from, to);

    if (months.length > MAX_HISTORY_MONTHS) {
        return res.status(400).json({
            success: false,
            message: `Please choose a range of ${MAX_HISTORY_MONTHS} months or fewer.`
        });
    }

    try {
        const currency = await getUserCurrency(userId);

        if (!currency) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const { convert, info } = await createConverter(currency);

        const [budgets] = await pool.query(
            `SELECT budget_id, LEFT(month, 7) AS month, budget_amount,
                    currency AS budget_currency
             FROM budgets
             WHERE user_id = ?
             AND LEFT(month, 7) BETWEEN ? AND ?`,
            [userId, from, to]
        );

        const budgetsByMonth = {};
        for (const budget of budgets) {
            budgetsByMonth[budget.month] = convertBudget(budget, convert, info.currency);
        }

        const activity = await getMonthlyActivity(userId, from, to, convert);

        return res.status(200).json({
            success: true,
            currency: info.currency,
            rateDate: info.rateDate,
            rateSource: info.rateSource,
            from,
            to,
            months: months.map((month) =>
                buildMonthSummary(month, budgetsByMonth[month], activity[month])
            )
        });

    } catch (err) {
        console.error("Get budget history error:", err);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching budget history."
        });
    }
};


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
            budgets: await applyConvertedSpending(budgets, userId)
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

        const [budget] = await applyConvertedSpending(budgets, userId);

        return res.status(200).json({
            success: true,
            budget
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
        budgetAmount,
        currency
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

    if (!isValidMonth(month)) {
        return res.status(400).json({
            success: false,
            message: "Month must be in YYYY-MM format."
        });
    }

    try {
        const budgetCurrency = await resolveBudgetCurrency(currency, userId);

        if (budgetCurrency.error) {
            return res.status(400).json({
                success: false,
                message: `Currency must be one of: ${SUPPORTED_CURRENCIES.join(", ")}.`
            });
        }

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
             (user_id, month, budget_amount, remaining_balance, currency)
             VALUES (?, ?, ?, ?, ?)`,
            [
                userId,
                month,
                budgetAmount,
                budgetAmount,
                budgetCurrency.currency
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
        budgetAmount,
        currency
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

    if (!isValidMonth(month)) {
        return res.status(400).json({
            success: false,
            message: "Month must be in YYYY-MM format."
        });
    }

    try {
        const budgetCurrency = await resolveBudgetCurrency(currency, userId);

        if (budgetCurrency.error) {
            return res.status(400).json({
                success: false,
                message: `Currency must be one of: ${SUPPORTED_CURRENCIES.join(", ")}.`
            });
        }

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
                 budget_amount = ?,
                 currency = ?
             WHERE budget_id = ?
             AND user_id = ?`,
            [
                month,
                budgetAmount,
                budgetCurrency.currency,
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
    getMonthlyBudgetSummary,
    getBudgetHistory,
    getBudgetById,
    createBudget,
    updateBudget,
    deleteBudget
};