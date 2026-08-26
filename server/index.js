import { createHash, randomBytes } from "node:crypto"
import { createReadStream, promises as fs } from "node:fs"
import http from "node:http"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createGzip } from "node:zlib"
import nodemailer from "nodemailer"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public")
const PORT = Number.parseInt(process.env.PORT || "8080", 10)
const MAX_BODY_BYTES = 16 * 1024
const CHALLENGE_LIFETIME_MS = 60 * 60 * 1000
const MIN_FORM_TIME_MS = 2500
const RATE_WINDOW_MS = 60 * 60 * 1000
const RATE_LIMIT = 5
const CHALLENGE_RATE_LIMIT = 30

const challenges = new Map()
const submissionRates = new Map()
const challengeRates = new Map()

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".webp": "image/webp",
  ".xml": "application/xml; charset=utf-8",
}

const securityHeaders = {
  "Content-Security-Policy": "default-src 'self'; base-uri 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
}

const sendJson = (res, status, payload, extraHeaders = {}) => {
  res.writeHead(status, {
    ...securityHeaders,
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    ...extraHeaders,
  })
  res.end(JSON.stringify(payload))
}

const clientIp = req => {
  if (process.env.TRUST_PROXY === "true") {
    const forwarded = req.headers["x-forwarded-for"]
    if (typeof forwarded === "string") return forwarded.split(",")[0].trim()
  }
  return req.socket.remoteAddress || "unknown"
}

const allowRequest = (store, key, limit, windowMs) => {
  const now = Date.now()
  const existing = store.get(key)

  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  existing.count += 1
  return existing.count <= limit
}

const originIsAllowed = req => {
  const origin = req.headers.origin
  if (!origin) return false

  const configured = process.env.CONTACT_ALLOWED_ORIGIN
  if (configured) return origin === configured

  try {
    return new URL(origin).host === req.headers.host
  } catch {
    return false
  }
}

const readJson = req => new Promise((resolve, reject) => {
  let size = 0
  let raw = ""

  req.setEncoding("utf8")
  req.on("data", chunk => {
    size += Buffer.byteLength(chunk)
    if (size > MAX_BODY_BYTES) {
      reject(Object.assign(new Error("Request too large"), { status: 413 }))
      req.destroy()
      return
    }
    raw += chunk
  })
  req.on("end", () => {
    try {
      resolve(JSON.parse(raw))
    } catch {
      reject(Object.assign(new Error("Invalid JSON"), { status: 400 }))
    }
  })
  req.on("error", reject)
})

const cleanLine = (value, maxLength) => String(value || "").replace(/[\r\n\t]+/g, " ").trim().slice(0, maxLength)
const cleanMessage = value => String(value || "").replace(/\r\n?/g, "\n").trim().slice(0, 5000)
const escapeHtml = value => value.replace(/[&<>"']/g, character => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#039;",
}[character]))

const validateSubmission = body => {
  const fields = {
    name: cleanLine(body.name, 100),
    email: cleanLine(body.email, 200),
    company: cleanLine(body.company, 120),
    message: cleanMessage(body.message),
  }

  if (fields.name.length < 2) return { error: "Please add your name." }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) return { error: "Please use a valid email address." }
  if (fields.message.length < 20) return { error: "Please add a little more detail." }
  if ((fields.message.match(/https?:\/\//gi) || []).length > 4) return { error: "Please remove extra links and try again." }
  if (/(.)\1{15,}/.test(fields.message)) return { error: "Please revise the message and try again." }

  return { fields }
}

const smtpConfigured = () => [
  process.env.CONTACT_TO,
  process.env.SMTP_HOST,
  process.env.SMTP_USER,
  process.env.SMTP_PASS,
].every(Boolean)

let transporter
const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number.parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_SECURE === "true",
      requireTLS: process.env.SMTP_REQUIRE_TLS !== "false",
      disableFileAccess: true,
      disableUrlAccess: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: { minVersion: "TLSv1.2" },
    })
  }
  return transporter
}

const handleChallenge = (req, res) => {
  const ip = clientIp(req)
  if (!allowRequest(challengeRates, ip, CHALLENGE_RATE_LIMIT, RATE_WINDOW_MS)) {
    sendJson(res, 429, { message: "Please wait before trying again." })
    return
  }

  const nonce = randomBytes(24).toString("base64url")
  challenges.set(nonce, { ip, issuedAt: Date.now() })
  sendJson(res, 200, { nonce })
}

