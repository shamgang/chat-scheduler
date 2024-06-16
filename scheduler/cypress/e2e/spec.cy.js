import {
  createIncomingMessageCounter,
  createExpectedErrorCounter,
  waitForCalendar
} from "./utils";


describe('default spec', () => {
  it('Should go through basic flow without crashing', () => {
    let incomingMessageCounter = createIncomingMessageCounter();
    cy.visit('http://localhost:3000');
    //cy.visit('https://scheduler.shamgang.com');
    waitForCalendar();
    incomingMessageCounter.waitForMore(1);
    let msgInput = cy.get('#messageInput');
    msgInput.type('the next two weeks');
    let msgForm = cy.get('#messageForm');
    msgForm.submit();
    incomingMessageCounter.waitForMore(1);
    cy.get('#range-submit').click();
    incomingMessageCounter.waitForMore(1);
    msgInput.type('My meeting');
    msgForm.submit();
    incomingMessageCounter.waitForMore(1);
    msgInput.type('shamik');
    msgForm.submit();
    incomingMessageCounter.waitForMore(1);
    msgInput.type('free all day tuesday');
    msgForm.submit();
    incomingMessageCounter.waitForMore(1);
    msgInput.type('also free all day weds and thurs from 9:30am to 10:30 am');
    msgForm.submit();
    incomingMessageCounter.waitForMore(1);
    cy.get('#calendar-submit').click();
    incomingMessageCounter.waitForMore(1);
    msgInput.type('free all day friday');
    msgForm.submit();
    incomingMessageCounter.waitForMore(1);
    cy.wait(3000);
    /* ==== End Cypress Studio ==== */
    cy.get('.rbc-day-slot:nth-child(6) > .rbc-timeslot-group:nth-child(6)').trigger('mousedown', {force: true});
    cy.wait(1000);
    cy.get('.rbc-day-slot:nth-child(6) > .rbc-timeslot-group:nth-child(6)').trigger('mousemove', {force: true});
    cy.wait(1000);
    cy.get('.rbc-day-slot:nth-child(6) > .rbc-timeslot-group:nth-child(7)').trigger('mousemove', {force: true});
    cy.wait(1000);
    cy.get('.rbc-day-slot:nth-child(6) > .rbc-timeslot-group:nth-child(8)').trigger('mousemove', {force: true});
    cy.wait(1000);
    cy.get('.rbc-day-slot:nth-child(6) > .rbc-timeslot-group:nth-child(8)').trigger('mouseup', {force: true});
    cy.reload();
    incomingMessageCounter = createIncomingMessageCounter();
    waitForCalendar();
    incomingMessageCounter.waitForMore(1);
    msgInput = cy.get('[id="messageInput"]');
    msgForm = cy.get('[id="messageForm"]');
    msgInput.type('shamik');
    msgForm.submit();
    incomingMessageCounter.waitForMore(1);
    msgInput.type('free all day and night friday');
    msgForm.submit();
    cy.reload();
    incomingMessageCounter = createIncomingMessageCounter();
    waitForCalendar();
    incomingMessageCounter.waitForMore(1);
    msgInput = cy.get('[id="messageInput"]');
    msgForm = cy.get('[id="messageForm"]');
    msgInput.type('blurb');
    msgForm.submit();
    incomingMessageCounter.waitForMore(1);
    msgInput.type('free fridays 1-3');
    msgForm.submit();
    incomingMessageCounter.waitForMore(1);
    cy.get('#calendar-submit').click();
  });
});