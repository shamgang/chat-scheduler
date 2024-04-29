import Ajv from 'ajv';
import { fromIsoNoHyphens } from "../helpers/FormatHelpers";
import commonSchema from '../assets/common_schema.json';
import stateSchema from '../assets/state_schema.json';

const STATE_ENDPOINT = process.env.REACT_APP_API_HOST + '/api/state';

const ajv = new Ajv({verbose: true});

const validate = ajv.addSchema(commonSchema).compile(stateSchema);

function parseEventState(eventState) {
  if (!validate(eventState)) {
    console.log(eventState);
    console.log(validate.errors);
    throw new Error('Invalid message format');
  }
  eventState.fromDate = fromIsoNoHyphens(eventState.fromDate);
  eventState.toDate = fromIsoNoHyphens(eventState.toDate);
  // NOTE: not parsing time grid date keys - leave as strings
  return eventState;
}

export async function getEventState(eventId) {
  const url = `${STATE_ENDPOINT}/${eventId}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw response;
  }
  const eventState = parseEventState(await response.json());
  return eventState;
}
