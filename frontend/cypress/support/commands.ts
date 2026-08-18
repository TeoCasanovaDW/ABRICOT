import "@testing-library/cypress/add-commands";
import { TEST_USER } from "./testUser";

export { TEST_USER };

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Logs in through the real login form, cached across specs via cy.session. */
      login(email?: string, password?: string): Chainable<void>;
    }
  }
}

// Goes through the actual login UI once per unique (email, password), then
// restores the resulting cookie for later tests — faster than re-submitting
// the form every time, without skipping the real auth flow entirely.
Cypress.Commands.add("login", (email = TEST_USER.email, password = TEST_USER.password) => {
  cy.session(
    [email, password],
    () => {
      cy.visit("/login");
      cy.findByLabelText(/e-mail/i).type(email);
      cy.findByLabelText(/mot de passe/i).type(password, { log: false });
      cy.findByRole("button", { name: /se connecter/i }).click();
      cy.url().should("include", "/dashboard");
    },
    {
      // No lightweight authenticated GET endpoint exists client-side (data
      // fetching in this app happens server-side in Server Components) —
      // visiting a protected page and checking it doesn't bounce to /login
      // is the reliable way to confirm the cached cookie is still valid.
      validate() {
        cy.visit("/dashboard");
        cy.location("pathname").should("eq", "/dashboard");
      },
    }
  );
});
