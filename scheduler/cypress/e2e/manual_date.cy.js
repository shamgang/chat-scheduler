import { waitForNumIncoming, waitForNumUpdates } from "./utils";

describe('manual date', () => {
  it('Should handle manual date input during date stage', () => {
    cy.visit('http://localhost:3000');
    waitForNumIncoming(1);
    cy.get('.rbc-day-bg:nth-child(2)').first().click(); 
    cy.get('.rbc-day-bg:nth-child(4)').first().click(); 
    const msgInput = cy.get('[id="messageInput"]');
    const msgForm = cy.get('[id="messageForm"]');
    msgInput.type('the next two weeks');
    msgForm.submit();
    waitForNumUpdates(1);
    cy.get('.rbc-day-bg:nth-child(3)').first().click(); 
    cy.get('.rbc-day-bg:nth-child(5)').first().click(); 
    cy.wait(1000);
    cy.get('#range-submit').click();
  });
});