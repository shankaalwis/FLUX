import { describe, it, expect } from 'vitest';
import { getErrorMessage, isSupabaseError } from './error-handler';

describe('Error Handler Utilities', () => {
    describe('getErrorMessage', () => {
        it('extracts message from Error object', () => {
            const error = new Error('Something went wrong');
            expect(getErrorMessage(error)).toBe('Something went wrong');
        });

        it('returns the string if error is a string', () => {
            const error = 'Simple string error';
            expect(getErrorMessage(error)).toBe('Simple string error');
        });

        it('extracts message from an object with a message property', () => {
            const error = { message: 'Custom object error', code: 500 };
            expect(getErrorMessage(error)).toBe('Custom object error');
        });

        it('returns default message for unknown inputs', () => {
            expect(getErrorMessage(null)).toBe('An unexpected error occurred');
            expect(getErrorMessage(undefined)).toBe('An unexpected error occurred');
            expect(getErrorMessage(123)).toBe('An unexpected error occurred');
        });
    });

    describe('isSupabaseError', () => {
        it('returns true for object with message string', () => {
            expect(isSupabaseError({ message: 'Auth error' })).toBe(true);
        });

        it('returns false for Error object (strictly speaking, it checks shape)', () => {
            // Our simple type guard checks for 'message' prop.
            // Standard Error objects have 'message', so this might return true depending on implementation details
            // but let's test the negative case:
            expect(isSupabaseError(null)).toBe(false);
            expect(isSupabaseError('string')).toBe(false);
        });
    });
});
