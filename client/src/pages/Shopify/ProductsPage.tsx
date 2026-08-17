import { Page, Card, IndexTable } from '@shopify/polaris';
import { useQuery } from '@tanstack/react-query';
import { shopifyApi } from '../../services/shopifyApi';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { StatusBadge } from '../../components/StatusBadge';

export function ProductsPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['shopify', 'products'],
    queryFn: () => shopifyApi.getProducts(),
  });

  if (isLoading) {
    return <Page title="Shopify Products"><LoadingState /></Page>;
  }

  if (isError) {
    return (
      <Page title="Shopify Products">
        <ErrorState message="Failed to load products from Shopify" onRetry={() => refetch()} />
      </Page>
    );
  }

  const products = data?.data || [];

  return (
    <Page title="Shopify Products" subtitle="Retrieved from Shopify Admin GraphQL API">
      {products.length === 0 ? (
        <EmptyState
          heading="No products found"
          description="Your Shopify store has no products yet."
        />
      ) : (
        <Card padding="0">
          <IndexTable
            resourceName={{ singular: 'product', plural: 'products' }}
            itemCount={products.length}
            headings={[
              { title: 'ID' },
              { title: 'Title' },
              { title: 'Status' },
            ]}
            selectable={false}
          >
            {products.map((product, index) => (
              <IndexTable.Row id={product.id} key={product.id} position={index}>
                <IndexTable.Cell>{product.id}</IndexTable.Cell>
                <IndexTable.Cell>{product.title}</IndexTable.Cell>
                <IndexTable.Cell><StatusBadge status={product.status} /></IndexTable.Cell>
              </IndexTable.Row>
            ))}
          </IndexTable>
        </Card>
      )}
    </Page>
  );
}
