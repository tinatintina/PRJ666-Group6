const pool = require("./db");

// Small schema updates that run when the server starts, so everyone's
// local database stays up to date without re-creating it.
// Each one checks first and does nothing if it has already been applied.

const columnExists = async (table, column) => {
    const [rows] = await pool.query(
        `SELECT COUNT(*) AS count
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = ?
         AND COLUMN_NAME = ?`,
        [table, column]
    );

    return rows[0].count > 0;
};

// database/migrations/001_add_budget_currency.sql
const addBudgetCurrency = async () => {
    if (await columnExists("budgets", "currency")) {
        return;
    }

    await pool.query(
        `ALTER TABLE budgets
         ADD COLUMN currency VARCHAR(10) NOT NULL DEFAULT 'CAD'`
    );

    // Existing budgets were entered in the user's preferred currency.
    await pool.query(
        `UPDATE budgets b
         JOIN users u ON u.user_id = b.user_id
         SET b.currency = u.preferred_currency`
    );

    console.log("Database updated: added currency to budgets.");
};

const runMigrations = async () => {
    await addBudgetCurrency();
};

module.exports = runMigrations;
