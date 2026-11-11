// Shared form validation helpers for Smart Spend.
// Each validator returns an object of { fieldName: "error message" }.
// An empty object means the form is valid.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const MAX_AMOUNT = 99999999.99;

// Local date as YYYY-MM-DD
export function getTodayString() {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60000;

    return new Date(now.getTime() - offsetMs)
        .toISOString()
        .slice(0, 10);
}

export function hasErrors(errors) {
    return Object.keys(errors).length > 0;
}

function validateEmail(email) {
    const value = (email || "").trim();

    if (!value) {
        return "Email is required.";
    }

    if (value.length > 100) {
        return "Email must be 100 characters or fewer.";
    }

    if (!EMAIL_PATTERN.test(value)) {
        return "Please enter a valid email address (e.g. name@example.com).";
    }

    return "";
}

// More than 2 decimal places is not a valid money amount
function hasTooManyDecimals(value) {
    const text = String(value);
    const parts = text.split(".");

    return parts.length === 2 && parts[1].length > 2;
}


// LOGIN
export function validateLogin({ email, password }) {
    const errors = {};

    const emailError = validateEmail(email);
    if (emailError) {
        errors.email = emailError;
    }

    if (!password) {
        errors.password = "Password is required.";
    }

    return errors;
}


// REGISTER
export function validateRegister({
    fullName,
    email,
    password,
    confirmPassword,
}) {
    const errors = {};

    const nameParts = (fullName || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (nameParts.length === 0) {
        errors.fullName = "Full name is required.";
    } else if (nameParts.length < 2) {
        errors.fullName = "Please enter your first and last name.";
    } else if (
        nameParts[0].length > 50 ||
        nameParts.slice(1).join(" ").length > 50
    ) {
        errors.fullName = "First and last name must each be 50 characters or fewer.";
    } else if (!/^[A-Za-zÀ-ÿ' -]+$/.test(nameParts.join(" "))) {
        errors.fullName = "Name can only contain letters, spaces, hyphens, and apostrophes.";
    }

    const emailError = validateEmail(email);
    if (emailError) {
        errors.email = emailError;
    }

    if (!password) {
        errors.password = "Password is required.";
    } else if (password.length < 8) {
        errors.password = "Password must be at least 8 characters.";
    } else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        errors.password = "Password must include at least one letter and one number.";
    }

    if (!confirmPassword) {
        errors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
        errors.confirmPassword = "Passwords do not match.";
    }

    return errors;
}


// ADD TRANSACTION
export function validateTransaction({
    amount,
    categoryId,
    customCategory,
    description,
    date,
}) {
    const errors = {};

    if (amount === "" || amount === null || amount === undefined) {
        errors.amount = "Amount is required.";
    } else {
        const numericAmount = Number(amount);

        if (!Number.isFinite(numericAmount)) {
            errors.amount = "Amount must be a number.";
        } else if (numericAmount <= 0) {
            errors.amount = "Amount must be greater than zero.";
        } else if (numericAmount > MAX_AMOUNT) {
            errors.amount = "Amount is too large.";
        } else if (hasTooManyDecimals(amount)) {
            errors.amount = "Amount can have at most 2 decimal places.";
        }
    }

    if (!categoryId) {
        errors.category = "Please select a category.";
    } else if (categoryId === "other") {
        const name = (customCategory || "").trim();

        if (!name) {
            errors.category = "Please enter a name for your category.";
        } else if (name.length > 100) {
            errors.category = "Category name must be 100 characters or fewer.";
        }
    }

    if ((description || "").trim().length > 255) {
        errors.description = "Description must be 255 characters or fewer.";
    }

    if (!date) {
        errors.date = "Date is required.";
    } else if (
        !DATE_PATTERN.test(date) ||
        Number.isNaN(new Date(date).getTime())
    ) {
        errors.date = "Please enter a valid date.";
    } else if (date > getTodayString()) {
        errors.date = "Date cannot be in the future.";
    } else if (date < "2000-01-01") {
        errors.date = "Date must be in the year 2000 or later.";
    }

    return errors;
}
