import { defineConfig } from "cypress";

// Minimal E2E-only config — no component testing, no plugins beyond
// @testing-library/cypress (loaded in cypress/support/e2e.ts).
export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: "cypress/support/e2e.ts",
    video: false,
    retries: 0,
  },
});
