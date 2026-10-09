import json
from functools import partial
from http.server import ThreadingHTTPServer
from pathlib import Path
import tempfile
import threading
import time
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from server import Handler, Store
from share_draw import DrawJobs
from test_share_draw import diagram


class LocalServerTest(unittest.TestCase):
    def test_local_session_csrf_origin_and_generation(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'draw').mkdir()
            (root / 'draw' / 'index.html').write_text('<h1>Draw</h1>')
            jobs = DrawJobs(Store(root / 'data'), generator=lambda *args: diagram())
            server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Handler, directory=directory))
            server.jobs, server.csrf = jobs, 'test-csrf'
            worker = threading.Thread(target=server.serve_forever, daemon=True)
            worker.start()
            base = f'http://127.0.0.1:{server.server_port}'

            def request(path, data=None, headers=None):
                req = Request(base + path, data=json.dumps(data).encode() if data is not None else None,
                              headers=headers or {})
                with urlopen(req, timeout=5) as response:
                    return json.load(response)

            try:
                session = request('/api/session')
                self.assertEqual(session['csrf'], server.csrf)
                self.assertEqual(session['user']['id'], 'local-developer')
                with urlopen(base + '/draw/', timeout=5) as response:
                    self.assertIn(b'<h1>Draw</h1>', response.read())
                for headers in [{}, {'X-CSRF-Token': server.csrf, 'Origin': 'https://evil.example'}]:
                    with self.assertRaises(HTTPError) as caught:
                        request('/api/draw/jobs', {'prompt': 'workflow'}, headers)
                    self.assertEqual(caught.exception.code, 403)
                with self.assertRaises(HTTPError) as caught:
                    request('/api/session', headers={'Host': 'evil.example'})
                self.assertEqual(caught.exception.code, 403)
                job = request('/api/draw/jobs', {'prompt': 'workflow'}, {'X-CSRF-Token': server.csrf})
                for _ in range(100):
                    result = request('/api/draw/jobs/' + job['id'])
                    if result['status'] != 'pending':
                        break
                    time.sleep(.01)
                self.assertEqual(result['status'], 'ready')
                self.assertEqual(result['diagram']['title'], '登录流程')
                self.assertNotIn('owner', result)
            finally:
                server.shutdown()
                server.server_close()
                worker.join()
                jobs.pool.shutdown(wait=True)
