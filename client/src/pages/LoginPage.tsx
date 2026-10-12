import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { usePageTitle } from "../hooks/usePageTitle";

export default function LoginPage() {
  usePageTitle("Sign in");
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate("/settings", { replace: true });
  }, [user, navigate]);

  if (user) return null;

  async function onSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, password, displayName);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <h1>{mode === "login" ? "Sign in" : "Create account"}</h1>
      <p className="auth-sub">
        Sync comments across devices on this server. Library still saves locally
        in your browser.
      </p>

      <div className="chip-row">
        <button
          type="button"
          className={`chip ${mode === "login" ? "chip--on" : ""}`}
          onClick={() => setMode("login")}
        >
          Sign in
        </button>
        <button
          type="button"
          className={`chip ${mode === "register" ? "chip--on" : ""}`}
          onClick={() => setMode("register")}
        >
          Register
        </button>
      </div>

      <form className="auth-form" onSubmit={onSubmit}>
        {mode === "register" ? (
          <label>
            Display name
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Reader name"
            />
          </label>
        ) : null}
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
          />
        </label>
        {error ? <div className="alert">{error}</div> : null}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Register"}
        </button>
      </form>

      <p className="auth-foot">
        <Link to="/">← Back to home</Link>
      </p>
    </div>
  );
}
