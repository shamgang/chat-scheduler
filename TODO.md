## High-priority

* Accessibility - Calendar selection is probably not accessible.
* Stripes are not visible easily on dark colors
* Feels like a messaging app - should have features like updating as soon as data changes on the backend, telling available times as soon as data changes

## Medium-priority

* Add a way for the user to complain if the model got it wrong, and fallback to the better model in that case.
* Retries for creating websocket and getting event state, not just sending message
* API integration for events
* Test that page does not crash when left open indefinitely
* Loading UI: Block user message send until websocket is available (with timeout) and until after event state is loaded. Include some visual indicator of loading to signal the user and also the test script.
* Pick a domain and brand name
* Add brand logo - fixed position, small text, subtle
* periodically flush old events and communicate this to user
* Add assertions in tests for manual input
* Sanitize inputs (event title, etc.) on the server side for injection

## Low-priority

* Code and style review with gold-standard repos as reference
* Type hints for important components - mypy?
* State lifting is currently done through props - use context? Or other state management?
* Cleanup - separate client and server message types?
* Cleanup - use ajv custom formatters and the “format” keyword in the schema to avoid having to index into all the messages and convert field-by-field (parseMessage, formatMessage). Automatically convert-in-place based on format specifier. Also possible in Python? That would further reduce format translation code size.
* RANGE session id is currently optional because it can be client or server message: split this into two message types?
* test names with spaces and weird characters in them - make sure different capitalizations match the same person
* Stress test general availability mode, etc.
* Stress test date and time manual selection - mixing drag and click in weird ways, going across day boundaries, etc. - including mouseup on a disabled day
* Official method for scheduling the meeting
* Have link easily copiable without going to URL bar - share button?
* React profiling
* Change tooltip anchor to button for accessibility
* Form validation
* Stop copy-pasting the json schema - find a way to re-use without breaking the npm production build
* Webpubsub currently open to anonymous clients - disable this and update readme?
* Set up deployments on development branches
* create a shared connection ID / session ID to help connect frontend logs to backend logs.
* create a subtype of Error instead of extending it in LogDownload? eslint warning
* Remove date selection entirely?
* Ability to re-title untitled event
* Filter out invalid time prompts
* Use document patch / partial update in Cosmos DB to reduce reads and read-after-writes?
* Refactor tests
* setTimeout handler in MessageService taking too long - blocking on sending to websocket - client-side JS warning. Also "Forced reflow while executing JavaScript"