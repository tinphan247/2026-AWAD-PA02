// Keep-alive helper for the Render free tier (PA#3).
// Usage: node scripts/keepalive.mjs https://<app>.onrender.com/healthz
// Run it from cron-job.org or a GitHub Actions schedule every 10 minutes.

const url = process.argv[2];
if (!url) {
  console.error('usage: node scripts/keepalive.mjs <healthz-url>');
  process.exit(2);
}

const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 15_000);

try {
  const res = await fetch(url, { signal: controller.signal });
  clearTimeout(timer);
  console.log(`${new Date().toISOString()} ${url} -> ${res.status}`);
  if (!res.ok) process.exit(1);
} catch (error) {
  clearTimeout(timer);
  console.error(`${new Date().toISOString()} ${url} -> ${error && error.message}`);
  process.exit(1);
}
