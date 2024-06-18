// Takes a function to execute later and a delay,
// and an array to push a timeout handle into for early cancellation.
export async function executeLater(asyncFunc, delayMs, timeouts=null) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      (async() => {
        try {
          resolve(await asyncFunc());
        } catch (err) {
          reject(err);
        }
      })();
    }, delayMs);
    if (timeouts) {
      timeouts.push(timeout);
    }
  });
}
