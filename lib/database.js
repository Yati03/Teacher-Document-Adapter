import { GridFSBucket, MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "teacher-document-adapter";

if (!uri) throw new Error("MONGODB_URI is not set. Add it to .env.local.");

let client;
let clientPromise;
if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export async function getDb() { return (await clientPromise).db(dbName); }
export async function getLessonBucket() { return new GridFSBucket(await getDb(), { bucketName: "lessonFiles" }); }
