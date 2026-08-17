import { Page, Card, BlockStack, Text, List, Link } from '@shopify/polaris';

const APP_URL = import.meta.env.PROD
  ? 'https://shopify-lms-three.vercel.app'
  : window.location.origin;

export function DirectAccessPage() {
  return (
    <Page title="Shopify LMS">
      <Card>
        <BlockStack gap="400">
          <Text as="h2" variant="headingMd">
            Open from Shopify Admin
          </Text>
          <Text as="p" variant="bodyMd">
            This application must be opened from Shopify Admin. Please install the Shopify LMS
            app and launch it from the Shopify Admin Apps section.
          </Text>
          <Text as="p" variant="bodyMd" tone="subdued">
            Direct browser access to this URL cannot load store data. LMS APIs require a valid
            Shopify embedded session and are not publicly accessible.
          </Text>
          <BlockStack gap="200">
            <Text as="h3" variant="headingSm">
              How to install and open the app
            </Text>
            <List type="number">
              <List.Item>
                Create a free{' '}
                <Link url="https://partners.shopify.com" external>
                  Shopify Partner account
                </Link>{' '}
                and a development store
              </List.Item>
              <List.Item>
                Install the app using your store domain:
                <br />
                <Text as="span" variant="bodyMd" fontWeight="semibold">
                  {APP_URL}/api/auth?shop=YOUR-STORE.myshopify.com
                </Text>
              </List.Item>
              <List.Item>
                After installation, open{' '}
                <Text as="span" fontWeight="semibold">Shopify Admin → Apps → LMS</Text>
              </List.Item>
            </List>
          </BlockStack>
          <Text as="p" variant="bodySm" tone="subdued">
            Evaluators: see HR_EVALUATION.md in the repository for the complete test flow.
          </Text>
        </BlockStack>
      </Card>
    </Page>
  );
}
