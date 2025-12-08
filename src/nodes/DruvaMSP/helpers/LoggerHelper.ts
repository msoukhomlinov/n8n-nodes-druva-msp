/**
 * A simple logging utility for consistent output formatting and debug control
 *
 * Note: This is a standalone logger implementation that doesn't conflict with n8n's
 * built-in LoggerProxy. While n8n recommends using LoggerProxy for node development,
 * this simpler implementation works well for custom community nodes that need lightweight
 * logging without the additional complexity.
 *
 * If deeper integration with n8n logging is needed (e.g., log file output, advanced
 * log levels), consider switching to LoggerProxy from n8n-workflow.
 */

import type { IExecuteFunctions, ILoadOptionsFunctions, IHookFunctions } from 'n8n-workflow';
import { LoggerProxy } from 'n8n-workflow';

// Standard log prefix for easy identification in console
const LOG_PREFIX = '[DruvaMSP]';

// Cache to store debug state per execution context
// Uses WeakMap for automatic cleanup when contexts are garbage collected
const debugCache = new WeakMap<
  IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
  boolean
>();

// Fallback debug state for when context is not provided (defaults to false)
let fallbackDebugEnabled = false;

/**
 * Get debug enabled state from credentials for a given execution context
 * Caches the result to avoid repeated credential lookups
 * @param context The n8n execution context (IExecuteFunctions, ILoadOptionsFunctions, or IHookFunctions)
 * @returns Promise<boolean> The debug enabled state from credentials
 */
export async function getDebugEnabled(
  context: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
): Promise<boolean> {
  // Check cache first
  const cached = debugCache.get(context);
  if (cached !== undefined) {
    return cached;
  }

  try {
    // Get credentials and read enableDebug setting
    const credentials = await context.getCredentials('druvaMspApi');
    const enabled = (credentials?.enableDebug as boolean) ?? false;

    // Cache the result
    debugCache.set(context, enabled);
    fallbackDebugEnabled = enabled;

    return enabled;
  } catch (error) {
    // If credential lookup fails, default to false and cache that
    debugCache.set(context, false);
    return false;
  }
}

/**
 * Logger utility for standardised formatting and controlled debug output
 */
export const logger = {
  /**
   * Log debug message - only shown when debug is enabled in credentials
   * @param message The message to log
   * @param context Optional n8n execution context to check credentials for debug setting
   */
  debug: async (
    message: string,
    context?: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
  ): Promise<void> => {
    let enabled = false;

    if (context) {
      // Check cache synchronously first (for performance)
      const cached = debugCache.get(context);
      if (cached !== undefined) {
        enabled = cached;
      } else {
        // Cache miss - get from credentials (async)
        enabled = await getDebugEnabled(context);
      }
    } else {
      // No context provided - use fallback (last known state or false)
      enabled = fallbackDebugEnabled;
    }

    if (enabled) {
      LoggerProxy.debug(`${LOG_PREFIX} ${message}`);
    }
  },

  /**
   * Log informational message - always shown
   * @param message The message to log
   */
  info: (message: string): void => {
    LoggerProxy.info(`${LOG_PREFIX} ${message}`);
  },

  /**
   * Log warning message - always shown
   * @param message The message to log
   */
  warn: (message: string): void => {
    LoggerProxy.warn(`${LOG_PREFIX} ${message}`);
  },

  /**
   * Log error message with optional Error object - always shown
   * @param message The message to log
   * @param error Optional Error object for stack trace
   */
  error: (message: string, error?: Error): void => {
    LoggerProxy.error(`${LOG_PREFIX} ${message}`, { error });
  },
};
