const bcrypt = require("bcrypt");
const pool = require("../config/db");

const login = (req, res) => {
    const { email, password } = req.body;

    console.log("Login request received:", email);

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required."
        });
    }

    return res.status(200).json({
        success: true,
        message: "Login API is working"
    });
};

const register = async (req, res) => {
    const { firstName, lastName, email, password, confirmPassword, preferredCurrency } = req.body;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
        return res.status(400).json({
            success: false,
            message: "All fields are required."
        });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({
            success: false,
            message: "Passwords do not match."
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 8 characters."
        });
    }

    try {
        const [existing] = await pool.query(
            "SELECT user_id FROM users WHERE email = ?",
            [email]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        await pool.query(
            `INSERT INTO users (first_name, last_name, email, password_hash, preferred_currency)
             VALUES (?, ?, ?, ?, ?)`,
            [firstName, lastName, email, passwordHash, preferredCurrency || "CAD"]
        );

        return res.status(201).json({
            success: true,
            message: "Account created successfully."
        });

    } catch (err) {
        console.error("Registration error:", err);
        return res.status(500).json({
            success: false,
            message: "Server error during registration."
        });
    }
};

module.exports = {
    login,
    register
};