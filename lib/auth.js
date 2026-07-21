import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "replace-this-before-production");
const cookieName = "tda_session";

export async function createSession(userId, username) {
  return new SignJWT({ username }).setProtectedHeader({ alg: "HS256" }).setSubject(userId).setIssuedAt().setExpirationTime("7d").sign(secret);
}
export async function getSession() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  try { return (await jwtVerify(token, secret)).payload; } catch { return null; }
}
export function sessionCookie(value) {
  return { name: cookieName, value, options: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 } };
}
export function clearSessionCookie() { return { name: cookieName, value: "", options: { httpOnly: true, path: "/", maxAge: 0 } }; }
