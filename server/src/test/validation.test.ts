import { describe, it, expect } from 'vitest';
import { isValidObjectId } from '../utils/apiResponse.js';

describe('ObjectId validation utility', () => {
  it('accepts valid ObjectId strings', () => {
    expect(isValidObjectId('507f1f77bcf86cd799439011')).toBe(true);
  });

  it('rejects invalid ObjectId strings', () => {
    expect(isValidObjectId('not-an-id')).toBe(false);
    expect(isValidObjectId('123')).toBe(false);
    expect(isValidObjectId('')).toBe(false);
  });
});
