import { waitForNumIncoming, waitForNumUpdates, waitForCalendar } from "./utils";

describe('skip general and manual input', () => {
  it('Should be able to skip straight to specific manual input', () => {
    cy.visit('http://localhost:3000');
    waitForCalendar();
    waitForNumIncoming(2);
    const msgInput = cy.get('#messageInput');
    msgInput.type('the next two weeks');
    const msgForm = cy.get('#messageForm');
    msgForm.submit();
    waitForNumUpdates(1);
    cy.get('#range-submit').click();
    waitForNumIncoming(4);
    msgInput.type('My meeting');
    msgForm.submit();
    waitForNumIncoming(5);
    msgInput.type('shamik');
    msgForm.submit();
    waitForNumIncoming(6);
    cy.get('#calendar-submit').click();
    waitForNumIncoming(7);
    cy.get('.rbc-day-slot:nth-child(6) > .rbc-timeslot-group:nth-child(6)').trigger('mousedown', {force: true});
    cy.wait(1000);
    cy.get('.rbc-day-slot:nth-child(6) > .rbc-timeslot-group:nth-child(6)').trigger('mousemove', {force: true});
    cy.wait(1000);
    cy.get('.rbc-day-slot:nth-child(6) > .rbc-timeslot-group:nth-child(7)').trigger('mousemove', {force: true});
    cy.wait(1000);
    cy.get('.rbc-day-slot:nth-child(6) > .rbc-timeslot-group:nth-child(8)').trigger('mousemove', {force: true});
    cy.wait(1000);
    cy.get('.rbc-day-slot:nth-child(6) > .rbc-timeslot-group:nth-child(8)').trigger('mouseup', {force: true});
    // TODO: assert
  });
});