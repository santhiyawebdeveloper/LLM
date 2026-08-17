import { describe, it, expect, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import { Store } from '../models/Store.js';
import { Course, CourseStatus } from '../models/Course.js';
import { Student } from '../models/Student.js';
import { Enrollment, EnrollmentStatus } from '../models/Enrollment.js';
import { CourseService } from '../services/courseService.js';
import { StudentService } from '../services/studentService.js';
import { EnrollmentService } from '../services/enrollmentService.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';

async function createTestStore(suffix = 'a') {
  return Store.create({
    shopDomain: `store-${suffix}.myshopify.com`,
    shopName: `Store ${suffix.toUpperCase()}`,
    shopifyAccessToken: `token-${suffix}`,
    scopes: 'read_products',
  });
}

describe('CourseService', () => {
  let storeId: Types.ObjectId;

  beforeEach(async () => {
    const store = await createTestStore();
    storeId = store._id;
  });

  it('creates a course with valid data', async () => {
    const course = await CourseService.create(storeId, {
      title: 'Intro to Shopify',
      description: 'Learn Shopify basics',
      instructorName: 'Jane Doe',
      category: 'E-commerce',
      duration: 10,
      status: CourseStatus.ACTIVE,
    });

    expect(course.title).toBe('Intro to Shopify');
    expect(course.storeId.toString()).toBe(storeId.toString());
  });

  it('rejects invalid course data at model level', async () => {
    await expect(
      Course.create({
        storeId,
        title: 'Test',
        description: 'Desc',
        instructorName: 'Inst',
        category: 'Cat',
        duration: -1,
      })
    ).rejects.toThrow();
  });

  it('retrieves course scoped to store', async () => {
    const created = await CourseService.create(storeId, {
      title: 'GraphQL Course',
      description: 'API course',
      instructorName: 'John',
      category: 'Dev',
      duration: 5,
    });

    const found = await CourseService.findById(storeId, created._id.toString());
    expect(found.title).toBe('GraphQL Course');
  });

  it('returns not found for wrong store', async () => {
    const otherStore = await createTestStore('b');
    const course = await CourseService.create(storeId, {
      title: 'Private Course',
      description: 'Desc',
      instructorName: 'Inst',
      category: 'Cat',
      duration: 3,
    });

    await expect(
      CourseService.findById(otherStore._id, course._id.toString())
    ).rejects.toThrow(NotFoundError);
  });

  it('deletes course when no enrollments exist', async () => {
    const course = await CourseService.create(storeId, {
      title: 'Deletable Course',
      description: 'Desc',
      instructorName: 'Inst',
      category: 'Cat',
      duration: 3,
    });

    await CourseService.delete(storeId, course._id.toString());

    await expect(
      CourseService.findById(storeId, course._id.toString())
    ).rejects.toThrow(NotFoundError);
  });

  it('blocks delete when course has enrollments', async () => {
    const student = await StudentService.create(storeId, {
      name: 'Enrolled Student',
      email: 'enrolled@test.com',
    });
    const course = await CourseService.create(storeId, {
      title: 'Course With Enrollments',
      description: 'Desc',
      instructorName: 'Inst',
      category: 'Cat',
      duration: 3,
    });

    await EnrollmentService.create(storeId, {
      studentId: student._id.toString(),
      courseId: course._id.toString(),
    });

    await expect(
      CourseService.delete(storeId, course._id.toString())
    ).rejects.toThrow(ConflictError);

    const stillExists = await CourseService.findById(storeId, course._id.toString());
    expect(stillExists.title).toBe('Course With Enrollments');
  });

  it('updates course successfully', async () => {
    const course = await CourseService.create(storeId, {
      title: 'Original Title',
      description: 'Desc',
      instructorName: 'Inst',
      category: 'Cat',
      duration: 5,
      status: CourseStatus.ACTIVE,
    });

    const updated = await CourseService.update(storeId, course._id.toString(), {
      title: 'Updated Title',
      status: CourseStatus.INACTIVE,
    });

    expect(updated.title).toBe('Updated Title');
    expect(updated.status).toBe(CourseStatus.INACTIVE);
  });

  it('rejects invalid course update data', async () => {
    const course = await CourseService.create(storeId, {
      title: 'Valid Course',
      description: 'Desc',
      instructorName: 'Inst',
      category: 'Cat',
      duration: 5,
    });

    await expect(
      Course.findOneAndUpdate(
        { _id: course._id, storeId },
        { $set: { duration: -1 } },
        { runValidators: true }
      )
    ).rejects.toThrow();
  });

  it('prevents cross-tenant course update', async () => {
    const otherStore = await createTestStore('update-other');
    const course = await CourseService.create(storeId, {
      title: 'Protected Course',
      description: 'Desc',
      instructorName: 'Inst',
      category: 'Cat',
      duration: 5,
    });

    await expect(
      CourseService.update(otherStore._id, course._id.toString(), {
        title: 'Hacked Title',
      })
    ).rejects.toThrow(NotFoundError);

    const unchanged = await CourseService.findById(storeId, course._id.toString());
    expect(unchanged.title).toBe('Protected Course');
  });
});

describe('StudentService', () => {
  let storeId: Types.ObjectId;

  beforeEach(async () => {
    const store = await createTestStore();
    storeId = store._id;
  });

  it('creates a student with normalized email', async () => {
    const student = await StudentService.create(storeId, {
      name: 'Alice Smith',
      email: 'Alice@Example.com',
    });

    expect(student.email).toBe('alice@example.com');
  });

  it('prevents duplicate email within same store', async () => {
    await StudentService.create(storeId, { name: 'Bob', email: 'bob@test.com' });

    await expect(
      StudentService.create(storeId, { name: 'Bob 2', email: 'bob@test.com' })
    ).rejects.toThrow(ConflictError);
  });

  it('allows same email in different stores', async () => {
    const storeB = await createTestStore('b');
    await StudentService.create(storeId, { name: 'Charlie', email: 'charlie@test.com' });
    const studentB = await StudentService.create(storeB._id, {
      name: 'Charlie',
      email: 'charlie@test.com',
    });

    expect(studentB.email).toBe('charlie@test.com');
  });
});

describe('EnrollmentService', () => {
  let storeId: Types.ObjectId;
  let studentId: string;
  let courseId: string;

  beforeEach(async () => {
    const store = await createTestStore();
    storeId = store._id;

    const student = await StudentService.create(storeId, {
      name: 'Student One',
      email: 'student1@test.com',
    });
    studentId = student._id.toString();

    const course = await CourseService.create(storeId, {
      title: 'Active Course',
      description: 'Desc',
      instructorName: 'Inst',
      category: 'Cat',
      duration: 8,
      status: CourseStatus.ACTIVE,
    });
    courseId = course._id.toString();
  });

  it('creates enrollment successfully', async () => {
    const enrollment = await EnrollmentService.create(storeId, { studentId, courseId });
    expect(enrollment.status).toBe(EnrollmentStatus.IN_PROGRESS);
  });

  it('prevents duplicate enrollment at service layer', async () => {
    await EnrollmentService.create(storeId, { studentId, courseId });

    await expect(
      EnrollmentService.create(storeId, { studentId, courseId })
    ).rejects.toThrow(ConflictError);
  });

  it('prevents duplicate enrollment at database layer', async () => {
    await Enrollment.create({
      storeId,
      studentId,
      courseId,
      status: EnrollmentStatus.IN_PROGRESS,
    });

    await expect(
      EnrollmentService.create(storeId, { studentId, courseId })
    ).rejects.toThrow(ConflictError);
  });

  it('rejects enrollment in inactive course', async () => {
    const inactive = await CourseService.create(storeId, {
      title: 'Inactive Course',
      description: 'Desc',
      instructorName: 'Inst',
      category: 'Cat',
      duration: 4,
      status: CourseStatus.INACTIVE,
    });

    await expect(
      EnrollmentService.create(storeId, {
        studentId,
        courseId: inactive._id.toString(),
      })
    ).rejects.toThrow();
  });

  it('updates enrollment status', async () => {
    const enrollment = await EnrollmentService.create(storeId, { studentId, courseId });
    const updated = await EnrollmentService.updateStatus(
      storeId,
      enrollment._id.toString(),
      { status: EnrollmentStatus.COMPLETED }
    );

    expect(updated.status).toBe(EnrollmentStatus.COMPLETED);
  });

  it('enforces tenant isolation on enrollment lookup', async () => {
    const enrollment = await EnrollmentService.create(storeId, { studentId, courseId });
    const otherStore = await createTestStore('other');

    await expect(
      EnrollmentService.findById(otherStore._id, enrollment._id.toString())
    ).rejects.toThrow(NotFoundError);
  });

  it('handles concurrent duplicate enrollment via unique index', async () => {
    const results = await Promise.allSettled([
      EnrollmentService.create(storeId, { studentId, courseId }),
      EnrollmentService.create(storeId, { studentId, courseId }),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(ConflictError);
  });
});

describe('Tenant Isolation', () => {
  it('store A cannot access store B courses', async () => {
    const storeA = await createTestStore('a');
    const storeB = await createTestStore('b');

    const courseA = await CourseService.create(storeA._id, {
      title: 'Store A Course',
      description: 'Desc',
      instructorName: 'Inst',
      category: 'Cat',
      duration: 5,
    });

    const { courses } = await CourseService.findAll(storeB._id, {
      page: 1,
      limit: 20,
      skip: 0,
    });

    expect(courses).toHaveLength(0);

    await expect(
      CourseService.findById(storeB._id, courseA._id.toString())
    ).rejects.toThrow(NotFoundError);
  });
});

describe('DashboardService', () => {
  it('returns counts scoped to authenticated store only', async () => {
    const { DashboardService } = await import('../services/dashboardService.js');
    const storeA = await createTestStore('dash-a');
    const storeB = await createTestStore('dash-b');

    await CourseService.create(storeA._id, {
      title: 'A Course',
      description: 'Desc',
      instructorName: 'Inst',
      category: 'Cat',
      duration: 5,
    });
    await CourseService.create(storeB._id, {
      title: 'B Course',
      description: 'Desc',
      instructorName: 'Inst',
      category: 'Cat',
      duration: 5,
    });

    const summaryA = await DashboardService.getSummary(storeA._id);
    const summaryB = await DashboardService.getSummary(storeB._id);

    expect(summaryA.totalCourses).toBe(1);
    expect(summaryB.totalCourses).toBe(1);
  });
});

describe('StoreService uninstall cleanup', () => {
  it('removes all LMS data for a store on uninstall', async () => {
    const { StoreService } = await import('../services/storeService.js');
    const store = await createTestStore('uninstall');

    await CourseService.create(store._id, {
      title: 'Temp Course',
      description: 'Desc',
      instructorName: 'Inst',
      category: 'Cat',
      duration: 2,
    });
    await StudentService.create(store._id, { name: 'Temp', email: 'temp@test.com' });

    await StoreService.removeByShopDomain(store.shopDomain);

    const remainingCourses = await Course.countDocuments({ storeId: store._id });
    const remainingStudents = await Student.countDocuments({ storeId: store._id });
    const remainingStore = await Store.findOne({ shopDomain: store.shopDomain });

    expect(remainingCourses).toBe(0);
    expect(remainingStudents).toBe(0);
    expect(remainingStore).toBeNull();
  });
});

describe('Authentication', () => {
  it('rejects unauthenticated context when store is missing', async () => {
    const { UnauthorizedError } = await import('../utils/errors.js');
    const { getAuthContext } = await import('../middleware/auth.js');
    const { Request } = await import('express');

    expect(() => getAuthContext({} as import('express').Request)).toThrow(UnauthorizedError);
  });
});

describe('ShopifyService error handling', () => {
  it('throws ShopifyApiError when store token is missing', async () => {
    const { ShopifyService } = await import('../services/shopifyService.js');
    const { ShopifyApiError } = await import('../utils/errors.js');

    await expect(
      ShopifyService.getShopInfo('nonexistent.myshopify.com')
    ).rejects.toThrow(ShopifyApiError);
  });
});
