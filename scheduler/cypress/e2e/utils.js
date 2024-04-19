export async function waitForNumIncoming(n) {
  cy.get('[data-testid="incoming-message"]', { timeout: 10000 }).should('have.length', n);
}

export async function waitForNumUpdates(n) {
  cy.get('[data-testid="incoming-message"]:contains("pdated")', { timeout: 10000 }).should('have.length', n);
}

export async function waitForNumSorry(n) {
  cy.get('[data-testid="incoming-message"]:contains("Sorry")', { timeout: 10000 }).should('have.length', n);
}