const handleContact = async (req, res) => {
  if (!originIsAllowed(req)) {
    sendJson(res, 403, { message: "This request could not be verified." })
    return
  }

  const ip = clientIp(req)
  if (!allowRequest(submissionRates, ip, RATE_LIMIT, RATE_WINDOW_MS)) {
    sendJson(res, 429, { message: "Too many messages. Please try again later." })
    return
  }

  let body
  try {
    body = await readJson(req)
  } catch (error) {
    if (!res.headersSent) sendJson(res, error.status || 400, { message: "The message could not be read." })
    return
  }

  // Bots commonly complete this field. Return a neutral success so they do not adapt.
  if (String(body.website || "").trim()) {
    sendJson(res, 200, { ok: true })
    return
  }

  const challenge = challenges.get(body.nonce)
  challenges.delete(body.nonce)
  const age = challenge ? Date.now() - challenge.issuedAt : 0
  const proofHash = createHash("sha256").update(`${body.nonce}:${body.proof}`).digest("hex")

  if (!challenge || challenge.ip !== ip || age < MIN_FORM_TIME_MS || age > CHALLENGE_LIFETIME_MS || !proofHash.startsWith("000")) {
    sendJson(res, 400, { message: "This browser could not be verified. Please try again." })
    return
  }

  const validation = validateSubmission(body)
  if (validation.error) {
    sendJson(res, 400, { message: validation.error })
    return
  }

  if (!smtpConfigured()) {
    sendJson(res, 503, { message: "Contact delivery is temporarily unavailable." })
    return
  }

  const { name, email, company, message } = validation.fields
  const subjectPrefix = cleanLine(process.env.CONTACT_SUBJECT_PREFIX || "Website inquiry", 80)

  try {
    await getTransporter().sendMail({
      from: process.env.CONTACT_FROM || process.env.SMTP_USER,
      to: process.env.CONTACT_TO,
      replyTo: email,
      subject: `${subjectPrefix}: ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nCompany: ${company || "—"}\n\n${message}`,
      html: `<p><strong>Name:</strong> ${escapeHtml(name)}<br><strong>Email:</strong> ${escapeHtml(email)}<br><strong>Company:</strong> ${escapeHtml(company || "—")}</p><p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
    })
    sendJson(res, 200, { ok: true })
  } catch (error) {
    console.error("Contact delivery failed:", error?.code || error?.name || "unknown error")
    sendJson(res, 502, { message: "The message could not be delivered. Please try again later." })
  }
}

const serveStatic = async (req, res, pathname) => {
  let relativePath = decodeURIComponent(pathname).replace(/^\/+/, "")
  if (!relativePath || relativePath.endsWith("/")) relativePath += "index.html"

  let filePath = path.resolve(ROOT, relativePath)
  if (!filePath.startsWith(`${ROOT}${path.sep}`)) {
    sendJson(res, 403, { message: "Forbidden" })
    return
  }

  let stat
  try {
    stat = await fs.stat(filePath)
  } catch {
    if (!path.extname(relativePath)) {
      filePath = path.join(ROOT, "index.html")
      stat = await fs.stat(filePath).catch(() => null)
    }
  }

  if (!stat?.isFile()) {
    sendJson(res, 404, { message: "Not found" })
    return
  }

  const extension = path.extname(filePath).toLowerCase()
  const contentType = mimeTypes[extension] || "application/octet-stream"
  const compressible = /^(text\/|application\/(javascript|json|manifest|xml))/.test(contentType)
  const useGzip = compressible && String(req.headers["accept-encoding"] || "").includes("gzip")
  const immutable = /\.[a-f0-9]{8,}\.(js|css)$/.test(path.basename(filePath))
  const cacheControl = extension === ".html"
    ? "no-cache, max-age=0, must-revalidate"
    : immutable
      ? "public, max-age=31536000, immutable"
      : "public, max-age=300"
  const headers = {
    ...securityHeaders,
    "Cache-Control": cacheControl,
    "Content-Type": contentType,
  }
  if (useGzip) headers["Content-Encoding"] = "gzip"

  res.writeHead(200, headers)
  if (req.method === "HEAD") {
    res.end()
    return
  }

  const stream = createReadStream(filePath)
  stream.on("error", () => res.destroy())
  if (useGzip) stream.pipe(createGzip()).pipe(res)
  else stream.pipe(res)
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", "http://localhost")

  if (req.method === "GET" && url.pathname === "/health") {
    sendJson(res, 200, { ok: true })
    return
  }
  if (req.method === "GET" && url.pathname === "/api/contact/challenge") {
    handleChallenge(req, res)
    return
  }
  if (req.method === "POST" && url.pathname === "/api/contact") {
    await handleContact(req, res)
    return
  }
  if (req.method === "GET" || req.method === "HEAD") {
    await serveStatic(req, res, url.pathname)
    return
  }

  sendJson(res, 405, { message: "Method not allowed" }, { Allow: "GET, HEAD, POST" })
})

setInterval(() => {
  const now = Date.now()
  for (const [nonce, challenge] of challenges) {
    if (now - challenge.issuedAt > CHALLENGE_LIFETIME_MS) challenges.delete(nonce)
  }
  for (const store of [submissionRates, challengeRates]) {
    for (const [key, value] of store) {
      if (value.resetAt <= now) store.delete(key)
    }
  }
}, 10 * 60 * 1000).unref()

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Website listening on port ${PORT}`)
})
