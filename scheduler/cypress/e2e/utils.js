export async function waitForNumIncoming(n) {
  cy.get('.incoming', { timeout: 10000 }).should('have.length', n);
}

export async function waitForNumUpdates(n) {
  cy.get('.incoming:contains("pdated")', { timeout: 10000 }).should('have.length', n);
}

export async function waitForNumSorry(n) {
  cy.get('.incoming:contains("Sorry")', { timeout: 10000 }).should('have.length', n);
}