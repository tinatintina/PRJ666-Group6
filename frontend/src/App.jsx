import { useState } from "react";
import "./App.css";

function App() {
  const [showLogin, setShowLogin] = useState(true);

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>{showLogin ? "Welcome Back" : "Create Account"}</h1>

          <p>
            {showLogin
              ? "Sign in to continue"
              : "Register to create your account"}
          </p>
        </div>

        {showLogin ? (
          <form className="auth-form">
            <div className="form-group">
              <label htmlFor="loginEmail">Email</label>
              <input
                id="loginEmail"
                type="email"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="loginPassword">Password</label>
              <input
                id="loginPassword"
                type="password"
                placeholder="Enter your password"
                required
              />
            </div>

            <button type="submit" className="auth-button">
              Login
            </button>

            <p className="switch-text">
              Don't have an account?{" "}
              <button
                type="button"
                className="switch-button"
                onClick={() => setShowLogin(false)}
              >
                Register
              </button>
            </p>
          </form>
        ) : (
          <form className="auth-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="registerEmail">Email</label>
              <input
                id="registerEmail"
                type="email"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="registerPassword">Password</label>
              <input
                id="registerPassword"
                type="password"
                placeholder="Create a password"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                required
              />
            </div>

            <button type="submit" className="auth-button">
              Register
            </button>

            <p className="switch-text">
              Already have an account?{" "}
              <button
                type="button"
                className="switch-button"
                onClick={() => setShowLogin(true)}
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