import { URL } from 'url';

export function getQuery(req) {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const params = {};
  url.searchParams.forEach((v, k) => { params[k] = v; });
  return params;
}

export function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString();
      if (!raw) return resolve(undefined);
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('JSON inválido'));
      }
    });
    req.on('error', reject);
  });
}
