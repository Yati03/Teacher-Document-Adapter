import { ObjectId } from "mongodb";
import { Readable } from "stream";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb, getLessonBucket } from "@/lib/database";

export async function GET(_request, { params }) {
  const session = await getSession(); const { id } = await params;
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let lessonId; try { lessonId = new ObjectId(id); } catch { return NextResponse.json({ error: "Not found" }, { status: 404 }); }
  const lesson = await (await getDb()).collection("lessons").findOne({ _id: lessonId, userId: new ObjectId(session.sub) });
  if (!lesson?.adaptedFileId) return NextResponse.json({ error: "The adapted ZIP file is not ready yet." }, { status: 409 });
  const stream = (await getLessonBucket()).openDownloadStream(lesson.adaptedFileId);
  return new Response(Readable.toWeb(stream), { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${lesson.name.replace(/\.[^.]+$/, "")}-adapted.zip"` } });
}
