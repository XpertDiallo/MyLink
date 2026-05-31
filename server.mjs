import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const PORT = Number(process.argv[2] || process.env.PORT || 8765);
const CODEX_NODE_MODULES = "C:\\Users\\Lenovo\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules";

function resolvePackagePath(packageName, relativePath = "") {
  try {
    const packageJson = require.resolve(`${packageName}/package.json`);
    return path.join(path.dirname(packageJson), relativePath);
  } catch {
    return path.join(process.env.CODEX_NODE_MODULES || CODEX_NODE_MODULES, packageName, relativePath);
  }
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
}

function sendText(res, status, text, contentType = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
  });
  res.end(text);
}

async function readBody(req, maxBytes = 15 * 1024 * 1024) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) throw new Error("Payload trop volumineux");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function readJson(req) {
  const raw = await readBody(req, 2 * 1024 * 1024);
  return JSON.parse(raw.toString("utf8") || "{}");
}

function parseMultipart(buffer, contentType = "") {
  const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!match) return [];
  const boundary = Buffer.from(`--${match[1] || match[2]}`);
  const separator = Buffer.from("\r\n\r\n");
  const parts = [];
  let offset = 0;

  while (offset < buffer.length) {
    let start = buffer.indexOf(boundary, offset);
    if (start < 0) break;
    start += boundary.length;
    if (buffer.slice(start, start + 2).toString("latin1") === "--") break;
    if (buffer.slice(start, start + 2).toString("latin1") === "\r\n") start += 2;

    const headerEnd = buffer.indexOf(separator, start);
    if (headerEnd < 0) break;
    const nextBoundary = buffer.indexOf(boundary, headerEnd + separator.length);
    if (nextBoundary < 0) break;

    let bodyEnd = nextBoundary;
    if (buffer[bodyEnd - 2] === 13 && buffer[bodyEnd - 1] === 10) bodyEnd -= 2;
    const headersText = buffer.slice(start, headerEnd).toString("utf8");
    const body = buffer.slice(headerEnd + separator.length, bodyEnd);
    const disposition = headersText.match(/content-disposition:\s*([^\r\n]+)/i)?.[1] || "";
    const type = headersText.match(/content-type:\s*([^\r\n]+)/i)?.[1]?.trim() || "";
    const name = disposition.match(/name="([^"]+)"/i)?.[1] || "";
    const filename = disposition.match(/filename="([^"]*)"/i)?.[1] || "";
    parts.push({ name, filename, type, body });
    offset = nextBoundary + boundary.length;
  }

  return parts;
}

function decodeXmlEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

async function extractDocxText(buffer) {
  const JSZip = require(resolvePackagePath("jszip"));
  const zip = await JSZip.loadAsync(buffer);
  const xmlFiles = Object.keys(zip.files).filter((name) =>
    /^word\/(document|header\d+|footer\d+)\.xml$/i.test(name)
  );
  const chunks = [];
  for (const name of xmlFiles) {
    const xml = await zip.file(name).async("string");
    chunks.push(
      decodeXmlEntities(
        xml
          .replace(/<w:tab\/>/g, "\t")
          .replace(/<\/w:p>/g, "\n")
          .replace(/<[^>]+>/g, " ")
      )
    );
  }
  return chunks.join("\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

async function extractPdfText(buffer) {
  const pdfjsUrl = pathToFileURL(resolvePackagePath("pdfjs-dist", path.join("legacy", "build", "pdf.mjs"))).href;
  const pdfjs = await import(pdfjsUrl);
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    disableWorker: true,
    useSystemFonts: true,
  });
  const pdf = await loadingTask.promise;
  const pages = [];
  const pageLimit = Math.min(pdf.numPages, 12);
  for (let pageNumber = 1; pageNumber <= pageLimit; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str || "").join(" "));
  }
  return pages.join("\n\n").replace(/[ \t]+/g, " ").trim();
}

function extractLooseBinaryText(buffer) {
  return buffer
    .toString("latin1")
    .replace(/[^\x20-\x7EÀ-ÿ\r\n\t]+/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractFileText({ filename, type, body }) {
  const ext = path.extname(filename || "").toLowerCase();
  if (/text|json|csv|xml|html|plain/i.test(type) || [".txt", ".csv", ".json", ".md", ".xml"].includes(ext)) {
    return body.toString("utf8").trim();
  }
  if (ext === ".docx") return extractDocxText(body);
  if (ext === ".pdf" || /pdf/i.test(type)) return extractPdfText(body);
  if (ext === ".doc") return extractLooseBinaryText(body);
  return "";
}

async function handleExtractCv(req, res) {
  const buffer = await readBody(req);
  const parts = parseMultipart(buffer, req.headers["content-type"]);
  const file = parts.find((part) => part.name === "cv" && part.filename) || parts.find((part) => part.filename);
  if (!file) return sendJson(res, 400, { error: "Aucun fichier reçu", text: "" });

  try {
    const text = await extractFileText(file);
    sendJson(res, 200, {
      filename: file.filename,
      text,
      chars: text.length,
      warning: text.length < 40 ? "Texte extrait trop court ou document scanné sans OCR." : null,
    });
  } catch (error) {
    sendJson(res, 422, { error: error.message || "Extraction impossible", text: "" });
  }
}

async function handleGroqGenerate(req, res) {
  const body = await readJson(req);
  const apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || "";
  if (!apiKey) {
    return sendJson(res, 503, {
      error: "GROQ_API_KEY manquante. L'aperçu utilise le fallback local.",
      content: "{}",
    });
  }

  const messages = Array.isArray(body.messages)
    ? body.messages
    : [
        { role: "system", content: body.system || "Réponds uniquement avec un JSON valide." },
        { role: "user", content: body.prompt || "" },
      ];

  const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: body.model || "llama-3.3-70b-versatile",
      messages,
      max_tokens: body.maxTokens || body.max_tokens || 1600,
      temperature: body.temperature ?? 0.2,
      top_p: body.top_p ?? 0.85,
      response_format: body.response_format || { type: "json_object" },
    }),
  });

  const data = await groqResponse.json().catch(() => ({}));
  if (!groqResponse.ok) {
    return sendJson(res, groqResponse.status, {
      error: data.error?.message || "Erreur Groq",
      content: "{}",
    });
  }
  sendJson(res, 200, data);
}

async function serveStatic(req, res) {
  const route = new URL(req.url, `http://${req.headers.host}`).pathname;
  const filePath = route === "/" ? path.join(__dirname, "index.html") : path.join(__dirname, route.slice(1));
  const normalized = path.normalize(filePath);
  if (!normalized.startsWith(__dirname)) return sendText(res, 403, "Forbidden");

  try {
    const content = await fs.readFile(normalized);
    const ext = path.extname(normalized).toLowerCase();
    const type = ext === ".html" ? "text/html; charset=utf-8" : ext === ".jsx" ? "text/babel; charset=utf-8" : "application/octet-stream";
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
    res.end(content);
  } catch {
    sendText(res, 404, "Not found");
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;
    if (req.method === "POST" && pathname === "/api/profile/extract-cv") return handleExtractCv(req, res);
    if (req.method === "POST" && pathname === "/api/profile/generate") return handleGroqGenerate(req, res);
    if (req.method === "POST" && pathname === "/api/auth/send-validation-email") return sendJson(res, 200, { ok: true, preview: true });
    if (req.method === "GET") return serveStatic(req, res);
    sendText(res, 405, "Method not allowed");
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Erreur serveur" });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`mylink preview: http://127.0.0.1:${PORT}/`);
});
