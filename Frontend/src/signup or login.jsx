import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Orbit, Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import "./signup or login.css";

export default function SignupOrLogin() {
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [phase, setPhase] = useState("idle"); // 'idle' | 'start' | 'cover' | 'exit'
  const [dir, setDir] = useState(1); // 1 (to signup) | -1 (to login)
  const [busy, setBusy] = useState(false);

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Form input states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginRemember, setLoginRemember] = useState(false);

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  // Transition state machine
  const triggerTransition = (targetMode) => {
    if (busy || mode === targetMode) return;
    setBusy(true);
    setDir(targetMode === "signup" ? 1 : -1);
    setPhase("start");
  };

  useEffect(() => {
    if (phase === "start") {
      // Small frame tick to ensure Framer Motion registers the start variant first
      const raf = requestAnimationFrame(() => {
        setPhase("cover");
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [phase]);

  const handleAnimationComplete = () => {
    if (phase === "cover") {
      // Toggle mode underneath the covered blade
      setMode(mode === "login" ? "signup" : "login");
      setPhase("exit");
    } else if (phase === "exit") {
      setPhase("idle");
      setBusy(false);
    }
  };

  // Blade animation variants
  const bladeVariants = {
    start: (d) => ({
      x: d === 1 ? "130%" : "-130%",
    }),
    cover: {
      x: "0%",
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1], // standard ease-in-out
      },
    },
    exit: (d) => ({
      x: d === 1 ? "-130%" : "130%",
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
      },
    }),
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (mode === "login") {
      console.log("Logging in with:", { loginEmail, loginPassword, loginRemember });
    } else {
      console.log("Signing up with:", { signupName, signupEmail, signupPassword });
    }
  };

  return (
    <div className="auth-page-wrapper font-sans antialiased">
      <div className="auth-card-container">
        
        {/* SWEEPING TRANSITION BLADE */}
        {phase !== "idle" && (
          <motion.div
            className="transition-blade"
            custom={dir}
            initial="start"
            animate={phase}
            variants={bladeVariants}
            onAnimationComplete={handleAnimationComplete}
          />
        )}

        {/* LEFT PANEL */}
        <div
          className={`panel panel-left ${
            mode === "login" ? "panel-cream" : "panel-dark"
          }`}
        >
          <div className="panel-content">
            {mode === "login" ? (
              /* Login Form on Left */
              <form onSubmit={handleFormSubmit} className="form-panel-content">
                <div className="form-header">
                  <h2 className="form-title tracking-tight">Sign in</h2>
                </div>

                <div className="form-fields-container">
                  <div className="auth-input-group">
                    <label className="auth-label">Username or email</label>
                    <div className="auth-input-wrapper">
                      <Mail size={16} className="auth-input-icon" />
                      <input
                        type="text"
                        className="auth-input auth-input-with-icon"
                        placeholder="name@domain.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        disabled={busy}
                      />
                    </div>
                  </div>

                  <div className="auth-input-group">
                    <label className="auth-label">Password</label>
                    <div className="auth-input-wrapper">
                      <Lock size={16} className="auth-input-icon" />
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        className="auth-input auth-input-with-icon auth-input-with-toggle"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        disabled={busy}
                      />
                      <button
                        type="button"
                        className="auth-password-toggle"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        disabled={busy}
                      >
                        {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="auth-options-row">
                    <label className="auth-checkbox-label">
                      <input
                        type="checkbox"
                        className="auth-checkbox"
                        checked={loginRemember}
                        onChange={(e) => setLoginRemember(e.target.checked)}
                        disabled={busy}
                      />
                      <span>Keep me signed in</span>
                    </label>
                    <a
                      href="#forgot"
                      className="auth-link text-xs transition-colors"
                      onClick={(e) => e.preventDefault()}
                    >
                      Forgot password?
                    </a>
                  </div>
                </div>

                <div className="auth-action-row">
                  <button
                    type="submit"
                    className="auth-btn-primary shadow-sm active:scale-98 transition-all duration-150"
                    disabled={busy}
                  >
                    Sign in
                  </button>
                  <p className="auth-switch-text">
                    New here?
                    <button
                      type="button"
                      className="auth-switch-link"
                      onClick={(e) => {
                        e.preventDefault();
                        triggerTransition("signup");
                      }}
                      disabled={busy}
                    >
                      Create account
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              /* Brand Panel on Left (Signup mode) */
              <div className="brand-panel-content">
                <div className="brand-logo-section">
                  <Orbit className="brand-logo-icon" size={24} />
                  <span className="brand-logo-text">ORBIT</span>
                </div>

                <div className="brand-text-section">
                  <h1 className="brand-heading font-serif">
                    Start the <span className="brand-highlight italic font-light">first</span> page.
                  </h1>
                  <p className="brand-subtext">
                    One account for every board, every draft, and every solved problem.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Gentle floating dots outside safe zone so they can cover full background */}
          {mode === "signup" && (
            <div className="floating-dots">
              <div className="dot dot-1" />
              <div className="dot dot-2" />
              <div className="dot dot-3" />
              <div className="dot dot-4" />
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div
          className={`panel panel-right ${
            mode === "login" ? "panel-dark" : "panel-cream"
          }`}
        >
          <div className="panel-content">
            {mode === "login" ? (
              /* Brand Panel on Right (Login mode) */
              <div className="brand-panel-content">
                <div className="brand-logo-section">
                  <Orbit className="brand-logo-icon" size={24} />
                  <span className="brand-logo-text">ORBIT</span>
                </div>

                <div className="brand-text-section">
                  <h1 className="brand-heading font-serif">
                    Welcome <span className="brand-highlight italic font-light">back</span>.
                  </h1>
                  <p className="brand-subtext">
                    Your brands, your drafts, and your projects all exactly where you left them.
                  </p>
                </div>
              </div>
            ) : (
              /* Signup Form on Right */
              <form onSubmit={handleFormSubmit} className="form-panel-content">
                <div className="form-header">
                  <h2 className="form-title tracking-tight">Create account</h2>
                </div>

                <div className="form-fields-container">
                  <div className="auth-input-group">
                    <label className="auth-label">Full name</label>
                    <div className="auth-input-wrapper">
                      <User size={16} className="auth-input-icon" />
                      <input
                        type="text"
                        className="auth-input auth-input-with-icon"
                        placeholder="Jane Doe"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        required
                        disabled={busy}
                      />
                    </div>
                  </div>

                  <div className="auth-input-group">
                    <label className="auth-label">Email Address</label>
                    <div className="auth-input-wrapper">
                      <Mail size={16} className="auth-input-icon" />
                      <input
                        type="email"
                        className="auth-input auth-input-with-icon"
                        placeholder="name@domain.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                        disabled={busy}
                      />
                    </div>
                  </div>

                  <div className="auth-input-group">
                    <label className="auth-label">Password</label>
                    <div className="auth-input-wrapper">
                      <Lock size={16} className="auth-input-icon" />
                      <input
                        type={showSignupPassword ? "text" : "password"}
                        className="auth-input auth-input-with-icon auth-input-with-toggle"
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                        disabled={busy}
                      />
                      <button
                        type="button"
                        className="auth-password-toggle"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        disabled={busy}
                      >
                        {showSignupPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <span className="auth-input-hint">Use 8 characters or more.</span>
                  </div>
                </div>

                <div className="auth-action-row">
                  <button
                    type="submit"
                    className="auth-btn-primary shadow-sm active:scale-98 transition-all duration-150"
                    disabled={busy}
                  >
                    Create account
                  </button>
                  <p className="auth-switch-text">
                    Already have an account?
                    <button
                      type="button"
                      className="auth-switch-link"
                      onClick={(e) => {
                        e.preventDefault();
                        triggerTransition("login");
                      }}
                      disabled={busy}
                    >
                      Sign in
                    </button>
                  </p>
                </div>
              </form>
            )}
          </div>

          {/* Gentle floating dots outside safe zone so they can cover full background */}
          {mode === "login" && (
            <div className="floating-dots">
              <div className="dot dot-1" />
              <div className="dot dot-2" />
              <div className="dot dot-3" />
              <div className="dot dot-4" />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
