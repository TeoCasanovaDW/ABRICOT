import { TEST_USER } from "../support/testUser";

describe("Connexion", () => {
  it("permet à un utilisateur existant de se connecter et d'accéder au tableau de bord", () => {
    cy.visit("/login");

    cy.findByLabelText(/e-mail/i).type(TEST_USER.email);
    cy.findByLabelText(/mot de passe/i).type(TEST_USER.password, { log: false });
    cy.findByRole("button", { name: /se connecter/i }).click();

    cy.url().should("include", "/dashboard");
    // Asserts real authenticated content rendered, not just a URL change.
    cy.findByRole("heading", { level: 1, name: /tableau de bord/i }).should("be.visible");
    cy.findByText(/bonjour alice martin/i).should("be.visible");
  });
});
