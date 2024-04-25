* Code and style review with gold-standard repos as reference
* Type hints for important components - mypy?
* State lifting is currently done through props - use context? Or other state management
* Cleanup - separate client and server message types?
* Cleanup - use ajv custom formatters and the “format” keyword in the schema to avoid having to index into all the messages and convert field-by-field (parseMessage, formatMessage). Automatically convert-in-place based on format specifier. Also possible in Python? That would further reduce format translation code size.
* RANGE session id is currently optional because it can be client or server message: split this into two message types?
* Replace in-memory chat history with a history fetching method
* Make names whitespace and caps agnostic
* test names with spaces and weird characters in them
* If the user types something that looks like confirmation - OK, good, etc. - this could trigger the OK confirmation - would require another LLM round-trip
* Stress test general availability mode, etc.
* Double check that everything passed to react components is memo-ized
* onSubmit / onConfirm poor naming App.js
* Stress test date and time manual selection - mixing drag and click in weird ways, going across day boundaries, etc. - including mouseup on a disabled day
* Name events so people can tell if they're coming to the correct place - use this in page title?
* Font redesign
* Official method for scheduling the meeting
* API integration for events
* Refine color schema - should have a dark mode? or just be dark mode? Calendar looks a little too intense, maybe should be light
* Have link easily copiable without going to URL bar
* React profiling
* Show the found times on the UI - highlight them in a different color + show attendees on hover/tap for each slot
* Accessibility - Calendar selection is probably not accessible.
* Make the mobile view longer? scroll
* Test using an invalid event ID in the url
* Fix button design when toggling between edit and view - use icons, and show as more visible toggle