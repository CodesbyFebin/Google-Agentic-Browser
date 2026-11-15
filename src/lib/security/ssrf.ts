/** Conservative HTTPS-only, IPv4-pinned text fetcher. NOT exposed as a tool or route. */
import { lookup } from 'node:dns/promises';
import https from 'node:https';
import net from 'node:net';

const blocked = new net.BlockList();
for (const [address, prefix] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24],
  ['192.0.2.0', 24], ['192.88.99.0', 24], ['192.168.0.0', 16],
  ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24],
  ['224.0.0.0', 4], ['240.0.0.0', 4],
] as const) blocked.addSubnet(address, prefix, 'ipv4');

export function isPublicIPv4(address: string): boolean {
  return net.isIP(address) === 4 && !blocked.check(address, 'ipv4');
}

export async function safeFetchText(rawUrl: string, maxBytes = 250_000): Promise<string> {
  if (rawUrl.length > 2048 || maxBytes < 1 || maxBytes > 500_000) throw new Error('Invalid fetch limits.');
  const url = new URL(rawUrl);
  if (url.protocol !== 'https:' || url.port && url.port !== '443') throw new Error('Only HTTPS on port 443 is permitted.');
  if (url.username || url.password) throw new Error('URL credentials are prohibited.');
  const host = url.hostname.toLowerCase();
  if (net.isIP(host) === 6 || host === 'localhost' || host.endsWith('.local')
      || host.endsWith('.internal') || host.endsWith('.localhost')) {
    throw new Error('Target host is blocked.');
  }
  const addresses = net.isIP(host) === 4
    ? [{ address: host, family: 4 }]
    : await lookup(host, { all: true, family: 4 });
  if (!addresses.length || addresses.some(item => !isPublicIPv4(item.address))) {
    throw new Error('Target does not resolve exclusively to public IPv4 addresses.');
  }
  const pinned = addresses[0].address;
  return new Promise<string>((resolve, reject) => {
    let settled = false;
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    const req = https.request(url, {
      method: 'GET', agent: false, timeout: 8000,
      headers: { Accept: 'text/html,text/plain', 'User-Agent': 'GoogleAgenticBrowser-Prototype/1.0' },
      // Preserve original hostname for TLS certificate verification and Host header.
      lookup: (_hostname, _options, callback) => callback(null, pinned, 4),
    }, res => {
      if ((res.statusCode ?? 0) < 200 || (res.statusCode ?? 0) >= 300) {
        res.resume(); fail(new Error('Non-success response or redirect blocked.')); return;
      }
      const type = String(res.headers['content-type'] || '').toLowerCase();
      if (!type.startsWith('text/plain') && !type.startsWith('text/html')) {
        res.resume(); fail(new Error('Only plain text and HTML are supported.')); return;
      }
      let bytes = 0;
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => {
        bytes += chunk.length;
        if (bytes > maxBytes) {
          fail(new Error('Response exceeds the byte limit.'));
          res.destroy();
          return;
        }
        chunks.push(chunk);
      });
      res.on('end', () => {
        if (settled) return;
        settled = true;
        const body = Buffer.concat(chunks).toString('utf8');
        resolve(type.startsWith('text/html')
          ? body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
            .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
            .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
          : body);
      });
      res.on('error', fail);
    });
    req.on('timeout', () => req.destroy(new Error('Fetch timed out.')));
    req.on('error', fail);
    req.end();
  });
}
