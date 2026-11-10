import { defineConfig, passthroughImageService } from "astro/config";

export default defineConfig({
  site: "https://HappyDoran.github.io",
  base: "/",
  image: { service: passthroughImageService() },
  markdown: { shikiConfig: { theme: "github-light" } },
  output: "static",
});
