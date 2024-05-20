* Code and style review with gold-standard repos as reference
* Type hints for important components - mypy?
* State lifting is currently done through props - use context? Or other state management?
* Cleanup - separate client and server message types?
* Cleanup - use ajv custom formatters and the “format” keyword in the schema to avoid having to index into all the messages and convert field-by-field (parseMessage, formatMessage). Automatically convert-in-place based on format specifier. Also possible in Python? That would further reduce format translation code size.
* RANGE session id is currently optional because it can be client or server message: split this into two message types?
* test names with spaces and weird characters in them - make sure different capitalizations match the same person
* Stress test general availability mode, etc.
* Stress test date and time manual selection - mixing drag and click in weird ways, going across day boundaries, etc. - including mouseup on a disabled day
* Font redesign
* Official method for scheduling the meeting
* API integration for events
* Refine color schema - should have a dark mode? or just be dark mode? Calendar looks a little too intense, maybe should be light
* Have link easily copiable without going to URL bar - share button?
* React profiling
* Accessibility - Calendar selection is probably not accessible.
* Make the mobile view longer? scroll
* Change tooltip anchor to button for accessibility
* Add brand logo - fixed position, small text, subtle
* Form validation
* Stop copy-pasting the json schema - find a way to re-use without breaking the npm production build
* Webpubsub currently open to anonymous clients - disable this and update readme?
* Display messages code has a lot of state machine redundancy - combine with the main state machine
* Set up deployments on development branches
* webpubsub_extension key regenerates on every deployment? will break app on every push - change AzureWebJobsSecretStorageType
* general avail prompt "i'm free 9-5 every weekday" is breaking with error "Exception: ValueError: time data '1700PM' does not match format '%I%M%p'"
* message handler does sendToAll - test how this works across clients - probably will break
* periodically flush old events and communicate this to user
* Name events so people can tell if they're coming to the correct place - use this in page title?
* communicate how to view overlapping event times
* create a shared connection ID / session ID to help connect frontend logs to backend logs.
* create a subtype of Error instead of extending it in LogDownload? eslint warning
* setTimeout handler in MessageService taking too long - blocking on sending to websocket - client-side JS warning. Also "Forced reflow while executing JavaScript"
