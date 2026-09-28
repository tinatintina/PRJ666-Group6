const express = require("express");

const authRoutes = require("./routes/authRoutes");
const transactionRoutes = require("./routes/transactionRoutes");

const app = express();

app.use(express.json());


// Authentication
app.use("/api/auth", authRoutes);


// Transactions
app.use("/api/transactions", transactionRoutes);


module.exports = app;
