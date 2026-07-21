import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createSession, sessionCookie } from "@/lib/auth";
import { getDb } from "@/lib/database";

export async function POST(request) {
  const { username = "", password = "" } = await request.json();
  const user = await (await getDb()).collection("users").findOne({ username: username.trim().toLowerCase() });
  if (!user) return NextResponse.json({ error: "Wrong username." }, { status: 401 });
  if (!(await bcrypt.compare(password, user.passwordHash))) return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  const cookie = sessionCookie(await createSession(user._id.toString(), user.username));
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
