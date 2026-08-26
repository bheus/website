import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.dirname(fileURLToPath(import.meta.url))
const page = path.join(root, "public", "index.html")
const ssrDir = path.join(root, "dist-ssr")

const { render } = await import(path.join(ssrDir, "entry-server.js"))
const template = fs.readFileSync(page, "utf8")
const html = template.replace("<!--app-html-->", render())

// Gatsby pre-rendered this page, so a client-only bundle would be a regression:
// crawlers and social unfurlers would receive an empty root element.
if (html === template) {
  throw new Error("Prerender produced no markup; <!--app-html--> placeholder missing or render() empty.")
}

fs.writeFileSync(page, html)
fs.rmSync(ssrDir, { recursive: true, force: true })
console.log(`Prerendered public/index.html (${html.length} bytes)`)
