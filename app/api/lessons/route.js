import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb, getLessonBucket } from "@/lib/database";
import { DEFAULT_SETTINGS } from "@/lib/defaults";
import { adaptLessonWithAgent } from "@/lib/documentAgent";

export const runtime = "nodejs";

function objectId(value) { try { return new ObjectId(value); } catch { return null; } }
export async function GET(request) {
  const session = await getSession(); const classroomId = objectId(new URL(request.url).searchParams.get("classroomId"));
  if (!session || !classroomId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const lessons = await (await getDb()).collection("lessons").find({ classroomId, userId: new ObjectId(session.sub) }).sort({ createdAt: -1 }).toArray();
  return NextResponse.json({ lessons });
}

export async function POST(request) {
  const session = await getSession(); if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await request.formData(); const classroomId = objectId(form.get("classroomId")); const file = form.get("file");
  if (!classroomId || !(file instanceof File)) return NextResponse.json({ error: "Choose a classroom and a lesson file." }, { status: 400 });
  const db = await getDb(); const userId = new ObjectId(session.sub);
  const classroom = await db.collection("classrooms").findOne({ _id: classroomId, userId });
  if (!classroom) return NextResponse.json({ error: "Classroom not found." }, { status: 404 });
  if (file.size > 50 * 1024 * 1024) return NextResponse.json({ error: "Lesson files must be 50 MB or smaller." }, { status: 400 });
  const safeName = file.name.replace(/[^a-zA-Z0-9._ -]/g, "_");
  if (!safeName) return NextResponse.json({ error: "The lesson must have a file name." }, { status: 400 });
  const bucket = await getLessonBucket();
  const upload = bucket.openUploadStream(safeName, { metadata: { userId, classroomId, kind: "original", mimeType: file.type || "application/octet-stream" } });
  const bytes = Buffer.from(await file.arrayBuffer());
  await new Promise((resolve, reject) => { upload.once("finish", resolve); upload.once("error", reject); upload.end(bytes); });
  const now = new Date();
  const result = await db.collection("lessons").insertOne({ userId, classroomId, name: safeName, originalFileId: upload.id, status: "processing", createdAt: now, updatedAt: now });
  const lessonId = result.insertedId;

  try {
    const user = await db.collection("users").findOne({ _id: userId }, { projection: { settings: 1 } });
    const adapted = await adaptLessonWithAgent({
      bytes,
      filename: safeName,
      mimeType: file.type,
      students: classroom.students,
      settings: { ...DEFAULT_SETTINGS, ...(user?.settings || {}) },
    });
    const adaptedUpload = bucket.openUploadStream(adapted.filename, {
      metadata: { userId, classroomId, lessonId, kind: "adapted", mimeType: "application/zip" },
    });
    await new Promise((resolve, reject) => { adaptedUpload.once("finish", resolve); adaptedUpload.once("error", reject); adaptedUpload.end(adapted.bytes); });
    await db.collection("lessons").updateOne({ _id: lessonId, userId }, {
      $set: { adaptedFileId: adaptedUpload.id, status: "ready", agentResponseId: adapted.responseId, updatedAt: new Date() },
      $unset: { error: "" },
    });
    return NextResponse.json({ lesson: { _id: lessonId, name: safeName, status: "ready" }, message: "Adapted ZIP is ready to download." }, { status: 201 });
  } catch (error) {
    console.error("Lesson adaptation failed", error);
    await db.collection("lessons").updateOne({ _id: lessonId, userId }, {
      $set: { status: "failed", error: "The lesson could not be adapted. Check the file and try again.", updatedAt: new Date() },
    });
    return NextResponse.json({ error: "The lesson was stored but could not be adapted. Please try again." }, { status: 502 });
  }
}
