export const studentFields = ["total", "visualProblems", "dyslexia", "memoryProblems", "colorBlindness"];
export function normalizeClassroom(input) {
  const name = String(input.name || "").trim();
  if (!name) return { error: "Class Name needs to be a non-null string." };
  const students = {};
  for (const field of studentFields) {
    const raw = input.students?.[field] ?? 0;
    const value = raw === "" || raw === null ? 0 : Number(raw);
    if (!Number.isInteger(value) || value < 0) return { error: "All student values must be positive whole numbers or 0." };
    students[field] = value;
  }
  for (const field of studentFields.slice(1)) if (students[field] > students.total) return { error: "Students requiring an adjustment cannot exceed Number of Students." };
  return { value: { name, students } };
}
