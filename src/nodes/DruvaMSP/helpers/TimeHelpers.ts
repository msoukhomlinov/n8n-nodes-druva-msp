// Import from node:timers/promises to avoid restricted global setTimeout
// eslint-disable-next-line @typescript-eslint/no-var-requires
const timers = require('node:timers/promises');

/**
 * Delays execution for the specified number of milliseconds.
 * Uses Node's timers/promises to avoid restricted globals.
 * @param ms Milliseconds to sleep
 */
export async function sleep(ms: number): Promise<void> {
  await timers.setTimeout(ms);
}
