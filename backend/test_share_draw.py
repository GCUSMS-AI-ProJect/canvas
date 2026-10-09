import copy
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import tempfile
import threading
import time
import unittest
from share_draw import DrawJobs, DrawError, validate_diagram
from server import Store


def diagram():
    return {'title':'登录流程','summary':'登录后查看作品。','type':'flowchart','direction':'LR','nodes':[
        {'id':'start','label':'登录','kind':'rectangle','color':'violet','x':0,'y':0,'width':180,'height':80},
        {'id':'end','label':'作品','kind':'rectangle','color':'green','x':0,'y':0,'width':180,'height':80}], 'edges':[{'from':'start','to':'end','label':''}]}


class DrawTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.store=Store(state=Path(self.temp.name));self.gate=threading.Event()
        self.alice={'id':'alice','role':'user'};self.bob={'id':'bob','role':'user'};self.admin={'id':'admin','role':'admin'}
    def tearDown(self):
        self.gate.set()
        if hasattr(self,'jobs'):self.jobs.pool.shutdown(wait=True)
        self.temp.cleanup()
    def wait(self,job,user=None):
        for _ in range(100):
            result=self.jobs.get((user or self.alice)['id'],job['id'])
            if result['status']!='pending':return result
            time.sleep(.01)
        self.fail('Job did not finish')
    def make_jobs(self,generator=lambda *args:diagram()):
        self.jobs=DrawJobs(self.store,generator=generator)
    def test_scene_validation_rejects_invalid_references_numbers_and_duplicate_ids(self):
        self.assertEqual(validate_diagram(diagram())['nodes'][0]['label'],'登录')
        for modify in [lambda d:d['edges'][0].update(to='missing'),lambda d:d['nodes'][0].update(x=float('nan')),lambda d:d['nodes'][1].update(id='start'),lambda d:d.update(nodes=[]),lambda d:d['nodes'][0].update(color='url(private)')]:
            data=copy.deepcopy(diagram());modify(data)
            with self.assertRaises(DrawError):validate_diagram(data)
    def test_daily_quota_is_separate_private_persistent_and_admin_exempt(self):
        self.make_jobs()
        for _ in range(3):self.assertEqual(self.wait(self.jobs.start(self.alice,{'prompt':'登录流程'}))['status'],'ready')
        self.assertEqual(self.jobs.quota(self.alice)['remaining'],0)
        with self.assertRaises(DrawError):self.jobs.start(self.alice,{'prompt':'fourth'})
        job=self.jobs.start(self.bob,{'prompt':'another user'})
        self.assertIsNone(self.jobs.get('alice',job['id']))
        self.assertNotIn('owner',self.wait(job,self.bob))
        self.jobs.pool.shutdown(wait=True);self.make_jobs()
        self.assertEqual(self.jobs.quota(self.alice)['remaining'],0)
        for _ in range(4):self.assertEqual(self.wait(self.jobs.start(self.admin,{'prompt':'admin'}),self.admin)['status'],'ready')
        self.assertTrue(self.jobs.quota(self.admin)['unlimited'])
    def test_provider_errors_are_sanitized_and_refund_quota(self):
        def broken(*args):raise RuntimeError('secret-key-that-must-not-be-exposed')
        self.make_jobs(broken);result=self.wait(self.jobs.start(self.alice,{'prompt':'draw'}))
        self.assertEqual(result['status'],'failed');self.assertNotIn('secret',str(result));self.assertEqual(self.jobs.quota(self.alice)['remaining'],3)
    def test_concurrency_is_bounded_and_does_not_reserve_rejected_jobs(self):
        def delayed(*args):self.gate.wait(3);return diagram()
        self.make_jobs(delayed)
        first=self.jobs.start(self.alice,{'prompt':'first'})
        with self.assertRaises(DrawError):self.jobs.start(self.alice,{'prompt':'same user'})
        second=self.jobs.start(self.bob,{'prompt':'second'})
        with self.assertRaises(DrawError):self.jobs.start(self.admin,{'prompt':'busy'})
        self.assertEqual(self.jobs.quota(self.alice)['remaining'],2)
        self.gate.set();self.wait(first);self.wait(second,self.bob)


if __name__=='__main__':unittest.main()
