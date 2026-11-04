// A small canvas sculpture. Geometry is generated locally; no external 3D engine is needed.
export function mountPlayground(root) {
  if (!root) return () => {};
  const canvas=root.querySelector('canvas');
  const ctx=canvas.getContext('2d');
  if(!ctx){root.querySelector('#playground-status').textContent='The sculpture needs a browser with Canvas support.';return()=>{};}
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const palettes={clay:[220,126,95],lilac:[168,148,207],jade:[105,154,137]};
  const colorNames={clay:'Terracotta',lilac:'Lilac',jade:'Jade'};
  let shape='bloom',material='clay',mesh=false,auto=!motion.matches;
  let rx=.55,ry=-.35,rz=-.20;
  let vertices=[],faces=[],raf=0,lastTime=0,visible=true,dragging=false,lastX=0,lastY=0;
  let width=0,height=0,destroyed=false;
  let morph=null,hoverX=0,hoverY=0,lightX=-.44,lightY=.58;
  const rotation=root.querySelector('#rotation-toggle');
  const meshButton=root.querySelector('#mesh-toggle');
  const status=root.querySelector('#playground-status');
  function makeGeometry(){
    const previous=vertices;
    vertices=[];faces=[];
    const uCount=64,vCount=28;
    for(let u=0;u<uCount;u++)for(let v=0;v<vCount;v++){
      const a=u/uCount*Math.PI*2,b=v/vCount*Math.PI*2;
      if(shape==='pebble'){
        const latitude=v/(vCount-1)*Math.PI;
        const wobble=1+.075*Math.sin(a*3)*Math.sin(latitude*2);
        vertices.push([1.45*Math.sin(latitude)*Math.cos(a)*wobble,1.6*Math.cos(latitude),1.12*Math.sin(latitude)*Math.sin(a)*wobble]);
      }else{
        const radius=shape==='bloom'?1.08+.26*Math.cos(a*4):1.17;
        const tube=shape==='bloom'?.46:.59;
        vertices.push([(radius+tube*Math.cos(b))*Math.cos(a),(radius+tube*Math.cos(b))*Math.sin(a),tube*Math.sin(b)]);
      }
    }
    for(let u=0;u<uCount;u++)for(let v=0;v<vCount;v++){
      if(shape==='pebble'&&v===vCount-1)continue;
      faces.push([u*vCount+v,((u+1)%uCount)*vCount+v,((u+1)%uCount)*vCount+(v+1)%vCount,u*vCount+(v+1)%vCount]);
    }
    if(previous.length&&!motion.matches){morph={from:previous,to:vertices,start:performance.now()};vertices=previous;}else morph=null;
  }
  function transform(p){
    const tx=rx+hoverX,ty=ry+hoverY;
    const y=p[1]*Math.cos(tx)-p[2]*Math.sin(tx),z=p[1]*Math.sin(tx)+p[2]*Math.cos(tx);
    const x=p[0]*Math.cos(ty)+z*Math.sin(ty),z2=-p[0]*Math.sin(ty)+z*Math.cos(ty);
    return [x*Math.cos(rz)-y*Math.sin(rz),x*Math.sin(rz)+y*Math.cos(rz),z2];
  }
  function draw(){
    if(!width||!height)return;
    ctx.clearRect(0,0,width,height);
    const scale=Math.min(width*.235,height*.235);
    ctx.save();ctx.translate(width*.5,height*.84);ctx.scale(1,.14);
    // A separate local gradient keeps the floor shadow soft at every viewport size.
    const floor=ctx.createRadialGradient(0,0,0,0,0,width*.32);floor.addColorStop(0,'rgba(61,47,29,.24)');floor.addColorStop(1,'rgba(61,47,29,0)');
    ctx.fillStyle=floor;ctx.beginPath();ctx.arc(0,0,width*.32,0,Math.PI*2);ctx.fill();ctx.restore();
    const points=vertices.map(transform);
    const projected=points.map(p=>{const f=5.8/(5.8+p[2]);return [width*.5+p[0]*scale*f,height*.46-p[1]*scale*f];});
    const sorted=faces.map(indices=>({indices,z:indices.reduce((n,i)=>n+points[i][2],0)/4})).sort((a,b)=>b.z-a.z);
    const base=palettes[material];
    for(const face of sorted){
      const [ia,ib,ic]=face.indices;
      const a=points[ia],b=points[ib],c=points[ic];
      const u=b.map((n,i)=>n-a[i]),v=c.map((n,i)=>n-a[i]);
      let normal=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
      const length=Math.hypot(...normal)||1;normal=normal.map(n=>n/length);
      // Two-sided shading also handles the closed pebble's reversed surface winding.
      if(normal[2]>0)normal=normal.map(n=>-n);
      const light=Math.max(0,normal[0]*lightX+normal[1]*lightY+normal[2]*-.68);
      const rim=Math.pow(Math.max(0,-normal[2]*.85+normal[1]*.3),12)*.14;
      const tone=.49+light*.51;
      const color=base.map(n=>Math.round(Math.min(255,n*tone+255*rim)));
      ctx.beginPath();face.indices.forEach((i,n)=>{const p=projected[i];if(n===0)ctx.moveTo(p[0],p[1]);else ctx.lineTo(p[0],p[1]);});ctx.closePath();
      ctx.fillStyle=mesh?'#e7e2d5':`rgb(${color.join(',')})`;ctx.fill();
      ctx.strokeStyle=mesh?'rgba(77,65,73,.55)':`rgb(${color.join(',')})`;ctx.lineWidth=mesh?.65:.65;ctx.lineJoin='round';ctx.stroke();
    }
  }
  function frame(time){
    raf=0;if(destroyed)return;
    if(auto&&visible&&!document.hidden&&!dragging){const elapsed=Math.min(32,time-lastTime||16);rz+=elapsed*.000075;}
    if(morph){const t=Math.min(1,(time-morph.start)/760);const ease=t*t*(3-2*t);vertices=morph.from.map((p,i)=>p.map((n,j)=>n+(morph.to[i][j]-n)*ease));if(t===1)morph=null;}
    lastTime=time;draw();
    if((auto||morph)&&visible&&!document.hidden)schedule();
  }
  function schedule(){if(!raf&&!destroyed)raf=requestAnimationFrame(frame);}
  function updateRotation(){rotation.textContent=auto?'Ⅱ':'▷';rotation.setAttribute('aria-label',auto?'Pause rotation':'Resume rotation');rotation.setAttribute('aria-pressed',!auto);}
  function announce(){status.textContent=`${shape[0].toUpperCase()+shape.slice(1)} · ${colorNames[material]} · ${mesh?'Mesh view':'Surface view'}. Drag or use arrow keys to explore.`;}
  function resize(){const r=canvas.getBoundingClientRect();width=r.width;height=r.height;const dpr=Math.min(devicePixelRatio||1,1.7);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);schedule();}
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas);
  const visibilityObserver=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){lastTime=0;schedule();}},{rootMargin:'80px'});visibilityObserver.observe(canvas);
  const onVisibility=()=>{if(!document.hidden){lastTime=0;schedule();}};document.addEventListener('visibilitychange',onVisibility);
  const down=e=>{dragging=true;auto=false;updateRotation();lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging');};
  const move=e=>{if(dragging){ry+=(e.clientX-lastX)*.009;rx+=(e.clientY-lastY)*.009;lastX=e.clientX;lastY=e.clientY;}else if(!motion.matches&&e.pointerType==='mouse'){const r=canvas.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;hoverX=y*.12;hoverY=x*.16;lightX=-.44+x*.45;lightY=.58-y*.2;}schedule();};
  const leave=()=>{hoverX=0;hoverY=0;lightX=-.44;lightY=.58;schedule();};
  const reset=()=>{rx=.55;ry=-.35;rz=-.20;leave();status.textContent='View reset. A little shape, a lot of personality.';};
  const up=()=>{dragging=false;canvas.classList.remove('dragging');};
  const keyboard=e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key)){e.preventDefault();if(e.key===' ')auto=!auto;else{auto=false;if(e.key==='ArrowLeft')ry-=.15;if(e.key==='ArrowRight')ry+=.15;if(e.key==='ArrowUp')rx-=.15;if(e.key==='ArrowDown')rx+=.15;}updateRotation();schedule();}};
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerleave',leave);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('keydown',keyboard);
  root.querySelector('#reset-view').onclick=reset;
  root.querySelectorAll('[data-shape]').forEach(button=>button.onclick=()=>{if(shape===button.dataset.shape)return;shape=button.dataset.shape;root.querySelectorAll('[data-shape]').forEach(b=>b.setAttribute('aria-pressed',b===button));root.querySelector('.playground-top>span:last-child').textContent=`${{bloom:'01',loop:'02',pebble:'03'}[shape]} — 03`;root.classList.remove('shape-changing');void root.offsetWidth;root.classList.add('shape-changing');makeGeometry();announce();schedule();});
  root.querySelectorAll('[data-material]').forEach(button=>button.onclick=()=>{material=button.dataset.material;root.querySelectorAll('[data-material]').forEach(b=>b.setAttribute('aria-pressed',b===button));root.dataset.material=material;root.closest('.hero').dataset.material=material;announce();schedule();});
  meshButton.onclick=()=>{mesh=!mesh;meshButton.setAttribute('aria-pressed',mesh);meshButton.innerHTML=mesh?'<span aria-hidden="true">◉</span> Show surface':'<span aria-hidden="true">▦</span> Show mesh';announce();schedule();};
  rotation.onclick=()=>{auto=!auto;updateRotation();schedule();};
  const onMotion=()=>{if(motion.matches){auto=false;hoverX=hoverY=0;if(morph){vertices=morph.to;morph=null;}updateRotation();schedule();}};motion.addEventListener('change',onMotion);
  makeGeometry();updateRotation();resize();
  return()=>{destroyed=true;cancelAnimationFrame(raf);resizeObserver.disconnect();visibilityObserver.disconnect();document.removeEventListener('visibilitychange',onVisibility);motion.removeEventListener('change',onMotion);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerleave',leave);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('keydown',keyboard);};
}
