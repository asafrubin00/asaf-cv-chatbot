const fs = require("fs");
const http = require("http");
const path = require("path");
const { createChatReply } = require("./lib/chat");

loadLocalEnv();

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "public");

function loadLocalEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, x-session-id",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  });
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 32_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

async function chatRoute(req, res) {
  try {
    const body = await readJson(req);
    const result = await createChatReply({
      message: body.message,
      history: body.history,
      sessionId: req.headers["x-session-id"],
    });

    sendJson(res, result.status, result.body);
  } catch (err) {
    sendJson(res, 500, { reply: `Server error: ${err.message}` });
  }
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const requestedPath = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  const filePath = path.normalize(path.join(PUBLIC_DIR, requestedPath));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end("Not found");
    }

    const ext = path.extname(filePath);
    const contentType = ext === ".html" ? "text/html; charset=utf-8" : "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (req.method === "OPTIONS") return sendJson(res, 204, {});
  if (req.method === "POST" && (url.pathname === "/api/chat" || url.pathname === "/chat")) {
    return chatRoute(req, res);
  }
  if (req.method === "GET") return serveStatic(req, res);

  res.writeHead(405, { Allow: "GET, POST, OPTIONS" });
  res.end("Method not allowed");
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. The chatbot is probably already running.`);
    console.error(`Open http://localhost:${PORT} or stop the existing server with: lsof -ti:${PORT} | xargs kill`);
    process.exit(1);
  }

  throw err;
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
