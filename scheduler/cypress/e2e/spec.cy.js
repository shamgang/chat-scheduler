describe('default spec', () => {
  it('Should go through basic flow without crashing', () => {
    cy.visit('http://localhost:3000');
    cy.wait(1000);
    const msgInput = cy.get('[data-testid="message-input"]');
    msgInput.type('the next two weeks');
    const msgForm = cy.get('[data-testid="message-form"]');
    msgForm.submit();
    cy.wait(6000);
    cy.get('#range-submit').click();
    cy.wait(1000);
    msgInput.type('free all day tuesday');
    msgForm.submit();
    cy.wait(5000);
    msgInput.type('also free all day weds and thurs from 9:30am to 10:30 am');
    msgForm.submit();
    cy.wait(5000);
    cy.get('#scheduler-submit').click();
    msgInput.type('free all day friday');
    msgForm.submit();
    cy.wait(3000);
    /* ==== Generated with Cypress Studio ==== */
    cy.get(':nth-child(6) > .rbc-events-container > .rbc-event > .rbc-event-content').click();
    /* ==== End Cypress Studio ==== */
    cy.wait(3000);
    cy.get('.rbc-day-slot:nth-child(6) > .rbc-timeslot-group:nth-child(6)').trigger('mousedown', {force: true});
    cy.wait(1000);
    cy.get('.rbc-day-slot:nth-child(6) > .rbc-timeslot-group:nth-child(6)').trigger('mousemove', {force: true});
    cy.wait(1000);
    cy.get('.rbc-day-slot:nth-child(6) > .rbc-timeslot-group:nth-child(7)').trigger('mousemove', {force: true});
    cy.wait(1000);
    cy.get('.rbc-day-slot:nth-child(6) > .rbc-timeslot-group:nth-child(8)').trigger('mousemove', {force: true});
    cy.wait(1000);
    cy.get('.rbc-day-slot:nth-child(6) > .rbc-timeslot-group:nth-child(8)').trigger('mouseup', {force: true});
  });
});