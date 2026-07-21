"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
const labels = { visualProblems: "Visual Problems", dyslexic: "Dyslexic", memoryProblems: "Memory Problems", colorBlind: "Color Blind" };
export default function SettingsForm() {
  const router = useRouter(); const [settings, setSettings] = useState(null); const [message, setMessage] = useState("");
  useEffect(() => { fetch("/api/settings").then(r => r.json()).then(r => setSettings(r.settings)); }, []);
  async function save(event) { event.preventDefault(); const response = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) }); const result = await response.json(); if (!response.ok) return setMessage(result.error || "Unable to save settings."); router.push("/home"); router.refresh(); }
  if (!settings) return <main className="form-page">Loading settings…</main>;
  return <main className="form-page"><button className="button back" onClick={() => router.push("/home")}>←</button><h1>Settings</h1><form className="settings-form" onSubmit={save}>{Object.entries(labels).map(([key, label]) => <label className="field" key={key}>{label}<textarea value={settings[key]} onChange={e => setSettings({ ...settings, [key]: e.target.value })} required /></label>)}<p className="message">{message}</p><div className="form-actions"><button className="button">Save</button></div></form></main>;
}
