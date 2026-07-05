const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// replace the export function apiPlugin() { ... configureServer(server) { with our startServer
const startStr = `export function apiPlugin() {
  return {
    name: 'api-plugin',
    configureServer(server: ViteDevServer) {`;

code = code.replace(startStr, `import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {`);

// replace the end of the plugin with our vite middleware and listen
const endStr = `      server.middlewares.use(app);
    }
  };
}`;

const newEndStr = `
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(\`Server running on port \${PORT}\`);
  });
}
startServer();
`;

code = code.replace(endStr, newEndStr);

fs.writeFileSync('server.ts', code);
console.log("Rewrote server.ts");
