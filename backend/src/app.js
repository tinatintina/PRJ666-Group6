const express = require("express");

const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const userRoutes = require("./routes/userRoutes");
const currencyRoutes = require("./routes/currencyRoutes");

const app = express();

app.use(express.json());

// Authentication
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/users", userRoutes);
app.use("/api/currency", currencyRoutes);

module.exports = app;
