import { createIncomingMessageCounter, waitForCalendar } from "./utils";

describe('regression for breaking prompt', () => {
  it('Should be able to handle prompts that have broken', () => {
    let incomingMessageCounter = createIncomingMessageCounter();
    cy.visit('http://localhost:3000');
    waitForCalendar();
    incomingMessageCounter.waitForMore(1);
    const msgInput = cy.get('#messageInput');
    msgInput.type('the next two weeks');
    const msgForm = cy.get('#messageForm');
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
    msgInput.type("i'm free 9-5 every weekday");
    msgForm.submit();
    incomingMessageCounter.waitForMore(1);
  });
});