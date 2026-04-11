export type JobBoardMeta = {
  name: string;
  pattern: RegExp;
  /** Brand hex for UI badges */
  color: string;
};

export const SUPPORTED_BOARDS: JobBoardMeta[] = [
  { name: "LinkedIn", pattern: /linkedin\.com\/jobs/i, color: "#0077B5" },
  { name: "Indeed", pattern: /indeed\.com\/(viewjob|jobs)/i, color: "#2164F3" },
  { name: "Greenhouse", pattern: /greenhouse\.io\/(jobs?|embed)/i, color: "#3AB549" },
  { name: "Lever", pattern: /jobs\.lever\.co/i, color: "#1A1A1A" },
  { name: "Workday", pattern: /myworkdayjobs\.com/i, color: "#F7941D" },
  {
    name: "Glassdoor",
    pattern: /glassdoor\.com\/(job-listing|job)/i,
    color: "#0CAA41",
  },
  { name: "Wellfound", pattern: /wellfound\.com\/(jobs|l)/i, color: "#FF6154" },
];

export function detectJobBoard(url: string): JobBoardMeta | null {
  return SUPPORTED_BOARDS.find((b) => b.pattern.test(url)) ?? null;
}

export function isValidJobUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    return SUPPORTED_BOARDS.some((b) => b.pattern.test(url));
  } catch {
    return false;
  }
}

export function supportedBoardsHint(): string {
  return SUPPORTED_BOARDS.map((b) => b.name).join(", ");
}
