export async function waitForNumIncoming(n) {
  cy.get('.incoming', { timeout: 10000 }).should('have.length', n);
}

export async function waitForNumUpdates(n) {
  cy.get('.incoming:contains("pdated")', { timeout: 12000 }).should('have.length', n);
}

export async function waitForNumSorry(n) {
  cy.get('.incoming:contains("Sorry")', { timeout: 12000 }).should('have.length', n);
}

export async function waitForCalendar() {
  cy.get('div.calendar', { timeout: 2000 }).should('exist');
}