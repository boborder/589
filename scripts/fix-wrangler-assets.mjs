import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const wranglerPath = join('dist', 'app', 'wrangler.json');

if (existsSync(wranglerPath)) {
  const config = JSON.parse(readFileSync(wranglerPath, 'utf8'));
  config.assets = { directory: './assets' };
  writeFileSync(wranglerPath, JSON.stringify(config, null, 2));
  console.log('✅ Fixed assets.directory in dist/app/wrangler.json');
} else {
  console.warn('⚠️  dist/app/wrangler.json not found');
}


