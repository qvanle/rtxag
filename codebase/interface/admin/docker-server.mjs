import { createServer } from "node:http";
import { Readable } from "node:stream";
import { readFile } from "node:fs/promises";
import path from "node:path";
import workerModule from "./dist/server/index.js";

const port = Number.parseInt(process.env.PORT || "3000", 10);
const host = "0.0.0.0";
const clientRoot = path.resolve("dist/client");
const adminApiOrigin = process.env.ADMIN_API_ORIGIN || "http://adminapi:8080";
const defaultUserId = process.env.ADMIN_UI_DEV_USER_ID || "u-1";
const defaultUserRoles = process.env.ADMIN_UI_DEV_USER_ROLES || "system_admin";
const defaultTenantId = process.env.ADMIN_UI_DEV_TENANT_ID || "";

function getContentType(filePath) {
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) return "image/jpeg";
  if (filePath.endsWith(".webp")) return "image/webp";
  if (filePath.endsWith(".ico")) return "image/x-icon";
  if (filePath.endsWith(".txt")) return "text/plain; charset=utf-8";
  return "application/octet-stream";
}

const worker = workerModule?.default ?? workerModule;
if (!worker || typeof worker.fetch !== "function") {
  throw new Error("Invalid worker module: expected default export with fetch(request, env, ctx).");
}

createServer(async (req, res) => {
  try {
    const reqPath = new URL(req.url || "/", `http://${req.headers.host || `localhost:${port}`}`).pathname;

    if (reqPath.startsWith("/api/")) {
      const upstreamUrl = `${adminApiOrigin}${req.url || "/"}`;
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (Array.isArray(value)) {
          for (const item of value) headers.append(key, item);
        } else if (value != null) {
          headers.set(key, value);
        }
      }
      headers.set("host", new URL(adminApiOrigin).host);
      if (!headers.has("Rotexai-User-Id")) headers.set("Rotexai-User-Id", defaultUserId);
      if (!headers.has("Rotexai-User-Roles")) headers.set("Rotexai-User-Roles", defaultUserRoles);
      if (defaultTenantId && !headers.has("Rotexai-Tenant-Id")) headers.set("Rotexai-Tenant-Id", defaultTenantId);

      const method = req.method || "GET";
      const bodyAllowed = method !== "GET" && method !== "HEAD";
      const upstreamResponse = await fetch(upstreamUrl, {
        method,
        headers,
        body: bodyAllowed ? Readable.toWeb(req) : undefined,
        duplex: "half",
      });

      res.statusCode = upstreamResponse.status;
      for (const [key, value] of upstreamResponse.headers.entries()) {
        if (key.toLowerCase() === "content-encoding") continue;
        res.setHeader(key, value);
      }
      if (!upstreamResponse.body) {
        res.end();
        return;
      }
      Readable.fromWeb(upstreamResponse.body).pipe(res);
      return;
    }

    const staticPath = path.normalize(path.join(clientRoot, reqPath === "/" ? "index.html" : reqPath));
    if (staticPath.startsWith(clientRoot)) {
      try {
        const file = await readFile(staticPath);
        res.statusCode = 200;
        res.setHeader("content-type", getContentType(staticPath));
        if (reqPath.includes("/assets/")) {
          res.setHeader("cache-control", "public, max-age=31536000, immutable");
        }
        res.end(file);
        return;
      } catch {
        // Fall through to SSR worker.
      }
    }

    const url = `http://${req.headers.host || `localhost:${port}`}${req.url || "/"}`;
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) {
        for (const item of value) headers.append(key, item);
      } else if (value != null) {
        headers.set(key, value);
      }
    }

    const method = req.method || "GET";
    const bodyAllowed = method !== "GET" && method !== "HEAD";
    const request = new Request(url, {
      method,
      headers,
      body: bodyAllowed ? Readable.toWeb(req) : undefined,
      duplex: "half",
    });

    const response = await worker.fetch(request, {}, { waitUntil: () => {}, passThroughOnException: () => {} });
    res.statusCode = response.status;
    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value);
    }

    if (!response.body) {
      res.end();
      return;
    }

    Readable.fromWeb(response.body).pipe(res);
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end("Internal Server Error");
    console.error(error);
  }
}).listen(port, host, () => {
  console.log(`adminui listening on http://${host}:${port}`);
});
