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
  getShopifyManagedInstallUrl,
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
      setShopError('Enter a valid Partner development store, e.g. your-store.myshopify.com');
      return;
    }

    if (!API_KEY) {
      setShopError('App configuration is missing. Contact the developer.');
      return;
    }

    setShopError(undefined);
    window.location.assign(`${APP_URL}/install?shop=${encodeURIComponent(shop)}`);
  };

  return (
    <Page title="Shopify LMS">
      <BlockStack gap="400">
        <Banner tone="warning" title="Use your own Partner development store">
          <p>
            Install only on a development store you created in your Shopify Partner
            account. Restricted or special stores (for example security test stores)
            cannot install this app and will show <Text as="span" fontWeight="semibold">Unauthorized Access</Text>.
          </p>
        </Banner>

        <Banner tone="info" title="Install from your Shopify store">
          <p>
            After installation, always open the app from{' '}
            <Text as="span" fontWeight="semibold">Shopify Admin → Apps → LMS</Text>.
            Direct browser access to this URL cannot load store data.
          </p>
        </Banner>

        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Install the app
            </Text>
            <Text as="p" variant="bodyMd">
              Log in to your development store admin first, then enter your store
              domain and click Install. Shopify will handle permissions and redirect
              you back to Admin.
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
              helpText="Must be a development store from partners.shopify.com → Stores."
            />
            <Button variant="primary" onClick={handleInstall}>
              Install app
            </Button>
            {API_KEY && (
              <Text as="p" variant="bodySm" tone="subdued">
                Or open Shopify install directly:{' '}
                <Link url={getShopifyManagedInstallUrl(API_KEY)} external>
                  admin.shopify.com/oauth/install
                </Link>
              </Text>
            )}
          </BlockStack>
        </Card>

        <Card>
          <BlockStack gap="400">
            <Text as="h2" variant="headingMd">
              Step-by-step
            </Text>
            <List type="number">
              <List.Item>
                Create a free{' '}
                <Link url="https://partners.shopify.com" external>
                  Shopify Partner account
                </Link>{' '}
                and a development store (Partner Dashboard → Stores → Add store)
              </List.Item>
              <List.Item>
                Log in to that store admin:{' '}
                <Text as="span" fontWeight="semibold">https://YOUR-STORE.myshopify.com/admin</Text>
              </List.Item>
              <List.Item>
                Install using the form above, or this URL:
                <br />
                <Text as="span" variant="bodyMd" fontWeight="semibold">
                  {APP_URL}/install?shop=YOUR-STORE.myshopify.com
                </Text>
              </List.Item>
              <List.Item>
                Open <Text as="span" fontWeight="semibold">Shopify Admin → Apps → LMS</Text>
              </List.Item>
            </List>
            <Text as="p" variant="bodySm" tone="subdued">
              Evaluators: see HR_EVALUATION.md in the repository for the complete test flow.
            </Text>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
