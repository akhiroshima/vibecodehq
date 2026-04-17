"use server";

import JSZip from "jszip";

/**
 * Server-side text extraction from arbitrary admin uploads.
 * Supports:
 *  - Plain text / markdown / code / html / json / csv / yaml / xml
 *  - PDF (via unpdf)
 *  - DOCX (via mammoth)
 *  - ZIP archives — recursively extracts supported entries
 *
 * Unsupported binary formats (images, spreadsheets, slides, videos) are
 * skipped with a note so the AI prompt stays focused on textual content.
 */

export type ExtractionResult = {
  text: string;
  perFile: Array<{ name: string; bytes: number; chars: number; note?: string }>;
  skipped: Array<{ name: string; reason: string }>;
};

const MAX_TOTAL_CHARS = 200_000;
const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB per file
const MAX_ZIP_ENTRIES = 50;

const TEXT_EXTS = new Set([
  "md",
  "mdx",
  "markdown",
  "txt",
  "text",
  "rst",
  "html",
  "htm",
  "json",
  "jsonc",
  "yml",
  "yaml",
  "toml",
  "xml",
  "csv",
  "tsv",
  "log",
  "srt",
  "vtt",
  "js",
  "jsx",
  "ts",
  "tsx",
  "py",
  "rb",
  "go",
  "rs",
  "java",
  "kt",
  "swift",
  "php",
  "sql",
  "sh",
  "bash",
  "zsh",
  "css",
  "scss",
  "env",
  "ini",
  "conf",
]);

const SKIP_EXTS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "bmp",
  "ico",
  "tif",
  "tiff",
  "mp3",
  "wav",
  "m4a",
  "flac",
  "ogg",
  "mp4",
  "mov",
  "avi",
  "mkv",
  "webm",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "numbers",
  "pages",
  "keynote",
  "exe",
  "dmg",
  "iso",
  "bin",
]);

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

async function extractPdf(buf: ArrayBuffer): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buf));
  const { text } = await extractText(pdf, { mergePages: true });
  return Array.isArray(text) ? text.join("\n\n") : text;
}

async function extractDocx(buf: ArrayBuffer): Promise<string> {
  const mammoth = await import("mammoth");
  const { value } = await mammoth.extractRawText({ buffer: Buffer.from(buf) });
  return value;
}

async function extractOne(
  name: string,
  mime: string,
  buf: ArrayBuffer,
): Promise<{ text: string; note?: string } | { skip: string }> {
  const ext = extOf(name);

  if (SKIP_EXTS.has(ext) || mime.startsWith("image/") || mime.startsWith("audio/") || mime.startsWith("video/")) {
    return { skip: "binary / media file" };
  }

  if (ext === "pdf" || mime === "application/pdf") {
    try {
      return { text: await extractPdf(buf) };
    } catch (err) {
      return { skip: `pdf parse failed: ${err instanceof Error ? err.message : "unknown"}` };
    }
  }

  if (
    ext === "docx" ||
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    try {
      return { text: await extractDocx(buf) };
    } catch (err) {
      return { skip: `docx parse failed: ${err instanceof Error ? err.message : "unknown"}` };
    }
  }

  if (ext === "doc") {
    return { skip: "legacy .doc — export as .docx or .pdf" };
  }

  if (TEXT_EXTS.has(ext) || mime.startsWith("text/") || mime === "application/json") {
    return { text: new TextDecoder("utf-8", { fatal: false }).decode(buf) };
  }

  // Last-chance heuristic: if it decodes as mostly printable, treat as text.
  const decoded = new TextDecoder("utf-8", { fatal: false }).decode(buf.slice(0, 4096));
  const printable = decoded.replace(/[\x20-\x7E\s]/g, "").length / Math.max(1, decoded.length);
  if (printable < 0.1) return { text: new TextDecoder("utf-8", { fatal: false }).decode(buf) };

  return { skip: `unknown format (.${ext || "—"})` };
}

async function extractZip(
  zipBuf: ArrayBuffer,
  zipName: string,
  result: ExtractionResult,
  remainingChars: () => number,
): Promise<void> {
  const zip = await JSZip.loadAsync(zipBuf);
  const entries = Object.values(zip.files).filter((f) => !f.dir);
  let processed = 0;
  for (const entry of entries) {
    if (processed >= MAX_ZIP_ENTRIES) {
      result.skipped.push({
        name: `${zipName} › (${entries.length - processed} more)`,
        reason: `zip entry cap (${MAX_ZIP_ENTRIES})`,
      });
      break;
    }
    if (remainingChars() <= 0) {
      result.skipped.push({
        name: `${zipName} › ${entry.name}`,
        reason: "total text budget exhausted",
      });
      break;
    }
    const innerName = `${zipName} › ${entry.name}`;
    if (extOf(entry.name) === "zip") {
      result.skipped.push({ name: innerName, reason: "nested zip not expanded" });
      continue;
    }
    try {
      const buf = await entry.async("arraybuffer");
      if (buf.byteLength > MAX_FILE_BYTES) {
        result.skipped.push({ name: innerName, reason: "entry > 20 MB" });
        continue;
      }
      const out = await extractOne(entry.name, "", buf);
      if ("skip" in out) {
        result.skipped.push({ name: innerName, reason: out.skip });
      } else {
        appendFile(result, innerName, buf.byteLength, out.text, remainingChars);
      }
    } catch (err) {
      result.skipped.push({
        name: innerName,
        reason: err instanceof Error ? err.message : "read failed",
      });
    }
    processed += 1;
  }
}

function appendFile(
  result: ExtractionResult,
  name: string,
  bytes: number,
  text: string,
  remainingChars: () => number,
): void {
  const budget = remainingChars();
  const trimmed = text.length > budget ? text.slice(0, Math.max(0, budget)) : text;
  const truncated = trimmed.length < text.length;
  if (trimmed.trim().length === 0) {
    result.skipped.push({ name, reason: "no extractable text" });
    return;
  }
  const block = `\n\n----- file: ${name} -----\n${trimmed}${truncated ? "\n\n[…truncated]" : ""}`;
  result.text += block;
  result.perFile.push({
    name,
    bytes,
    chars: trimmed.length,
    note: truncated ? "truncated" : undefined,
  });
}

export async function extractTextFromUploads(formData: FormData): Promise<ExtractionResult> {
  const result: ExtractionResult = { text: "", perFile: [], skipped: [] };
  const files = formData.getAll("files");
  const remainingChars = () => MAX_TOTAL_CHARS - result.text.length;

  for (const f of files) {
    if (!(f instanceof File)) continue;
    if (remainingChars() <= 0) {
      result.skipped.push({ name: f.name, reason: "total text budget exhausted" });
      continue;
    }
    if (f.size > MAX_FILE_BYTES) {
      result.skipped.push({ name: f.name, reason: "file > 20 MB" });
      continue;
    }

    try {
      const buf = await f.arrayBuffer();
      const ext = extOf(f.name);
      if (ext === "zip" || f.type === "application/zip" || f.type === "application/x-zip-compressed") {
        await extractZip(buf, f.name, result, remainingChars);
        result.perFile.push({ name: f.name, bytes: f.size, chars: 0, note: "zip expanded" });
        continue;
      }

      const out = await extractOne(f.name, f.type, buf);
      if ("skip" in out) {
        result.skipped.push({ name: f.name, reason: out.skip });
      } else {
        appendFile(result, f.name, f.size, out.text, remainingChars);
      }
    } catch (err) {
      result.skipped.push({
        name: f.name,
        reason: err instanceof Error ? err.message : "read failed",
      });
    }
  }

  result.text = result.text.trim();
  return result;
}
