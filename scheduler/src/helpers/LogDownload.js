export function makeErrorsSerializable() {
  if (!('toJSON' in Error.prototype)) {
    Object.defineProperty(Error.prototype, 'toJSON', {
      value: function () {
        var alt = {};
  
        Object.getOwnPropertyNames(this).forEach(function (key) {
            alt[key] = this[key];
        }, this);
  
        return alt;
      },
      configurable: true,
      writable: true
    });
  }
};

export function startCapturingLogs() {
  if (console.everything === undefined)
    {
      console.everything = [];
    
      console.defaultLog = console.log.bind(console);
      console.log = function(){
        console.everything.push({"type":"log", "datetime":Date().toLocaleString(), "value":Array.from(arguments)});
        console.defaultLog.apply(console, arguments);
      }
      console.defaultError = console.error.bind(console);
      console.error = function(){
        console.everything.push({"type":"error", "datetime":Date().toLocaleString(), "value":Array.from(arguments)});
        console.defaultError.apply(console, arguments);
      }
      console.defaultWarn = console.warn.bind(console);
      console.warn = function(){
        console.everything.push({"type":"warn", "datetime":Date().toLocaleString(), "value":Array.from(arguments)});
        console.defaultWarn.apply(console, arguments);
      }
      console.defaultDebug = console.debug.bind(console);
      console.debug = function(){
        console.everything.push({"type":"debug", "datetime":Date().toLocaleString(), "value":Array.from(arguments)});
        console.defaultDebug.apply(console, arguments);
      }
    }
};

export function getLogURL() {
  if (console.logURL) {
    URL.revokeObjectURL(console.logURL);
  }
  console.logURL = URL.createObjectURL(
    new Blob(
      [JSON.stringify(console.everything, null, 2)],
      { type: "text/plain" }
    )
  )
  return console.logURL;
};
