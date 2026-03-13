import { createServer as createHttpServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import { readFileSync } from 'fs';
import { WebSocketServer } from 'ws';
import net from 'net';

const PG_HOST = process.env.PG_PROXY_HOST || 'localhost';
const PG_PORT = parseInt(process.env.PG_PROXY_PORT || '5432', 10);
const WS_PORT = parseInt(process.env.WS_PROXY_PORT || '443', 10);
const TLS_KEY = process.env.WS_PROXY_KEY || '/tmp/ws-proxy-key.pem';
const TLS_CERT = process.env.WS_PROXY_CERT || '/tmp/ws-proxy-cert.pem';

let server;
try {
  const key = readFileSync(TLS_KEY);
  const cert = readFileSync(TLS_CERT);
  server = createHttpsServer({ key, cert });
  console.log(`WSS (TLS) proxy mode`);
} catch {
  server = createHttpServer();
  console.log(`WS (plain) proxy mode`);
}

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  const pg = net.createConnection(PG_PORT, PG_HOST);

  pg.on('connect', () => {
    ws.on('message', (data) => {
      if (pg.writable) pg.write(Buffer.from(data));
    });
  });

  pg.on('data', (data) => {
    if (ws.readyState === 1) ws.send(data);
  });

  ws.on('close', () => pg.destroy());
  pg.on('close', () => { if (ws.readyState < 2) ws.close(); });
  pg.on('error', (e) => { console.error('PG error:', e.message); if (ws.readyState < 2) ws.close(); });
  ws.on('error', (e) => { console.error('WS error:', e.message); pg.destroy(); });
});

server.listen(WS_PORT, () => {
  console.log(`WS→PG proxy: wss://localhost:${WS_PORT} → ${PG_HOST}:${PG_PORT}`);
});
