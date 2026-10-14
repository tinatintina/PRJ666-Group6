import { useState } from "react";
import TransactionsPage from "./components/TransactionsPage";
import AddTransactionPage from "./components/AddTransactionPage";
import BottomNav from "./components/BottomNav";
import BudgetPage from "./components/BudgetPage";
import "./App.css";

function App() {
  const [showLogin, setShowLogin] = useState(true);
  const [currentPage, setCurrentPage] = useState("authentication");
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const email = formData.get("email").trim();
    const password = formData.get("password");

    try {
      setAuthLoading(true);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not log in."
        );
      }

      setCurrentUser(data.user);
      setCurrentPage("transactions");
    } catch (error) {
      console.error("Login error:", error);
      alert(error.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const fullName = formData.get("fullName").trim();
    const email = formData.get("email").trim();
    const password = formData.get("password");
    const confirmPassword =
      formData.get("confirmPassword");

    const nameParts = fullName
      .split(/\s+/)
      .filter(Boolean);

    if (nameParts.length < 2) {
      alert("Please enter your first and last name.");
      return;
    }

    const firstName = nameParts[0];

    const lastName = nameParts
      .slice(1)
      .join(" ");

    try {
      setAuthLoading(true);

      const response = await fetch(
        "/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstName,
            lastName,
            email,
            password,
            confirmPassword,
            preferredCurrency: "CAD",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not create account."
        );
      }

      alert(
        "Account created successfully. Please log in."
      );

      form.reset();
      setShowLogin(true);
    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      alert(error.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSaveTransaction(
    transaction
  ) {
    if (!currentUser) {
      alert("Please log in again.");
      setCurrentPage("authentication");
      return;
    }

    try {
      let categoryId =
        transaction.categoryId;

      if (transaction.customCategory) {
        const categoryResponse =
          await fetch("/api/categories", {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              userId: currentUser.userId,
              categoryName:
                transaction.customCategory,
              categoryType:
                transaction.type === "income"
                  ? "Income"
                  : "Expense",
            }),
          });

        const categoryData =
          await categoryResponse.json();

        if (!categoryResponse.ok) {
          throw new Error(
            categoryData.message ||
              "Could not create category."
          );
        }

        categoryId =
          categoryData.category
            ?.category_id ||
          categoryData.categoryId;
      }

      const response = await fetch(
        "/api/transactions",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            userId: currentUser.userId,
            categoryId,
            amount: transaction.amount,
            currency:
              currentUser.preferredCurrency ||
              "CAD",
            transactionDate:
              transaction.date,
            transactionType:
              transaction.type === "income"
                ? "Income"
                : "Expense",
            description:
              transaction.description,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not save transaction."
        );
      }

      console.log(
        "Transaction saved:",
        data
      );

      setCurrentPage("transactions");
    } catch (error) {
      console.error(
        "Save transaction error:",
        error
      );

      alert(error.message);
    }
  }

  if (
    currentPage === "add-transaction"
  ) {
    return (
      <AddTransactionPage
        userId={currentUser?.userId}
        onSave={handleSaveTransaction}
        onCancel={() =>
          setCurrentPage("transactions")
        }
      />
    );
  }

  if (currentPage === "transactions") {
    return (
      <>
        <TransactionsPage
          userId={currentUser?.userId}
          onAddTransaction={() =>
            setCurrentPage(
              "add-transaction"
            )
          }
        />

        <BottomNav
          currentPage={currentPage}
          onNavigate={setCurrentPage}
        />
      </>
    );
  }

  if (currentPage === "budget") {
    return (
      <>
        <BudgetPage
          userId={currentUser?.userId}
        />

        <BottomNav
          currentPage={currentPage}
          onNavigate={setCurrentPage}
        />
      </>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-brand">
          <span className="auth-logo">
            $
          </span>

          <span>SMART SPEND</span>
        </div>

        <div className="auth-header">
          <h1>
            {showLogin
              ? "Welcome Back"
              : "Create Account"}
          </h1>

          <p>
            {showLogin
              ? "Sign in to continue managing your finances."
              : "Register to start managing your finances."}
          </p>
        </div>

        {showLogin ? (
          <form
            className="auth-form"
            onSubmit={handleLogin}
          >
            <div className="form-group">
              <label htmlFor="loginEmail">
                Email
              </label>

              <input
                id="loginEmail"
                name="email"
                type="email"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="loginPassword">
                Password
              </label>

              <input
                id="loginPassword"
                name="password"
                type="password"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="button"
              className="forgot-password"
            >
              Forgot Password?
            </button>

            <button
              type="submit"
              className="auth-button"
              disabled={authLoading}
            >
              {authLoading
                ? "Logging in..."
                : "Login"}
            </button>

            <p className="switch-text">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="switch-button"
                onClick={() =>
                  setShowLogin(false)
                }
              >
                Register
              </button>
            </p>
          </form>
        ) : (
          <form
            className="auth-form"
            onSubmit={handleRegister}
          >
            <div className="form-group">
              <label htmlFor="name">
                Full Name
              </label>

              <input
                id="name"
                name="fullName"
                type="text"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="registerEmail">
                Email
              </label>

              <input
                id="registerEmail"
                name="email"
                type="email"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="registerPassword">
                Password
              </label>

              <input
                id="registerPassword"
                name="password"
                type="password"
                placeholder="Create a password"
                minLength="8"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirm Password
              </label>

              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                minLength="8"
                required
              />
            </div>

            <button
              type="submit"
              className="auth-button"
              disabled={authLoading}
            >
              {authLoading
                ? "Creating account..."
                : "Register"}
            </button>

            <p className="switch-text">
              Already have an account?{" "}
              <button
                type="button"
                className="switch-button"
                onClick={() =>
                  setShowLogin(true)
                }
              >
                Login
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default App;