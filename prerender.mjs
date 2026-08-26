import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.dirname(fileURLToPath(import.meta.url))
const page = path.join(root, "public", "index.html")
const ssrDir = path.join(root, "dist-ssr")

const { render } = await import(path.join(ssrDir, "entry-server.js"))
const template = fs.readFileSync(page, "utf8")
let html = template.replace("<!--app-html-->", render())

// Gatsby pre-rendered this page, so a client-only bundle would be a regression:
// crawlers and social unfurlers would receive an empty root element.
if (html === template) {
  throw new Error("Prerender produced no markup; <!--app-html--> placeholder missing or render() empty.")
}

// The stylesheet is small and render-blocking; Gatsby inlined it, and leaving it
// as a separate request costs ~150ms of First Contentful Paint on mobile.
const stylesheet = html.match(/<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/)
if (!stylesheet) {
  throw new Error("No stylesheet link found in build output; the inlining step needs updating.")
}

const cssPath = path.join(root, "public", stylesheet[1])
html = html.replace(stylesheet[0], `<style>${fs.readFileSync(cssPath, "utf8")}</style>`)
fs.rmSync(cssPath)

fs.writeFileSync(page, html)
fs.rmSync(ssrDir, { recursive: true, force: true })
console.log(`Prerendered public/index.html (${html.length} bytes, stylesheet inlined)`)
