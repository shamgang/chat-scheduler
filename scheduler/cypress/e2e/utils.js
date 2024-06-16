export function createSelectorCounter(selector, timeout=12000) {
  let count = 0;
  return {
    waitForMore: (n) => {
      cy.get(selector, { timeout }).should('have.length', count + n);
      count += n;
    }
  }
}

export const INCOMING_MESSAGE_SELECTOR = '.incoming:not(:contains("Let me think"))';

export const EXPECTED_ERROR_MESSAGE_SELECTOR = '.incoming:contains("Sorry")';

export function createIncomingMessageCounter(timeout=12000) {
  return createSelectorCounter(INCOMING_MESSAGE_SELECTOR, timeout);
}

export function createExpectedErrorCounter(timeout=12000) {
  return createSelectorCounter(EXPECTED_ERROR_MESSAGE_SELECTOR, timeout);
}

export async function waitForCalendar() {
  cy.get('div.calendar', { timeout: 2000 }).should('exist');
}