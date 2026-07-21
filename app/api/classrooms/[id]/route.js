import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/database";
import { normalizeClassroom } from "@/lib/classroom";
function asId(id) { try { return new ObjectId(id); } catch { return null; } }
export async function GET(_request, { params }) { const session = await getSession(); const { id } = await params; const classroomId = asId(id); if (!session || !classroomId) return NextResponse.json({ error: "Not found" }, { status: 404 }); const classroom = await (await getDb()).collection("classrooms").findOne({ _id: classroomId, userId: new ObjectId(session.sub) }); return classroom ? NextResponse.json({ classroom }) : NextResponse.json({ error: "Not found" }, { status: 404 }); }
export async function PATCH(request, { params }) { const session = await getSession(); const { id } = await params; const classroomId = asId(id); if (!session || !classroomId) return NextResponse.json({ error: "Not found" }, { status: 404 }); const normalized = normalizeClassroom(await request.json()); if (normalized.error) return NextResponse.json({ error: normalized.error }, { status: 400 }); const result = await (await getDb()).collection("classrooms").updateOne({ _id: classroomId, userId: new ObjectId(session.sub) }, { $set: { ...normalized.value, updatedAt: new Date() } }); return result.matchedCount ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Not found" }, { status: 404 }); }
