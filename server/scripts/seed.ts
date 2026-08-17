import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDatabase } from '../src/config/database.js';
import { Store } from '../src/models/Store.js';
import { Course, CourseStatus } from '../src/models/Course.js';
import { Student } from '../src/models/Student.js';
import { Enrollment, EnrollmentStatus } from '../src/models/Enrollment.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SEED_SHOP_DOMAIN = process.env.SEED_SHOP_DOMAIN;

async function seed() {
  if (!SEED_SHOP_DOMAIN) {
    console.error('SEED_SHOP_DOMAIN is required. Example:');
    console.error('  SEED_SHOP_DOMAIN=your-store.myshopify.com npm run seed');
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production') {
    console.error('Refusing to seed in production. Set NODE_ENV=development for local demo data.');
    process.exit(1);
  }

  await connectDatabase();

  const store = await Store.findOne({ shopDomain: SEED_SHOP_DOMAIN.toLowerCase() });
  if (!store) {
    console.error(
      `No store found for "${SEED_SHOP_DOMAIN}". Install the app on that store first, then run seed again.`
    );
    process.exit(1);
  }

  const storeId = store._id;

  await Promise.all([
    Enrollment.deleteMany({ storeId }),
    Course.deleteMany({ storeId }),
    Student.deleteMany({ storeId }),
  ]);

  const courses = await Course.insertMany([
    {
      storeId,
      title: 'React Fundamentals',
      description: 'Learn React components, hooks, and state management.',
      instructorName: 'Jane Doe',
      category: 'Frontend',
      duration: 20,
      status: CourseStatus.ACTIVE,
    },
    {
      storeId,
      title: 'Node.js API Development',
      description: 'Build REST APIs with Express, validation, and MongoDB.',
      instructorName: 'John Smith',
      category: 'Backend',
      duration: 24,
      status: CourseStatus.ACTIVE,
    },
    {
      storeId,
      title: 'Shopify App Development',
      description: 'Create embedded Shopify apps with OAuth and Admin GraphQL.',
      instructorName: 'Alex Chen',
      category: 'Shopify',
      duration: 30,
      status: CourseStatus.ACTIVE,
    },
  ]);

  const students = await Student.insertMany([
    { storeId, name: 'Demo Student One', email: 'demo.student.one@example.com' },
    { storeId, name: 'Demo Student Two', email: 'demo.student.two@example.com' },
    { storeId, name: 'Demo Student Three', email: 'demo.student.three@example.com' },
  ]);

  const now = Date.now();
  await Enrollment.insertMany([
    {
      storeId,
      studentId: students[0]._id,
      courseId: courses[0]._id,
      status: EnrollmentStatus.IN_PROGRESS,
      enrollmentDate: new Date(now - 2 * 24 * 60 * 60 * 1000),
    },
    {
      storeId,
      studentId: students[0]._id,
      courseId: courses[2]._id,
      status: EnrollmentStatus.COMPLETED,
      enrollmentDate: new Date(now - 10 * 24 * 60 * 60 * 1000),
    },
    {
      storeId,
      studentId: students[1]._id,
      courseId: courses[1]._id,
      status: EnrollmentStatus.IN_PROGRESS,
      enrollmentDate: new Date(now - 1 * 24 * 60 * 60 * 1000),
    },
    {
      storeId,
      studentId: students[2]._id,
      courseId: courses[0]._id,
      status: EnrollmentStatus.COMPLETED,
      enrollmentDate: new Date(now - 5 * 24 * 60 * 60 * 1000),
    },
    {
      storeId,
      studentId: students[2]._id,
      courseId: courses[2]._id,
      status: EnrollmentStatus.IN_PROGRESS,
      enrollmentDate: new Date(now - 3 * 60 * 60 * 1000),
    },
  ]);

  console.log(`Seeded demo data for store: ${store.shopDomain}`);
  console.log(`  Courses: ${courses.length}`);
  console.log(`  Students: ${students.length}`);
  console.log('  Enrollments: 5 (mix of IN_PROGRESS and COMPLETED)');

  process.exit(0);
}

seed().catch((error) => {
  console.error('Seed failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
