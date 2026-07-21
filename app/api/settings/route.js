import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/database";
import { DEFAULT_SETTINGS } from "@/lib/defaults";

async function sessionOrError() { const session = await getSession(); return session || null; }
export async function GET() { const session = await sessionOrError(); if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const user = await (await getDb()).collection("users").findOne({ _id: new ObjectId(session.sub) }); return NextResponse.json({ settings: user?.settings || DEFAULT_SETTINGS }); }
export async function PATCH(request) { const session = await sessionOrError(); if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const settings = await request.json(); for (const key of Object.keys(DEFAULT_SETTINGS)) if (typeof settings[key] !== "string") return NextResponse.json({ error: "Each setting must be text." }, { status: 400 }); await (await getDb()).collection("users").updateOne({ _id: new ObjectId(session.sub) }, { $set: { settings, updatedAt: new Date() } }); return NextResponse.json({ ok: true }); }
