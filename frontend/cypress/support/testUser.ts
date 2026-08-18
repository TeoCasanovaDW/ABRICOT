// Kept out of commands.ts on purpose: commands.ts side-effect-imports
// @testing-library/cypress/add-commands, and specs importing straight from
// commands.ts pull that import into a second webpack bundle, re-registering
// the same query commands and crashing Cypress. Specs only need the
// constant, never the side effect.
export const TEST_USER = {
  email: "alice@example.com",
  password: "P@ssword123",
};
