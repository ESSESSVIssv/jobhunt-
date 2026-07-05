const fs = require('fs');
let code = fs.readFileSync('vite.config.ts', 'utf8');

code = code.replace("import { apiPlugin } from './src/server/api';", "");
code = code.replace("apiPlugin(),", "");

fs.writeFileSync('vite.config.ts', code);
console.log("Rewrote vite.config.ts");
