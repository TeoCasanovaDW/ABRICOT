function futureDateInput(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
}

describe("Projets et tâches", () => {
  beforeEach(() => {
    cy.login();
  });

  it("crée un projet puis une tâche qui apparaît dans la liste du projet", () => {
    // Unique names per run so repeated executions never collide with
    // earlier runs or with the seeded fixture projects.
    const runId = Date.now();
    const projectName = `Projet Cypress ${runId}`;
    const taskTitle = `Tâche Cypress ${runId}`;

    cy.visit("/projects");
    cy.findByRole("button", { name: "+ Créer un projet" }).click();

    cy.findByRole("dialog", { name: /créer un projet/i }).within(() => {
      cy.findByLabelText(/titre/i).type(projectName);
      cy.findByLabelText(/description/i).type("Projet créé automatiquement par la suite Cypress.");
      cy.findByRole("button", { name: /ajouter un projet/i }).click();
    });

    // Creation redirects to the new project's own detail page.
    cy.url().should("match", /\/projects\/[^/]+$/);
    cy.findByRole("heading", { level: 1, name: projectName }).should("be.visible");

    cy.findByRole("button", { name: /créer une tâche/i }).click();
    cy.findByRole("dialog", { name: /créer une tâche/i }).within(() => {
      cy.findByLabelText(/titre/i).type(taskTitle);
      cy.findByLabelText(/description/i).type("Tâche créée automatiquement par la suite Cypress.");
      cy.findByLabelText(/échéance/i).type(futureDateInput(14));
      cy.findByRole("button", { name: /ajouter une tâche/i }).click();
    });

    cy.findByRole("dialog", { name: /créer une tâche/i }).should("not.exist");
    cy.findByRole("heading", { name: taskTitle }).should("be.visible");
  });
});
