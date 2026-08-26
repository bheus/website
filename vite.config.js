import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  // `static/` keeps Gatsby's convention: copied to the output root untouched.
  // Vite's own default for this is `public/`, which is the build output here.
  publicDir: "static",
  build: {
    outDir: "public",
    emptyOutDir: true,
  },
})
