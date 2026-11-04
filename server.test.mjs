import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import net from 'node:net';

test('owner authentication, project lifecycle, persistence, and request protection', async () => {
  const data = await mkdtemp(path.join(tmpdir(), 'portfolio-test-'));
  const probe = net.createServer(); probe.listen(0, '127.0.0.1'); await once(probe,'listening'); const port = probe.address().port; await new Promise(r=>probe.close(r));
  let child;
  async function start() {
    child = spawn(process.execPath, ['server.mjs'], { cwd: import.meta.dirname, env: { ...process.env, PORT:String(port), PORTFOLIO_DATA_DIR:data }, stdio:['ignore','pipe','pipe'] });
    await Promise.race([once(child.stdout,'data'), once(child,'exit').then(()=>{throw Error('Server exited before readiness.');})]);
  }
  async function stop() { const ended=once(child,'exit'); child.kill(); await ended; }
  const base=`http://127.0.0.1:${port}`;
  let cookie='';
  async function request(route, method='GET', input, extra={}) {
    const response=await fetch(base+route,{method,headers:{'Content-Type':'application/json','X-Portfolio-Request':'1',...(cookie?{Cookie:cookie}:{}),...extra},...(input?{body:JSON.stringify(input)}:{})});
    return {status:response.status,headers:response.headers,body:await response.json()};
  }
  try {
    await start();
    assert.equal((await fetch(base)).status,200);
    assert.equal((await fetch(base+'/admin')).status,200);
    const playground=await fetch(base+'/playground.js');
    assert.equal(playground.status,200);
    assert.match(playground.headers.get('content-type'),/javascript/);
    assert.equal((await request('/api/session')).body.needsSetup,true);
    assert.equal((await request('/api/projects','POST',{})).status,401);
    assert.equal((await fetch(base+'/data/portfolio.json')).status,404);
    assert.equal((await fetch(base+'/seed.json')).status,404);
    const initial=await request('/api/portfolio');
    assert.equal(initial.body.profile.name,'Christian Ganang');
    assert.equal(initial.body.projects.length,4);
    for (const project of initial.body.projects) {
      const cover=await fetch(base+project.image);
      assert.equal(cover.status,200);
      assert.equal(cover.headers.get('content-type'),'image/png');
      assert.ok((await cover.arrayBuffer()).byteLength>1000);
    }
    assert.equal((await request('/api/setup','POST',{password:'too-short'})).status,400);
    assert.equal((await request('/api/setup','POST',{password:'temporary-test-password'},{Origin:'https://other.example'})).status,403);
    const setup=await request('/api/setup','POST',{password:'temporary-test-password'});
    assert.equal(setup.status,200);
    assert.match(setup.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);
    cookie=setup.headers.get('set-cookie').split(';')[0];
    assert.equal((await request('/api/session')).body.authenticated,true);
    assert.equal((await request('/api/setup','POST',{password:'another-test-password'})).status,409);
    assert.equal((await request('/api/profile','PUT',{name:'Test Owner',role:'Artist',about:'Test biography.'})).status,200);
    const project={title:'Test project',category:'3D Modeling',summary:'Test summary',description:'Test description',tags:'Blender, test',year:'2026',url:'https://example.com/work',image:'',featured:true};
    const created=await request('/api/projects','POST',project);
    assert.equal(created.status,201);
    const id=created.body.id;
    assert.equal((await request('/api/projects/'+id,'PUT',{...project,image:'/assets/donut.png'})).status,200);
    assert.equal((await fetch(base+'/project/'+id)).status,200);
    assert.equal((await request('/api/projects/'+id,'PUT',{...project,url:'javascript:alert(1)'})).status,400);
    assert.equal((await request('/api/projects/'+id,'PUT',{...project,image:'data:image/png;base64,aGVsbG8='})).status,400);
    const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jO1sAAAAASUVORK5CYII=';
    assert.equal((await request('/api/projects/'+id,'PUT',{...project,title:'Updated project',image:png})).status,200);
    const saved=JSON.parse(await readFile(path.join(data,'portfolio.json'),'utf8'));
    assert.notEqual(saved.owner.hash,'temporary-test-password');
    assert.equal(saved.projects.find(p=>p.id===id).image,png);
    assert.equal((await request('/api/portfolio')).body.owner,undefined);
    await stop(); await start();
    assert.equal((await request('/api/session')).body.authenticated,false);
    assert.equal((await request('/api/portfolio')).body.projects.find(p=>p.id===id).title,'Updated project');
    cookie='';
    assert.equal((await request('/api/login','POST',{password:'wrong-password'})).status,401);
    const login=await request('/api/login','POST',{password:'temporary-test-password'});
    assert.equal(login.status,200);cookie=login.headers.get('set-cookie').split(';')[0];
    assert.equal((await request('/api/projects/'+id,'DELETE')).status,200);
    assert.equal((await request('/api/portfolio')).body.projects.length,4);
    assert.equal((await request('/api/logout','POST',{})).status,200);
    assert.equal((await request('/api/profile','PUT',{name:'Nobody',role:'Nobody',about:'No'})).status,401);
    cookie='';
    for(let i=0;i<5;i++) assert.equal((await request('/api/login','POST',{password:'wrong-password'})).status,401);
    assert.equal((await request('/api/login','POST',{password:'wrong-password'})).status,429);
  } finally { if(child?.exitCode===null)await stop(); await rm(data,{recursive:true,force:true}); }
});
