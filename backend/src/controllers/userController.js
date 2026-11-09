const bcrypt = require("bcrypt");
const pool = require("../config/db");

const ALLOWED_CURRENCIES = ["CAD", "USD", "EUR", "GBP", "INR", "AUD", "JPY", "CNY"];

const isValidId = (value) =>
    Number.isInteger(Number(value)) && Number(value) > 0;

const isValidEmail = (value) =>
    typeof value === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

// Same shape as the "user" object returned by /api/auth/login
const formatUser = (user) => ({
    userId: user.user_id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    preferredCurrency: user.preferred_currency,
    createdAt: user.created_at
});


// GET user profile
const getUserProfile = async (req, res) => {
    const { userId } = req.params;

    if (!isValidId(userId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid user ID."
        });
    }

    try {
        const [users] = await pool.query(
            `SELECT user_id, first_name, last_name, email,
                    preferred_currency, created_at
             FROM users
             WHERE user_id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        return res.status(200).json({
            success: true,
            user: formatUser(users[0])
        });

    } catch (err) {
        console.error("Get user profile error:", err);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching profile."
        });
    }
};


// UPDATE user profile (any of: firstName, lastName, email, preferredCurrency)
const updateUserProfile = async (req, res) => {
    const { userId } = req.params;
    const {
        firstName,
        lastName,
        email,
        preferredCurrency
    } = req.body;

    if (!isValidId(userId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid user ID."
        });
    }

    const fields = [];
    const values = [];

    if (firstName !== undefined) {
        if (typeof firstName !== "string" || !firstName.trim() || firstName.trim().length > 50) {
            return res.status(400).json({
                success: false,
                message: "First name is required and must be 50 characters or fewer."
            });
        }
        fields.push("first_name = ?");
        values.push(firstName.trim());
    }

    if (lastName !== undefined) {
        if (typeof lastName !== "string" || !lastName.trim() || lastName.trim().length > 50) {
            return res.status(400).json({
                success: false,
                message: "Last name is required and must be 50 characters or fewer."
            });
        }
        fields.push("last_name = ?");
        values.push(lastName.trim());
    }

    if (email !== undefined) {
        if (!isValidEmail(email) || email.trim().length > 100) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });
        }
        fields.push("email = ?");
        values.push(email.trim());
    }

    if (preferredCurrency !== undefined) {
        const currency = String(preferredCurrency).trim().toUpperCase();

        if (!ALLOWED_CURRENCIES.includes(currency)) {
            return res.status(400).json({
                success: false,
                message: `Preferred currency must be one of: ${ALLOWED_CURRENCIES.join(", ")}.`
            });
        }
        fields.push("preferred_currency = ?");
        values.push(currency);
    }

    if (fields.length === 0) {
        return res.status(400).json({
            success: false,
            message: "No profile fields were provided to update."
        });
    }

    try {
        const [existingUser] = await pool.query(
            "SELECT user_id FROM users WHERE user_id = ?",
            [userId]
        );

        if (existingUser.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        if (email !== undefined) {
            const [emailTaken] = await pool.query(
                "SELECT user_id FROM users WHERE email = ? AND user_id <> ?",
                [email.trim(), userId]
            );

            if (emailTaken.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "An account with this email already exists."
                });
            }
        }

        await pool.query(
            `UPDATE users SET ${fields.join(", ")} WHERE user_id = ?`,
            [...values, userId]
        );

        const [users] = await pool.query(
            `SELECT user_id, first_name, last_name, email,
                    preferred_currency, created_at
             FROM users
             WHERE user_id = ?`,
            [userId]
        );

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            user: formatUser(users[0])
        });

    } catch (err) {
        console.error("Update user profile error:", err);

        return res.status(500).json({
            success: false,
            message: "Server error while updating profile."
        });
    }
};


// CHANGE password
const changePassword = async (req, res) => {
    const { userId } = req.params;
    const {
        currentPassword,
        newPassword,
        confirmPassword
    } = req.body;

    if (!isValidId(userId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid user ID."
        });
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
            success: false,
            message: "All password fields are required."
        });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({
            success: false,
            message: "New passwords do not match."
        });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 8 characters."
        });
    }

    try {
        const [users] = await pool.query(
            "SELECT password_hash FROM users WHERE user_id = ?",
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const passwordMatches = await bcrypt.compare(
            currentPassword,
            users[0].password_hash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect."
            });
        }

        const passwordHash = await bcrypt.hash(newPassword, 10);

        await pool.query(
            "UPDATE users SET password_hash = ? WHERE user_id = ?",
            [passwordHash, userId]
        );

        return res.status(200).json({
            success: true,
            message: "Password changed successfully."
        });

    } catch (err) {
        console.error("Change password error:", err);

        return res.status(500).json({
            success: false,
            message: "Server error while changing password."
        });
    }
};


module.exports = {
    getUserProfile,
    updateUserProfile,
    changePassword
};
