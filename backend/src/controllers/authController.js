const bcrypt = require("bcrypt");
const pool = require("../config/db");

const ALLOWED_CURRENCIES = ["CAD", "USD", "EUR", "GBP", "INR", "AUD", "JPY", "CNY"];

const isValidEmail = (value) =>
    typeof value === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const isValidName = (value) =>
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= 50 &&
    /^[A-Za-zÀ-ÿ' -]+$/.test(value.trim());

// LOGIN
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required."
        });
    }

    if (!isValidEmail(email)) {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid email address."
        });
    }

    try {
        const [users] = await pool.query(
            "SELECT * FROM users WHERE email = ?",
            [email.trim()]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const user = users[0];

        const passwordMatches = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            user: {
                userId: user.user_id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                preferredCurrency: user.preferred_currency
            }
        });

    } catch (err) {
        console.error("Login error:", err);

        return res.status(500).json({
            success: false,
            message: "Server error during login."
        });
    }
};


// REGISTER
const register = async (req, res) => {
    const {
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
        preferredCurrency
    } = req.body;

    if (
        !firstName ||
        !lastName ||
        !email ||
        !password ||
        !confirmPassword
    ) {
        return res.status(400).json({
            success: false,
            message: "All fields are required."
        });
    }

    if (!isValidName(firstName) || !isValidName(lastName)) {
        return res.status(400).json({
            success: false,
            message:
                "First and last name must be 1-50 characters and contain only letters, spaces, hyphens, or apostrophes."
        });
    }

    if (!isValidEmail(email) || email.trim().length > 100) {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid email address."
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

    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        return res.status(400).json({
            success: false,
            message: "Password must include at least one letter and one number."
        });
    }

    const currency = String(preferredCurrency || "CAD").trim().toUpperCase();

    if (!ALLOWED_CURRENCIES.includes(currency)) {
        return res.status(400).json({
            success: false,
            message: `Preferred currency must be one of: ${ALLOWED_CURRENCIES.join(", ")}.`
        });
    }

    const cleanEmail = email.trim();

    try {
        const [existing] = await pool.query(
            "SELECT user_id FROM users WHERE email = ?",
            [cleanEmail]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            `INSERT INTO users
            (first_name, last_name, email, password_hash, preferred_currency)
            VALUES (?, ?, ?, ?, ?)`,
            [
                firstName.trim(),
                lastName.trim(),
                cleanEmail,
                passwordHash,
                currency
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Account created successfully.",
            userId: result.insertId
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
