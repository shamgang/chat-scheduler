* Review world-class python repos and code review this repo
* Type hints for important components - mypy?
* Tests
* There is sometimes a UI bug on the chat when it fills up - some obstruction as the bottom
* State lifting is currently done through props - use context? Or other state management
* Cleanup - separate client and server message types?
* Cleanup - use ajv custom formatters and the “format” keyword in the schema to avoid having to index into all the messages and convert field-by-field (parseMessage, formatMessage). Automatically convert-in-place based on format specifier. Also possible in Python? That would further reduce format translation code size.
* RANGE session id is currently optional because it can be client or server message: split this into two message types?
* Replace in-memory chat history with a history fetching method