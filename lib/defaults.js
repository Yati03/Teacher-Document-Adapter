export const DEFAULT_SETTINGS = {
  visualProblems: "Background yellow + Black font in size 36 in MS Sans Serif",
  dyslexic: "Comic Sans + Line spaces minimum 1.5 + Capitalize first letter of all words",
  memoryProblems: "If math problem, find the formulas and steps, once found add a formula sheet at the end of the lesson with all of them. If a literary problem, identify key words of the questions and add a distinct color next to the question and relevant paragraph",
  colorBlind: "Replace color by signs next to it"
};

export function passwordIsValid(password) {
  return password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
}
