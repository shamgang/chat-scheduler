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
    msgInput.type('also free all day weds');
    msgForm.submit();
  });
});