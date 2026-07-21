import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/database";
export async function GET() { const session = await getSession(); if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const user = await (await getDb()).collection("users").findOne({ _id: new ObjectId(session.sub) }, { projection: { passwordHash: 0 } }); return NextResponse.json({ user }); }
