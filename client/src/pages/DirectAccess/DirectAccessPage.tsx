import { useEffect, useState } from 'react';
import {
  Page,
  Card,
  BlockStack,
  Text,
  List,
  Link,
  TextField,
  Button,
  Banner,
} from '@shopify/polaris';
import {
  getShopifyAdminAppUrl,
  normalizeShopDomain,
} from '../../utils/shopifyContext';

const APP_URL = import.meta.env.PROD
  ? 'https://shopify-lms-three.vercel.app'
  : window.location.origin;

const API_KEY = import.meta.env.VITE_SHOPIFY_API_KEY;

export function DirectAccessPage() {
  const [shopInput, setShopInput] = useState('');
  const [shopError, setShopError] = useState<string | undefined>();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shop = params.get('shop');
    if (shop && normalizeShopDomain(shop) && API_KEY) {
      window.location.replace(getShopifyAdminAppUrl(normalizeShopDomain(shop)!, API_KEY));
    }
  }, []);

  const handleInstall = () => {
    const shop = normalizeShopDomain(shopInput);
    if (!shop) {
      setShopError('Enter a valid store domain, e.g. your-store.myshopify.com');
      return;
    }

    setShopError(undefined);
    window.location.assign(`${APP_URL}/api/auth?shop=${encodeURIComponent(shop)}`);
  };

  return (
    <Page title="Shopify LMS">
      <BlockStack gap="400">
        <Banner tone="info" title="Install from your Shopify store">
          <p>
            This page is shown when the app URL is opened directly in a browser.
            To use LMS, install the app on your development store, then open it
            from <Text as="span" fontWeight="semibold">Shopify Admin → Apps → LMS</Text>.
          </p>
        </Banner>

        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Install the app
            </Text>
            <Text as="p" variant="bodyMd">
              Enter your Shopify development store domain and click Install.
              You will be redirected to Shopify to approve permissions.
            </Text>
            <TextField
              label="Store domain"
              value={shopInput}
              onChange={(value) => {
                setShopInput(value);
                if (shopError) {
                  setShopError(undefined);
                }
              }}
              placeholder="your-store.myshopify.com"
              autoComplete="off"
              error={shopError}
              helpText="Use the .myshopify.com domain from your Partner development store."
            />
            <Button variant="primary" onClick={handleInstall}>
              Install app
            </Button>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              After installation
            </Text>
            <List type="number">
              <List.Item>
                Create a free{' '}
                <Link url="https://partners.shopify.com" external>
                  Shopify Partner account
                </Link>{' '}
                and a development store if you do not have one yet
              </List.Item>
              <List.Item>
                Complete the install flow above, or open this URL directly
                (replace <Text as="span" fontWeight="semibold">YOUR-STORE</Text>):
                <br />
                <Text as="span" variant="bodyMd" fontWeight="semibold">
                  {APP_URL}/api/auth?shop=YOUR-STORE.myshopify.com
                </Text>
              </List.Item>
              <List.Item>
                Open the embedded app from{' '}
                <Text as="span" fontWeight="semibold">Shopify Admin → Apps → LMS</Text>
              </List.Item>
            </List>
            <Text as="p" variant="bodySm" tone="subdued">
              Direct browser access cannot load store data. LMS APIs require a
              valid Shopify embedded session and are not publicly accessible.
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              Evaluators: see HR_EVALUATION.md in the repository for the complete test flow.
            </Text>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
