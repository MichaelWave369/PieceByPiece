import {defineConfig} from 'vite';
import {resolve} from 'node:path';

// Build all campaign destinations into the same static GitHub Pages artifact.
// The default relative base still works for local downloadable bundles.
export default defineConfig({
 base:'./',
 build:{
  rollupOptions:{
   input:{
    main:resolve('index.html'),
    atlas:resolve('districts.html'),
    harbor:resolve('harbor.html'),
    verdantia:resolve('verdantia.html'),
    ironhaven:resolve('ironhaven.html'),
    citadel:resolve('citadel.html'),
    commons:resolve('commons.html')
   }
  }
 }
});
