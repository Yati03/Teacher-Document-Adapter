"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter(); const [user, setUser] = useState(null);
  useEffect(() => { fetch("/api/me").then(r => r.json()).then(r => setUser(r.user)); }, []);
  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); router.refresh(); }
  return <main className="form-page"><button className="button back" onClick={() => router.push("/home")}>←</button><h1>Account</h1>{user ? <section className="auth-card"><p>Signed in as</p><p className="brand">{user.username}</p><button className="button" onClick={logout}>Log Out</button></section> : <p>Loading account…</p>}</main>;
}
