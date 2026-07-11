export class Router {
  constructor() {
    this.routes = [];
    this.prefix = '';
  }

  group(prefix) {
    const sub = new Router();
    sub.prefix = this.prefix + prefix;
    return sub;
  }

  get(path, handler) { this.add('GET', path, handler); }
  post(path, handler) { this.add('POST', path, handler); }
  put(path, handler) { this.add('PUT', path, handler); }
  delete(path, handler) { this.add('DELETE', path, handler); }

  add(method, path, handler) {
    const fullPath = this.prefix + path;
    const paramNames = [];
    const pattern = fullPath.replace(/:(\w+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });
    this.routes.push({
      method,
      pattern: new RegExp(`^${pattern}$`),
      paramNames,
      handler,
    });
  }

  async resolve(req, res) {
    const method = req.method?.toUpperCase() ?? 'GET';
    const url = req.url ?? '/';
    const path = url.split('?')[0];

    for (const route of this.routes) {
      if (route.method !== method) continue;
      const match = path.match(route.pattern);
      if (!match) continue;

      const params = {};
      route.paramNames.forEach((name, i) => {
        params[name] = decodeURIComponent(match[i + 1]);
      });

      await route.handler(req, res, params);
      return true;
    }
    return false;
  }
}
