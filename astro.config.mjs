import { defineConfig, passthroughImageService } from "astro/config";

export default defineConfig({
  site: "https://HappyDoran.github.io",
  base: "/",
  image: { service: passthroughImageService() },
  output: "static",
});
