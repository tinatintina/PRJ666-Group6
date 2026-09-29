import { useState } from "react";
import TransactionsPage from "./components/TransactionsPage";
import AddTransactionPage from "./components/AddTransactionPage";
import "./App.css";

function App() {
  const [showLogin, setShowLogin] = useState(true);
  const [currentPage, setCurrentPage] = useState("authentication");

  function handleLogin(event) {
    event.preventDefault();

    // Temporary frontend navigation.
    // Later, this will happen after successful API authentication.
    setCurrentPage("transactions");
  }

  function handleRegister(event) {
    event.preventDefault();

    // Registration API can be connected here later.
    setShowLogin(true);
  }

  async function handleSaveTransaction(transaction) {
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: 1,
          categoryId: transaction.categoryId,
          amount: transaction.amount,
          currency: "CAD",
          transactionDate: transaction.date,
          transactionType:
            transaction.type === "income" ? "Income" : "Expense",
          description: transaction.description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not save transaction."
        );
      }

      console.log("Transaction saved:", data);
      setCurrentPage("transactions");
    } catch (error) {
      console.error("Save transaction error:", error);
      alert(error.message);
    }
  }

  if (currentPage === "transactions") {
    return (
      <TransactionsPage
        onAddTransaction={() =>
          setCurrentPage("add-transaction")
        }
      />
    );
  }

  if (currentPage === "add-transaction") {
    return (
      <AddTransactionPage
        onSave={handleSaveTransaction}
        onCancel={() =>
          setCurrentPage("transactions")
        }
      />
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-brand">
          <span className="auth-logo">$</span>
          <span>SMART SPEND</span>
        </div>

        <div className="auth-header">
          <h1>
            {showLogin ? "Welcome Back" : "Create Account"}
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
            >
              Login
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
                type="password"
                placeholder="Confirm your password"
                minLength="8"
                required
              />
            </div>

            <button
              type="submit"
              className="auth-button"
            >
              Register
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