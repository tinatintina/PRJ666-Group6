import { useState } from "react";
import TransactionsPage from "./components/TransactionsPage";
import AddTransactionPage from "./components/AddTransactionPage";
import BottomNav from "./components/BottomNav";
import BudgetPage from "./components/BudgetPage";
import DashboardPage from "./components/DashboardPage";
import ProfilePage from "./components/ProfilePage";
import ReportsPage from "./components/ReportsPage";
import "./App.css";
import {
  hasErrors,
  validateLogin,
  validateRegister,
} from "./utils/validation";

function App() {
  const [showLogin, setShowLogin] =
    useState(true);

  const [
    currentPage,
    setCurrentPage,
  ] = useState("authentication");

  const [
    currentUser,
    setCurrentUser,
  ] = useState(null);

  const [
    authLoading,
    setAuthLoading,
  ] = useState(false);

  // Field-level errors for the login / register forms
  const [
    authErrors,
    setAuthErrors,
  ] = useState({});

  // Error or success message returned by the server
  const [
    authMessage,
    setAuthMessage,
  ] = useState(null);

  function switchAuthForm(toLogin) {
    setShowLogin(toLogin);
    setAuthErrors({});
    setAuthMessage(null);
  }

  // Remove a field's error as soon as the user edits it
  function clearAuthError(event) {
    const field =
      event.target.name;

    if (authErrors[field]) {
      setAuthErrors((current) => {
        const next = {
          ...current,
        };

        delete next[field];
        return next;
      });
    }
  }

  // Props for an auth input that may have an error
  function authErrorProps(field) {
    return authErrors[field]
      ? {
        "aria-invalid": true,
        "aria-describedby": `${field}-error`,
        className: "input-error",
      }
      : {};
  }

  function renderAuthError(field) {
    return authErrors[field] ? (
      <p
        id={`${field}-error`}
        className="field-error"
        role="alert"
      >
        {authErrors[field]}
      </p>
    ) : null;
  }

  async function handleLogin(event) {
    event.preventDefault();

    const form =
      event.currentTarget;

    const formData =
      new FormData(form);

    const email =
      formData
        .get("email")
        .trim();

    const password =
      formData.get("password");

    const validationErrors =
      validateLogin({
        email,
        password,
      });

    setAuthErrors(
      validationErrors
    );

    setAuthMessage(null);

    if (
      hasErrors(
        validationErrors
      )
    ) {
      return;
    }

    try {
      setAuthLoading(true);

      const response =
        await fetch(
          "/api/auth/login",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              email,
              password,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Could not log in."
        );
      }

      setCurrentUser(
        data.user
      );

      setCurrentPage(
        "transactions"
      );
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      setAuthMessage({
        type: "error",
        text: error.message,
      });
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleRegister(
    event
  ) {
    event.preventDefault();

    const form =
      event.currentTarget;

    const formData =
      new FormData(form);

    const fullName =
      formData
        .get("fullName")
        .trim();

    const email =
      formData
        .get("email")
        .trim();

    const password =
      formData.get("password");

    const confirmPassword =
      formData.get(
        "confirmPassword"
      );

    const validationErrors =
      validateRegister({
        fullName,
        email,
        password,
        confirmPassword,
      });

    setAuthErrors(
      validationErrors
    );

    setAuthMessage(null);

    if (
      hasErrors(
        validationErrors
      )
    ) {
      return;
    }

    const nameParts =
      fullName
        .split(/\s+/)
        .filter(Boolean);

    const firstName =
      nameParts[0];

    const lastName =
      nameParts
        .slice(1)
        .join(" ");

    try {
      setAuthLoading(true);

      const response =
        await fetch(
          "/api/auth/register",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              firstName,
              lastName,
              email,
              password,
              confirmPassword,
              preferredCurrency:
                "CAD",
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Could not create account."
        );
      }

      form.reset();

      switchAuthForm(true);

      setAuthMessage({
        type: "success",
        text: "Account created successfully. Please log in.",
      });
    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      setAuthMessage({
        type: "error",
        text: error.message,
      });
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    setCurrentUser(null);
    setCurrentPage("authentication");
    switchAuthForm(true);
  }

  // Saves a transaction. Throws an Error on failure so
  // AddTransactionPage can show the message on the form.
  async function handleSaveTransaction(
    transaction
  ) {
    if (!currentUser) {
      setCurrentPage(
        "authentication"
      );

      throw new Error(
        "Please log in again."
      );
    }

    // When "Other" is chosen, send customCategory and no
    // categoryId. The transaction API reuses the user's
    // existing category with that name or creates it, so
    // the same custom category can be used more than once.
    const response =
      await fetch(
        "/api/transactions",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            userId:
              currentUser.userId,

            categoryId:
              transaction.customCategory
                ? null
                : transaction.categoryId,

            customCategory:
              transaction.customCategory ||
              undefined,

            amount:
              transaction.amount,

            currency:
              currentUser.preferredCurrency ||
              "CAD",

            transactionDate:
              transaction.date,

            transactionType:
              transaction.type ===
                "income"
                ? "Income"
                : "Expense",

            description:
              transaction.description,
          }),
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
        "Could not save transaction."
      );
    }

    setCurrentPage(
      "transactions"
    );
  }

  if (
    currentPage ===
    "add-transaction"
  ) {
    return (
      <AddTransactionPage
        userId={
          currentUser?.userId
        }
        onSave={
          handleSaveTransaction
        }
        onCancel={() =>
          setCurrentPage(
            "transactions"
          )
        }
      />
    );
  }

  if (
    currentPage === "home"
  ) {
    return (
      <>
        <DashboardPage
          userId={
            currentUser?.userId
          }
          firstName={
            currentUser?.firstName
          }
          onNavigate={
            setCurrentPage
          }
        />

        <BottomNav
          currentPage={
            currentPage
          }
          onNavigate={
            setCurrentPage
          }
        />
      </>
    );
  }

  if (
    currentPage ===
    "transactions"
  ) {
    return (
      <>
        <TransactionsPage
          userId={
            currentUser?.userId
          }
          onAddTransaction={() =>
            setCurrentPage(
              "add-transaction"
            )
          }
        />

        <BottomNav
          currentPage={
            currentPage
          }
          onNavigate={
            setCurrentPage
          }
        />
      </>
    );
  }

  if (
    currentPage === "budget"
  ) {
    return (
      <>
        <BudgetPage
          userId={
            currentUser?.userId
          }
        />

        <BottomNav
          currentPage={
            currentPage
          }
          onNavigate={
            setCurrentPage
          }
        />
      </>
    );
  }

  if (currentPage === "reports") {
    return (
      <>
        <ReportsPage
          userId={currentUser?.userId}
        />

        <BottomNav
          currentPage={currentPage}
          onNavigate={setCurrentPage}
        />
      </>
    );
  }

  if (currentPage === "profile") {
    return (
      <>
        <ProfilePage
          userId={currentUser?.userId}
          onUserUpdated={setCurrentUser}
          onLogout={handleLogout}
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

          <span>
            SMART SPEND
          </span>
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

        {authMessage && (
          <p
            className={
              authMessage.type ===
                "success"
                ? "auth-message auth-message-success"
                : "auth-message auth-message-error"
            }
            role={
              authMessage.type ===
                "success"
                ? "status"
                : "alert"
            }
          >
            {authMessage.text}
          </p>
        )}

        {showLogin ? (
          <form
            className="auth-form"
            onSubmit={
              handleLogin
            }
            onChange={
              clearAuthError
            }
            noValidate
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
                autoComplete="email"
                required
                {...authErrorProps("email")}
              />

              {renderAuthError("email")}
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
                autoComplete="current-password"
                required
                {...authErrorProps("password")}
              />

              {renderAuthError("password")}
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
              disabled={
                authLoading
              }
            >
              {authLoading
                ? "Logging in..."
                : "Login"}
            </button>

            <p className="switch-text">
              Don&apos;t have an
              account?{" "}

              <button
                type="button"
                className="switch-button"
                onClick={() =>
                  switchAuthForm(
                    false
                  )
                }
              >
                Register
              </button>
            </p>
          </form>
        ) : (
          <form
            className="auth-form"
            onSubmit={
              handleRegister
            }
            onChange={
              clearAuthError
            }
            noValidate
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
                autoComplete="name"
                maxLength="101"
                required
                {...authErrorProps("fullName")}
              />

              {renderAuthError("fullName")}
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
                autoComplete="email"
                maxLength="100"
                required
                {...authErrorProps("email")}
              />

              {renderAuthError("email")}
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
                autoComplete="new-password"
                required
                {...authErrorProps("password")}
              />

              {renderAuthError("password") || (
                <p className="field-hint">
                  At least 8 characters, with a letter and a number.
                </p>
              )}
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
                autoComplete="new-password"
                required
                {...authErrorProps("confirmPassword")}
              />

              {renderAuthError("confirmPassword")}
            </div>

            <button
              type="submit"
              className="auth-button"
              disabled={
                authLoading
              }
            >
              {authLoading
                ? "Creating account..."
                : "Register"}
            </button>

            <p className="switch-text">
              Already have an
              account?{" "}

              <button
                type="button"
                className="switch-button"
                onClick={() =>
                  switchAuthForm(
                    true
                  )
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