const express = require("express");

const app = express();

const PORT = 8080;

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "Smart Spend backend is running"
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});