// src/lib/error-handler.ts

/**
 * Type-safe error handler utility
 */
export class AppError extends Error {
    constructor(
        message: string,
        public code?: string,
        public statusCode?: number
    ) {
        super(message);
        this.name = 'AppError';
    }
}

/**
 * Safely extract error message from unknown error types
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object' && 'message' in error) {
        return String(error.message);
    }
    return 'An unexpected error occurred';
}

/**
 * Check if error is from Supabase
 */
export function isSupabaseError(error: unknown): error is { message: string; code?: string } {
    return (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as any).message === 'string'
    );
}

/**
 * Handle errors consistently across the app
 */
export function handleError(error: unknown, context?: string): string {
    console.error(`Error${context ? ` in ${context}` : ''}:`, error);

    if (isSupabaseError(error)) {
        return error.message;
    }

    return getErrorMessage(error);
}
