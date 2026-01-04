// src/lib/logger.ts

/**
 * Simple logger utility that respects environment
 */
const isDevelopment = import.meta.env.DEV;

export const logger = {
    debug: (...args: any[]) => {
        if (isDevelopment) {
            console.debug('[DEBUG]', ...args);
        }
    },

    info: (...args: any[]) => {
        if (isDevelopment) {
            console.info('[INFO]', ...args);
        }
    },

    warn: (...args: any[]) => {
        console.warn('[WARN]', ...args);
    },

    error: (...args: any[]) => {
        console.error('[ERROR]', ...args);
    },
};
