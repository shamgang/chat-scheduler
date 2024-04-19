import { waitForNumIncoming, waitForNumUpdates } from "./utils";

describe('manual date', () => {
  it('Should handle manual date input during date stage', () => {
    cy.visit('http://localhost:3000');
    waitForNumIncoming(1);
    cy.get('.react-calendar__tile:nth-child(6)').click(); 
    cy.get('.react-calendar__tile:nth-child(10)').click(); 
    const msgInput = cy.get('[data-testid="message-input"]');
    const msgForm = cy.get('[data-testid="message-form"]');
    msgInput.type('the next two weeks');
    msgForm.submit();
    waitForNumUpdates(1);
    cy.get('.react-calendar__tile:nth-child(10)').click(); 
    cy.get('.react-calendar__tile:nth-child(15)').click();
    cy.get('#range-submit').click();
  });
});