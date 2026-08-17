import { Frame, Navigation, TopBar } from '@shopify/polaris';
import { useState, useCallback } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  HomeIcon,
  ProductIcon,
  PersonIcon,
  OrderIcon,
  StoreIcon,
} from '@shopify/polaris-icons';

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavigationActive, setMobileNavigationActive] = useState(false);

  const toggleMobileNavigation = useCallback(
    () => setMobileNavigationActive((active) => !active),
    []
  );

  const navigationMarkup = (
    <Navigation location={location.pathname}>
      <Navigation.Section
        items={[
          {
            label: 'Dashboard',
            icon: HomeIcon,
            onClick: () => navigate('/dashboard'),
            selected: location.pathname === '/dashboard',
          },
          {
            label: 'Courses',
            icon: ProductIcon,
            onClick: () => navigate('/courses'),
            selected: location.pathname.startsWith('/courses'),
          },
          {
            label: 'Students',
            icon: PersonIcon,
            onClick: () => navigate('/students'),
            selected: location.pathname.startsWith('/students'),
          },
          {
            label: 'Enrollments',
            icon: OrderIcon,
            onClick: () => navigate('/enrollments'),
            selected: location.pathname.startsWith('/enrollments'),
          },
        ]}
      />
      <Navigation.Section
        title="Shopify"
        items={[
          {
            label: 'Store Information',
            icon: StoreIcon,
            onClick: () => navigate('/shopify/store'),
            selected: location.pathname === '/shopify/store',
          },
          {
            label: 'Products',
            icon: ProductIcon,
            onClick: () => navigate('/shopify/products'),
            selected: location.pathname === '/shopify/products',
          },
        ]}
      />
    </Navigation>
  );

  const topBarMarkup = (
    <TopBar
      showNavigationToggle
      onNavigationToggle={toggleMobileNavigation}
    />
  );

  return (
    <Frame
      topBar={topBarMarkup}
      navigation={navigationMarkup}
      showMobileNavigation={mobileNavigationActive}
      onNavigationDismiss={toggleMobileNavigation}
    >
      <Outlet />
    </Frame>
  );
}
