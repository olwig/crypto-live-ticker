import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'

function symbolIndex() {
  return{
    name: 'symbol-index',
    transform(code, id) {
      if (id.endsWith('lib/symbolIndex.js')) {
        const dir = path.resolve('public/symbols');
        const files = fs.readdirSync(dir)
          .filter(f => f.endsWith('.png'))
          .map(f => f.replace('.png', '').toUpperCase());

        console.log(dir);
        console.log(files);
        
        return code.replace(
          'const symbols = JSON.parse(\'[]\');',
          `const symbols = JSON.parse('${JSON.stringify(files)}');`
        );
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true,
  },
  plugins: [
    svelte(),
    symbolIndex()
  ],
})
