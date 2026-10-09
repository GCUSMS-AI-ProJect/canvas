"""Loopback-only development server. Production must supply real authentication."""
from functools import partial
from contextlib import contextmanager
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse
import json
import secrets
import sqlite3
import time
from urllib.parse import urlsplit
from share_draw import DrawJobs, DrawError

ROOT = Path(__file__).resolve().parents[1]
USER = {'id': 'local-developer', 'role': 'admin', 'nickname': 'Local developer',
        'username': 'local-developer', 'email': '', 'avatar': ''}


class Store:
    def __init__(self, state):
        self.state = Path(state)
        self.state.mkdir(parents=True, exist_ok=True)
        with self.connect() as db:
            db.execute('''CREATE TABLE IF NOT EXISTS users(
                id TEXT PRIMARY KEY, nickname TEXT, username TEXT, email TEXT,
                avatar TEXT, role TEXT, disabled INTEGER, created REAL)''')
            db.execute('INSERT OR IGNORE INTO users VALUES(?,?,?,?,?,?,?,?)',
                       (USER['id'], USER['nickname'], USER['username'], '', '', 'admin', 0, time.time()))

    @contextmanager
    def connect(self):
        db = sqlite3.connect(self.state / 'draw.sqlite3', timeout=15)
        db.row_factory = sqlite3.Row
        try:
            with db:
                yield db
        finally:
            db.close()


def load_env():
    import os
    path = ROOT / '.env'
    if path.exists():
        for line in path.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ.setdefault(key.strip(), value.strip().strip('\"').strip("'"))


class Handler(SimpleHTTPRequestHandler):
    def send_json(self, value, status=200):
        data = json.dumps(value, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def trusted_request(self):
        # Reject DNS rebinding and cross-origin API access, including localhost aliases.
        host = self.headers.get('Host', '')
        allowed = {f'127.0.0.1:{self.server.server_port}', f'localhost:{self.server.server_port}',
                   '127.0.0.1:5173', 'localhost:5173'}
        origin = self.headers.get('Origin')
        return host in allowed and (not origin or origin in {'http://' + h for h in allowed})

    def do_GET(self):
        path = urlsplit(self.path).path
        if not self.trusted_request():
            return self.send_json({'error': 'Forbidden origin'}, 403)
        if path == '/api/session':
            return self.send_json({'user': USER, 'csrf': self.server.csrf})
        if path == '/api/draw/quota':
            self.server.jobs.record_access(USER['id'])
            return self.send_json({'quota': self.server.jobs.quota(USER)})
        if path.startswith('/api/draw/jobs/'):
            job = self.server.jobs.get(USER['id'], path.rsplit('/', 1)[-1])
            return self.send_json({**job, 'quota': self.server.jobs.quota(USER)} if job
                                  else {'error': 'Job not found'}, 200 if job else 404)
        if path == '/api/admin/draw':
            return self.send_json(self.server.jobs.admin_report())
        if path.startswith('/api/'):
            return self.send_json({'error': 'Route not available in local preview'}, 404)
        if path in ('/', '/me'):
            self.send_response(302)
            self.send_header('Location', '/draw/')
            self.end_headers()
            return
        return super().do_GET()

    def do_POST(self):
        if not self.trusted_request() or self.headers.get('X-CSRF-Token') != self.server.csrf:
            return self.send_json({'error': 'Forbidden request'}, 403)
        try:
            size = int(self.headers.get('Content-Length', '0'))
            if not 0 < size <= 100_000:
                return self.send_json({'error': 'Invalid request size'}, 413)
            data = json.loads(self.rfile.read(size))
            if not isinstance(data, dict):
                return self.send_json({'error': 'Invalid JSON object'}, 400)
            if self.path == '/api/draw/jobs':
                job = self.server.jobs.start(USER, data)
                return self.send_json({**job, 'quota': self.server.jobs.quota(USER)}, 202)
            return self.send_json({'error': 'Local preview uses one developer account; no login/logout'}, 400)
        except DrawError as error:
            return self.send_json({'error': str(error)}, error.status)
        except (ValueError, TypeError):
            return self.send_json({'error': 'Invalid request'}, 400)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8082)
    args = parser.parse_args()
    load_env()
    jobs = DrawJobs(Store(ROOT / 'data'))
    server = ThreadingHTTPServer(('127.0.0.1', args.port), partial(Handler, directory=str(ROOT / 'dist')))
    server.jobs, server.csrf = jobs, secrets.token_urlsafe(32)
    print(f'Local developer preview: http://127.0.0.1:{args.port}/draw/ (no public authentication)')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
        jobs.pool.shutdown(wait=True)
