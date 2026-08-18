import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { DirectAccessPage } from '../pages/DirectAccess/DirectAccessPage';
import { getShopFromUrl, getShopifyAdminAppUrl, isShopifyEmbedded } from '../utils/shopifyContext';
import { DashboardPage } from '../pages/Dashboard/DashboardPage';
import { CoursesPage } from '../pages/Courses/CoursesPage';
import { CourseDetailPage } from '../pages/Courses/CourseDetailPage';
import { StudentsPage } from '../pages/Students/StudentsPage';
import { StudentDetailPage } from '../pages/Students/StudentDetailPage';
import { StudentDashboardPage } from '../pages/StudentDashboard/StudentDashboardPage';
import { EnrollmentsPage } from '../pages/Enrollments/EnrollmentsPage';
import { StoreInfoPage } from '../pages/Shopify/StoreInfoPage';
import { ProductsPage } from '../pages/Shopify/ProductsPage';

export function AppRoutes() {
  if (import.meta.env.PROD && !isShopifyEmbedded()) {
    const shop = getShopFromUrl();
    const apiKey = import.meta.env.VITE_SHOPIFY_API_KEY;

    if (shop && apiKey) {
      window.location.replace(getShopifyAdminAppUrl(shop, apiKey));
      return null;
    }

    return (
      <Routes>
        <Route path="*" element={<DirectAccessPage />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="courses/:id" element={<CourseDetailPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="students/:studentId/dashboard" element={<StudentDashboardPage />} />
        <Route path="students/:id" element={<StudentDetailPage />} />
        <Route path="enrollments" element={<EnrollmentsPage />} />
        <Route path="shopify/store" element={<StoreInfoPage />} />
        <Route path="shopify/products" element={<ProductsPage />} />
      </Route>
    </Routes>
  );
}
