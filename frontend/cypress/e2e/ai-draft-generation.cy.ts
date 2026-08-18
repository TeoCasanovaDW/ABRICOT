// Mocked Mistral response — this scenario never reaches the real provider
// (or even the Express backend for the generation call itself), so it stays
// deterministic regardless of AI availability. Scope stops at the drafts
// rendering; saving is covered separately at the unit level
// (src/lib/ai/saveDrafts.test.ts, validateDrafts.test.ts).
const MOCKED_DRAFTS = [
  {
    title: "Rédiger la documentation API",
    description: "Documenter les endpoints REST avec des exemples de requêtes.",
    dueDate: "2026-09-15",
    status: "TODO",
    priority: "MEDIUM",
  },
  {
    title: "Ajouter des tests de charge",
    description: "Vérifier la tenue en charge de l'API sous forte volumétrie.",
    dueDate: "2026-09-20",
    status: "TODO",
    priority: "HIGH",
  },
];

describe("Génération de tâches par IA (mockée)", () => {
  beforeEach(() => {
    cy.login();
  });

  it("affiche les brouillons générés après une génération IA mockée", () => {
    cy.intercept("POST", "/api/ai/generate-tasks", {
      statusCode: 200,
      body: {
        success: true,
        message: "Tâches générées avec succès",
        data: { drafts: MOCKED_DRAFTS },
      },
    }).as("generateTasks");

    cy.visit("/projects");
    cy.findByRole("link", { name: /application e-commerce/i }).click();

    cy.findByRole("button", { name: /^ia$/i }).click();

    cy.findByRole("dialog", { name: /créer une tâche/i }).within(() => {
      cy.findByLabelText(/décrivez les tâches à créer/i).type(
        "Prépare la prochaine itération de l'API produits."
      );
      cy.findByRole("button", { name: /générer les tâches/i }).click();
    });

    cy.wait("@generateTasks");

    cy.findByRole("dialog", { name: /vos tâches/i }).within(() => {
      for (const draft of MOCKED_DRAFTS) {
        cy.findByRole("heading", { name: draft.title }).should("be.visible");
      }
    });
  });
});
