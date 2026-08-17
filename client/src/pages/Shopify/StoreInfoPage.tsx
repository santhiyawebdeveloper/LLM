import { Page, Card, BlockStack, Text, InlineGrid } from '@shopify/polaris';
import { useQuery } from '@tanstack/react-query';
import { shopifyApi } from '../../services/shopifyApi';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';

export function StoreInfoPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['shopify', 'shop'],
    queryFn: () => shopifyApi.getShop(),
  });

  if (isLoading) {
    return <Page title="Store Information"><LoadingState /></Page>;
  }

  if (isError || !data?.data) {
    return (
      <Page title="Store Information">
        <ErrorState message="Failed to load store information from Shopify" onRetry={() => refetch()} />
      </Page>
    );
  }

  const shop = data.data;

  return (
    <Page title="Store Information" subtitle="Retrieved from Shopify Admin GraphQL API">
      <Card>
        <BlockStack gap="400">
          <InlineGrid columns={2} gap="400">
            <BlockStack gap="200">
              <Text as="p" variant="bodySm" tone="subdued">Shop ID</Text>
              <Text as="p" variant="bodyMd">{shop.id}</Text>
            </BlockStack>
            <BlockStack gap="200">
              <Text as="p" variant="bodySm" tone="subdued">Shop Name</Text>
              <Text as="p" variant="bodyMd">{shop.name}</Text>
            </BlockStack>
            <BlockStack gap="200">
              <Text as="p" variant="bodySm" tone="subdued">Email</Text>
              <Text as="p" variant="bodyMd">{shop.email}</Text>
            </BlockStack>
            <BlockStack gap="200">
              <Text as="p" variant="bodySm" tone="subdued">MyShopify Domain</Text>
              <Text as="p" variant="bodyMd">{shop.myshopifyDomain}</Text>
            </BlockStack>
          </InlineGrid>
        </BlockStack>
      </Card>
    </Page>
  );
}
