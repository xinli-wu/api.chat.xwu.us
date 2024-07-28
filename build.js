// build.js
import { build } from 'esbuild';

build({
  entryPoints: ['src/index.js'],  // Adjust the entry point as needed
  outfile: 'dist/bundle.cjs',     // Output file
  bundle: true,                   // Bundle all dependencies
  platform: 'node',               // Platform is node for Node.js apps
  target: ['es2020'],             // Target ES2020 for BigInt support
  format: 'cjs',                  // Output format CommonJS
  external: ['express'],          // Exclude external dependencies (e.g., express)
  sourcemap: true,                // Generate source maps (optional)
  minify: true,
}).then(() => {
  console.log('Build succeeded');
}).catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});