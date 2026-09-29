const express = require("express");

const authRoutes = require("./routes/authRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const categoryRoutes = require("./routes/categoryRoutes");

const app = express();

app.use(express.json());

// Authentication
app.use("/api/auth", authRoutes);

// Transactions
app.use("/api/transactions", transactionRoutes);

// Categories
app.use("/api/categories", categoryRoutes);

module.exports = app;
