import { Agent, codeInterpreterTool, run } from "@openai/agents";
import OpenAI, { toFile } from "openai";

const model = process.env.OPENAI_MODEL || "gpt-5.6-terra";

const documentAdaptationAgent = new Agent({
  name: "Teacher Document Adaptation Agent",
  model,
  tools: [codeInterpreterTool({ includeOutputs: true })],
  instructions: `You create accessible, individualized teaching-material variants.
Always use Code Interpreter to inspect the supplied lesson and create exactly one ZIP archive.
The ZIP must include an unmodified copy of the original lesson in an "original" folder and one adapted lesson for each requested accommodation category in an "adapted" folder. Do not create a separate file for every student; create one reusable version per requested category.
Preserve the source lesson's file format whenever practical. When an exact edit is not technically possible, create the clearest faithful accessible equivalent and explain that limitation in a short README.txt inside the ZIP.
Use descriptive filenames. Apply only the requested accommodations and if the accomodations break the format, such as page overflow or layout issues adapt the accomodation to best fit the available space(IE: smaller font than requested). Do not invent student names or sensitive personal information.
Your final response must contain a link to the ZIP file and no other downloaded files.`,
});

function activeAccommodations(students, settings) {
  const mappings = [
    ["visualProblems", "Visual problems", "visualProblems"],
    ["dyslexia", "Dyslexia", "dyslexic"],
    ["memoryProblems", "Memory problems", "memoryProblems"],
    ["colorBlindness", "Color blindness", "colorBlind"],
  ];

  return mappings
    .filter(([studentKey]) => Number(students?.[studentKey] || 0) > 0)
    .map(([studentKey, label, settingKey]) => ({
      label,
      studentCount: Number(students[studentKey]),
      instructions: settings?.[settingKey] || "Apply the relevant accessibility adjustment.",
    }));
}

function findZipCitation(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return null;
  seen.add(value);

  if (
    value.type === "container_file_citation" &&
    typeof value.file_id === "string" &&
    typeof value.container_id === "string" &&
    /\.zip$/i.test(value.filename || "")
  ) {
    return { fileId: value.file_id, containerId: value.container_id, filename: value.filename };
  }

  for (const child of Array.isArray(value) ? value : Object.values(value)) {
    const match = findZipCitation(child, seen);
    if (match) return match;
  }
  return null;
}

function buildTask({ filename, students, settings }) {
  const accommodations = activeAccommodations(students, settings);
  const adaptationList = accommodations.length
    ? accommodations.map(({ label, studentCount, instructions }) => `- ${label} (${studentCount} student${studentCount === 1 ? "" : "s"}): ${instructions}`).join("\n")
    : "- No accommodation category has a positive student count. Include only the original lesson and a README explaining that no adaptation was requested.";

  return `Adapt the attached lesson "${filename}" for this classroom. Create a ZIP named after the lesson with "-adapted.zip" appended.\n\nClassroom accommodation requests:\n${adaptationList}\n\nPut the untouched uploaded file in original/. Put one adapted lesson per requested category in adapted/. Include README.txt that lists the supplied accommodation instructions and the files created. Do not include anything other than this single ZIP in your final answer.`;
}

export async function adaptLessonWithAgent({ bytes, filename, mimeType, students, settings }) {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set.");

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  let inputFile;
  let generatedZip;

  try {
    inputFile = await client.files.create({
      file: await toFile(bytes, filename, { type: mimeType || "application/octet-stream" }),
      purpose: "user_data",
    });

    const result = await run(documentAdaptationAgent, [{
      role: "user",
      content: [
        { type: "input_text", text: buildTask({ filename, students, settings }) },
        { type: "input_file", file: { id: inputFile.id } },
      ],
    }]);

    generatedZip = findZipCitation(result.rawResponses);
    if (!generatedZip) throw new Error("The document agent did not return a ZIP archive.");

    const download = await client.containers.files.content.retrieve(generatedZip.fileId, { container_id: generatedZip.containerId });
    const adaptedBytes = Buffer.from(await download.arrayBuffer());
    if (!adaptedBytes.length) throw new Error("The document agent returned an empty ZIP archive.");

    return {
      bytes: adaptedBytes,
      filename: generatedZip.filename || `${filename.replace(/\.[^.]+$/, "")}-adapted.zip`,
      responseId: result.lastResponseId,
      summary: typeof result.finalOutput === "string" ? result.finalOutput : "Adapted ZIP created.",
    };
  } finally {
    await Promise.allSettled([
      inputFile ? client.files.delete(inputFile.id) : Promise.resolve(),
      generatedZip ? client.containers.files.delete(generatedZip.fileId, { container_id: generatedZip.containerId }) : Promise.resolve(),
    ]);
  }
}
