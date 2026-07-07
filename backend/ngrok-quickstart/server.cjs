const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`<!DOCTYPE html>
<html>
  <head><title>ngrok Quickstart</title></head>
  <body>
    <h1>Hello from ngrok! 🚀</h1>
    <p>Request received: <code>${req.method} ${req.url}</code></p>
    <p>Time: ${new Date().toISOString()}</p>
  </body>
</html>`);
});

server.listen(8080, () => {
  console.log('HTTP server running on http://localhost:8080');
});
