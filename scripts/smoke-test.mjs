import { spawn } from "node:child_process";
import fs from "node:fs/promises";

const PORT = Number(process.env.SMOKE_PORT || 8876);
const BASE_URL = `http://127.0.0.1:${PORT}`;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer() {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${BASE_URL}/`);
      if (response.ok) return;
    } catch {}
    await wait(300);
  }
  throw new Error("Le serveur de test n'a pas demarre a temps.");
}

async function assertFetch(path, expectedStatus = 200) {
  const response = await fetch(`${BASE_URL}${path}`);
  if (response.status !== expectedStatus) {
    throw new Error(`${path} a retourne ${response.status}, attendu ${expectedStatus}.`);
  }
  return response;
}

async function testTextExtraction() {
  const formData = new FormData();
  const sample = [
    "Awa Diop",
    "Assistante administrative a Dakar",
    "Experience en accueil, classement, Word, Excel et suivi client.",
    "Realisation : organisation du classement des dossiers et amelioration du suivi des demandes."
  ].join("\n");
  formData.append("cv", new Blob([sample], { type: "text/plain" }), "sample-cv.txt");
  const response = await fetch(`${BASE_URL}/api/profile/extract-cv`, {
    method: "POST",
    body: formData
  });
  if (!response.ok) throw new Error(`Extraction document KO: ${response.status}`);
  const data = await response.json();
  if (!String(data.text || "").includes("Assistante administrative")) {
    throw new Error("Le texte extrait ne contient pas le contenu attendu.");
  }
}

async function main() {
  const child = spawn(process.execPath, ["server.mjs", String(PORT)], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, PORT: String(PORT) }
  });

  let logs = "";
  child.stdout.on("data", (chunk) => { logs += chunk.toString(); });
  child.stderr.on("data", (chunk) => { logs += chunk.toString(); });

  try {
    await waitForServer();
    const home = await assertFetch("/");
    const html = await home.text();
    if (!html.includes("app.jsx")) throw new Error("index.html ne charge pas app.jsx.");

    const app = await assertFetch("/app.jsx");
    const appText = await app.text();
    if (!appText.includes("function Preview")) throw new Error("app.jsx ne contient pas le composant principal.");

    await testTextExtraction();
    console.log("Smoke test OK");
  } finally {
    child.kill();
    if (process.env.DEBUG_SMOKE_LOGS === "1") {
      await fs.writeFile("smoke-test.log", logs);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
