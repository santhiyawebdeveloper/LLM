import dns from 'dns';

// Must run before MongoDB driver performs DNS lookups on Windows.
if (process.platform === 'win32' && process.env.NODE_ENV !== 'test') {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1']);
  dns.setDefaultResultOrder('ipv4first');
}
