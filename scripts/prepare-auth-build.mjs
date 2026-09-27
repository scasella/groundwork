import {copyFileSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
// Preserve the existing Sites worker and packaging script; wrap their output.
copyFileSync(new URL('dist/server/index.js',root),new URL('dist/server/static.js',root));
copyFileSync(new URL('worker/chatgpt-auth.js',root),new URL('dist/server/chatgpt-auth.js',root));
writeFileSync(new URL('dist/server/index.js',root),`import staticWorker from './static.js';\nimport {accountResponse} from './chatgpt-auth.js';\nexport default {fetch(request,env,ctx){return accountResponse(request,env) ?? staticWorker.fetch(request,env,ctx);}};\n`);
console.log('Prepared optional Sites account endpoint. Authentication is disabled unless configured by the hosting runtime.');
