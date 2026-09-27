import React from "react"
import { createRoot, hydrateRoot } from "react-dom/client"
import App from "./App"

const root = document.getElementById("root")

// The dev server serves the unrendered template; only the production build is prerendered.
if (root.firstElementChild) {
  hydrateRoot(root, <App />)
} else {
  createRoot(root).render(<App />)
}
