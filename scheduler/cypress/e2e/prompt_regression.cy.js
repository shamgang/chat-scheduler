import { waitForNumIncoming, waitForNumUpdates, waitForCalendar } from "./utils";

describe('regression for breaking prompt', () => {
  it('Should be able to handle prompts that have broken', () => {
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
    msgInput.type("i'm free 9-5 every weekday");
    msgForm.submit();
    waitForNumUpdates(2);
  });
});