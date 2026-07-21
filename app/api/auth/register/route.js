import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createSession, sessionCookie } from "@/lib/auth";
import { getDb } from "@/lib/database";
import { DEFAULT_SETTINGS, passwordIsValid } from "@/lib/defaults";

export async function POST(request) {
  const { username = "", password = "", confirmPassword = "" } = await request.json();
  const normalized = username.trim().toLowerCase();
  if (!normalized) return NextResponse.json({ error: "Username is required." }, { status: 400 });
  const db = await getDb();
  if (await db.collection("users").findOne({ username: normalized })) return NextResponse.json({ error: "Username is already in the database." }, { status: 409 });
  if (!passwordIsValid(password)) return NextResponse.json({ error: "Password needs at least 8 characters, 1 special character, 1 number and 1 capital letter." }, { status: 400 });
  if (password !== confirmPassword) return NextResponse.json({ error: "Passwords are different make sure they match." }, { status: 400 });
  const result = await db.collection("users").insertOne({ username: normalized, passwordHash: await bcrypt.hash(password, 12), settings: DEFAULT_SETTINGS, createdAt: new Date() });
  const response = NextResponse.json({ ok: true });
  const session = await createSession(result.insertedId.toString(), normalized);
  const cookie = sessionCookie(session);
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
