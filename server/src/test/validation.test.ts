import { describe, it, expect } from 'vitest';
import { isValidObjectId } from '../utils/apiResponse.js';
import { escapeRegex, buildSafeRegexFilter } from '../utils/escapeRegex.js';
import { isValidShopDomain, isValidShopifyHost } from '../utils/shopifyParams.js';
import {
  createCourseSchema,
  createStudentSchema,
  courseQuerySchema,
} from '../validators/index.js';

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

describe('escapeRegex utility', () => {
  const maliciousPatterns = ['.*', '[', ']', '(', ')', '+', '?', '^', '$', '\\'];

  it.each(maliciousPatterns)('escapes special character %s', (pattern) => {
    const escaped = escapeRegex(pattern);
    expect(escaped).not.toBe(pattern);
    expect(() => new RegExp(escaped)).not.toThrow();
  });

  it('buildSafeRegexFilter treats user input as literal text', () => {
    const filter = buildSafeRegexFilter('React (Advanced)');
    expect(filter.$regex).toBe('React \\(Advanced\\)');
    expect(filter.$options).toBe('i');
  });

  it('does not allow .* to match everything when escaped', () => {
    const filter = buildSafeRegexFilter('.*');
    expect(filter.$regex).toBe('\\.\\*');
  });
});

describe('shopify param validation', () => {
  it('accepts valid myshopify.com domains', () => {
    expect(isValidShopDomain('lms-development-store.myshopify.com')).toBe(true);
  });

  it('rejects invalid shop domains', () => {
    expect(isValidShopDomain('not-a-shop.com')).toBe(false);
    expect(isValidShopDomain('<script>')).toBe(false);
    expect(isValidShopDomain('')).toBe(false);
  });

  it('accepts valid host parameters', () => {
    expect(isValidShopifyHost('YWRtaW4uc2hvcGlmeS5jb20vc3RvcmUvZGV2')).toBe(true);
  });

  it('rejects invalid host parameters', () => {
    expect(isValidShopifyHost('')).toBe(false);
    expect(isValidShopifyHost('a'.repeat(513))).toBe(false);
  });
});

describe('Zod validation schemas', () => {
  it('rejects course title longer than 200 characters', () => {
    const result = createCourseSchema.safeParse({
      title: 'a'.repeat(201),
      description: 'Valid description',
      instructorName: 'Jane Doe',
      category: 'Frontend',
      duration: 10,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email for student', () => {
    const result = createStudentSchema.safeParse({
      name: 'Demo Student',
      email: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer duration', () => {
    const result = createCourseSchema.safeParse({
      title: 'Course',
      description: 'Description',
      instructorName: 'Jane',
      category: 'Cat',
      duration: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects search strings longer than 200 characters', () => {
    const result = courseQuerySchema.safeParse({ search: 'a'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('accepts valid course input', () => {
    const result = createCourseSchema.safeParse({
      title: 'React Fundamentals',
      description: 'Learn React',
      instructorName: 'Jane Doe',
      category: 'Frontend',
      duration: 20,
    });
    expect(result.success).toBe(true);
  });
});
