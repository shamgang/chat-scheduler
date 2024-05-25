import { waitForNumIncoming, waitForNumUpdates, waitForNumSorry, waitForCalendar } from "./utils";

const goodInputs = [
  'All of February',
  'The second half of March',
  'April 1-15',
  'The next two weeks',
  'This week',
  'The next week and a half',
  'From tomorrow until next weekend',
  'The second half of this month',
  'The next 10 days',
  'From tomorrow until next saturday',
  'Saturday through monday',
  'A week starting April 10',
  'The week of April 18',
  'The first saturday of June to the following weekend'
];

const badInputs = [
  'κόσμε',
  'いろはにほへとちりぬるを',
  'Next weekend and tuesday through friday',
  'April 1-5 and april 10-15',
  'Hamburger'
];

async function test() {
  cy.visit('http://localhost:3000');
  waitForCalendar();
  waitForNumIncoming(2);
  const msgInput = cy.get('[id="messageInput"]');
  const msgForm = cy.get('[id="messageForm"]');
  let numUpdates = 0;
  for (const input of goodInputs) {
    msgInput.type(input);
    msgForm.submit();
    numUpdates++;
    waitForNumUpdates(numUpdates);
  }
  let numSorry = 0;
  for (const input of badInputs) {
    msgInput.type(input);
    msgForm.submit();
    numSorry++;
    waitForNumSorry(numSorry);
  }
  // Test successive, interruptive input
  msgInput.type(goodInputs[0]);
  msgForm.submit();
  msgInput.type(goodInputs[1]);
  msgForm.submit();
  numUpdates += 2;
  waitForNumUpdates(numUpdates);
}

describe('date stress', () => {
  it('Should robustly handle inputs during date stage', () => {
    test();
  });
});