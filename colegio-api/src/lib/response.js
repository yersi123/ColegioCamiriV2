export function respond(res, status, success, data, message) {
  const body = JSON.stringify({ success, data, message });
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(body);
}
