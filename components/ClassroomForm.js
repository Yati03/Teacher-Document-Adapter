"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
const labels = { total: "Number of Students", visualProblems: "Students with Visual Problems", dyslexia: "Students with Dyslexia", memoryProblems: "Students with Memory Problems", colorBlindness: "Students with Color Blindness" };
const blank = { name: "", students: { total: 0, visualProblems: 0, dyslexia: 0, memoryProblems: 0, colorBlindness: 0 } };
export default function ClassroomForm() {
  const router = useRouter(), search = useSearchParams(), id = search.get("id");
  const [data, setData] = useState(blank), [message, setMessage] = useState(""), [loading, setLoading] = useState(Boolean(id));
  useEffect(() => { if (!id) return; fetch(`/api/classrooms/${id}`).then(r => r.json()).then(r => { if (r.classroom) setData({ name: r.classroom.name, students: r.classroom.students }); else setMessage("Classroom not found."); setLoading(false); }); }, [id]);
  function update(field, value) { setData(current => field === "name" ? { ...current, name: value } : { ...current, students: { ...current.students, [field]: value } }); }
  async function submit(event) { event.preventDefault(); setLoading(true); setMessage(""); const response = await fetch(id ? `/api/classrooms/${id}` : "/api/classrooms", { method: id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); const result = await response.json(); setLoading(false); if (!response.ok) return setMessage(result.error || "Unable to save classroom."); router.push("/home"); router.refresh(); }
  return <main className="form-page"><button className="button back" onClick={() => router.push("/home")}>←</button><h1>{id ? "Classroom Settings" : "Add Classroom"}</h1><form className="class-form" onSubmit={submit}><label className="field">Class Name<input value={data.name} onChange={e => update("name", e.target.value)} required /></label>{Object.entries(labels).map(([field, label]) => <label className="field" key={field}>{label}<input type="number" min="0" step="1" value={data.students[field]} onChange={e => update(field, e.target.value)} required /></label>)}<p className="message">{message}</p><div className="form-actions"><button className="button" disabled={loading}>{loading ? "Saving…" : "Save"}</button></div></form></main>;
}
