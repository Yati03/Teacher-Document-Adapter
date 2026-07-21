"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AuthForm({ mode }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const creating = mode === "create";

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);
    const response = await fetch(creating ? "/api/auth/register" : "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(creating ? { username, password, confirmPassword } : { username, password })
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) return setMessage(result.error || "Something went wrong.");
    router.push("/home");
    router.refresh();
  }

  return <main className="auth-shell">
    {creating && <button className="button back" aria-label="Back to login" onClick={() => router.push("/login")}>←</button>}
    <form className="auth-card" onSubmit={submit}>
      <h1 className="brand">Teacher-Document-Adapter</h1>
      <p className="subtitle">{creating ? "Create your teacher account" : "Sign in to manage accessible lessons"}</p>
      <label className="field">Username<input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required /></label>
      <label className="field">Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={creating ? "new-password" : "current-password"} required /></label>
      {creating && <label className="field">Confirm password<input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" required /></label>}
      <p className="message" aria-live="polite">{message}</p>
      <button className="button" disabled={loading}>{loading ? "Please wait…" : creating ? "Create Account" : "Log In"}</button>
      {!creating && <button type="button" className="button" onClick={() => router.push("/account")}>Create Account</button>}
    </form>
  </main>;
}
