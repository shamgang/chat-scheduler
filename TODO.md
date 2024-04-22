* Code and style review with gold-standard repos as reference
* Type hints for important components - mypy?
* State lifting is currently done through props - use context? Or other state management
* Cleanup - separate client and server message types?
* Cleanup - use ajv custom formatters and the “format” keyword in the schema to avoid having to index into all the messages and convert field-by-field (parseMessage, formatMessage). Automatically convert-in-place based on format specifier. Also possible in Python? That would further reduce format translation code size.
* RANGE session id is currently optional because it can be client or server message: split this into two message types?
* Replace in-memory chat history with a history fetching method
* JSON schema validation on the front end for state document
* Make names whitespace and caps agnostic
* Clean up shared CSS/JS between Calendar.js and Scheduler.js
* If the user types something that looks like confirmation - OK, good, etc. - this could trigger the OK confirmation - would require another LLM round-trip
* Stress test general availability mode, etc.
* Double check that everything passed to react components is memo-ized
* onSubmit / onConfirm poor naming App.js
* Stress test date and time manual selection - mixing drag and click in weird ways, going across day boundaries, etc. - including mouseup on a disabled day
* Bug: clicking once and then drag-selecting a later time sometimes creates an event that spans the click and the selection - because a click and a select event fire on mouseup