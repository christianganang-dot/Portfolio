import { mountPlayground } from '/playground.js';

const DRIVE = 'https://drive.google.com/drive/folders/1vVQ0A0z8aWjhWRxs1gzG0MOM8KAMjxbG?usp=drive_link';
const MAIL = 'https://mail.google.com/mail/?view=cm&fs=1&to=christianganang%40gmail.com';
const app = document.querySelector('#app');
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
let portfolio = { profile: {}, projects: [] };
let cleanup = () => {};
let currentFilter = 'All';
let galleryMode = 'gallery';
let query = '';
let auth = {};
let editing = null;
let selectedImage = '';
const arrow = '<span aria-hidden="true">↗</span>';
const flowerMark = '<span class="flower-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>';
async function api(url, method = 'GET', data) {
  const response = await fetch(url, { method, headers: { 'Content-Type':'application/json', 'X-Portfolio-Request':'1' }, ...(data ? { body: JSON.stringify(data) } : {}) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Unable to complete the request.');
  return result;
}
function nav(active = '') {
  return `<header class="header"><span class="reading-progress" aria-hidden="true"></span><a href="/" data-nav class="logo" aria-label="Portfolio home">${flowerMark}<span class="logo-word">ganang<span class="logo-label">studio</span></span></a><nav aria-label="Main navigation"><a data-nav href="/" ${active==='home'?'aria-current="page"':''}>Studio</a><a data-nav href="/portfolio" ${active==='work'?'aria-current="page"':''}>Work <span>${String(portfolio.projects.length).padStart(2,'0')}</span></a><a data-nav href="/#about">About</a></nav><a class="nav-contact" href="${MAIL}" target="_blank" rel="noopener">Let’s make something ${arrow}</a></header>`;
}
function footer() {
  return `<footer><a class="logo" href="/" data-nav>${flowerMark}<span class="logo-word">ganang<span class="logo-label">studio</span></span></a><p>Small details. A different dimension.</p><div><span>© ${new Date().getFullYear()} ${esc(portfolio.profile.name || 'Portfolio')}</span><a href="/admin" data-nav>Owner studio ↗</a></div><a href="#" class="top-link">Back to top ↑</a></footer>`;
}
function contact() {
  return `<section class="contact reveal" id="contact"><div class="contact-top"><span class="eyebrow">GOOD THINGS START WITH A HELLO</span><span class="contact-spark" aria-hidden="true">${flowerMark}</span></div><h2><a class="contact-title" href="${MAIL}" target="_blank" rel="noopener">Let’s make<br><span class="serif">something</span> <span class="contact-arrow" aria-hidden="true">↗</span><br>feel real.</a></h2><div class="contact-bottom"><p>A new idea, a creative collaboration,<br>or just a little curiosity. I’d love to hear it.</p><div><a class="button dark" href="${MAIL}" target="_blank" rel="noopener">Start a conversation ${arrow}</a><a class="email" href="mailto:christianganang@gmail.com">christianganang@gmail.com</a></div></div></section>`;
}
function shapePlayground() {
  return `<div class="playground" id="playground"><div class="playground-top"><span><i></i> THE GANANG BLOOM</span><span>01 — 03</span></div><div class="canvas-wrap"><canvas id="shape-canvas" tabindex="0" role="img" aria-label="Interactive 3D sculpture. Drag to rotate, use arrow keys to turn, and press Space to pause rotation."></canvas><div class="shape-note" aria-hidden="true">go on, give it a spin<span>⤵</span></div><div class="canvas-floor" aria-hidden="true"></div><span class="stage-coordinate" aria-hidden="true">A FOUR-PETAL SIGNATURE</span></div><div class="playground-controls"><div class="shape-options" aria-label="Choose a shape"><button data-shape="bloom" aria-pressed="true">Bloom</button><button data-shape="loop" aria-pressed="false">Loop</button><button data-shape="pebble" aria-pressed="false">Pebble</button></div><div class="scene-actions"><button class="rotation-toggle" id="reset-view" aria-label="Reset sculpture view">↺</button><button class="rotation-toggle" id="rotation-toggle" aria-label="Pause rotation" aria-pressed="false">Ⅱ</button></div></div><div class="material-bar"><div class="material-options" aria-label="Choose material color"><span>MAKE IT YOURS</span><button class="swatch clay" data-material="clay" aria-label="Terracotta material" aria-pressed="true"></button><button class="swatch lilac" data-material="lilac" aria-label="Lilac material" aria-pressed="false"></button><button class="swatch jade" data-material="jade" aria-label="Jade material" aria-pressed="false"></button></div><button class="mesh-toggle" id="mesh-toggle" aria-pressed="false"><span aria-hidden="true">▦</span> Show mesh</button></div><p class="playground-caption" id="playground-status" role="status">A little signature sculpture. Drag, reshape, make it yours.</p></div>`;
}
function card(p, index = 0) {
  return `<a class="project-card" href="/project/${p.id}" data-nav><div class="project-image tone-${index%4}">${p.image?`<img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy">`:`<div class="project-placeholder">${flowerMark}<strong>${esc(p.title)}</strong></div>`}<span class="project-open">Explore ${arrow}</span><span class="image-number">${String(index+1).padStart(2,'0')}</span></div><div class="project-info"><div class="project-meta"><span>${esc(p.category)}</span><span>${esc(p.year || 'PERSONAL EXPLORATION')}</span></div><div class="project-name"><h3>${esc(p.title)}</h3><span class="card-arrow" aria-hidden="true">↗</span></div><p>${esc(p.summary)}</p></div></a>`;
}
function emptyWork() {
  return `<div class="empty-work">${flowerMark}<h3>A little space for what comes next.</h3><p>The collection is growing. Explore the archive in the meantime.</p><a class="text-link" href="${DRIVE}" target="_blank" rel="noopener">Open the Drive archive ${arrow}</a></div>`;
}
function home() {
  const featured = portfolio.projects.filter(p=>p.featured);
  const projects = (featured.length?featured:portfolio.projects).slice(0,2);
  const profile = portfolio.profile;
  document.title = `${profile.name || 'Portfolio'} — A little more dimensional`;
  return `${nav('home')}<main id="main"><section class="hero"><div class="hero-copy"><div class="eyebrow"><span class="tiny-spark">${flowerMark}</span> 3D MODELER & DIGITAL ARTIST</div><h1 class="signature-heading"><span class="hero-line"><span>A little shape.</span></span><span class="hero-line"><span>A lot of</span></span><span class="hero-line"><span class="serif">personality.<span class="hero-period">${flowerMark}</span></span></span></h1><p class="hero-description">Hi, I’m ${esc(profile.name || 'Christian')}. I turn everyday ideas into<br class="desktop-break"> playful objects, thoughtful details, and little worlds.</p><div class="hero-actions"><a class="button dark" href="/portfolio" data-nav>Discover my work ${arrow}</a><a class="text-link" href="/#about" data-nav>Meet the maker <span>↓</span></a></div><div class="hero-footnote"><span class="location-dot"></span> BASED IN INDONESIA <span class="footnote-divider">/</span> MADE WITH CURIOSITY</div></div>${shapePlayground()}<div class="hero-bottom"><span>SCROLL A LITTLE. DISCOVER SOMETHING.</span><a href="#work" aria-label="Scroll to selected work">↓</a><span>INDEPENDENT PORTFOLIO · ${new Date().getFullYear()}</span></div></section><div class="ribbon" aria-hidden="true"><div>EVERYDAY OBJECTS ${flowerMark} UNEXPECTED POSSIBILITIES ${flowerMark} SMALL DETAILS ${flowerMark} BIG CURIOSITY ${flowerMark} EVERYDAY OBJECTS ${flowerMark} UNEXPECTED POSSIBILITIES ${flowerMark} SMALL DETAILS ${flowerMark} BIG CURIOSITY ${flowerMark}</div></div><section id="work" class="section selected-work reveal"><div class="section-top"><div><span class="eyebrow">01 / A FEW THINGS I’VE MADE</span><h2>Ordinary things.<br><span class="serif">Another perspective.</span></h2></div><div><p>From a sweet little still life to a quiet corner.<br>Every object is a chance to explore.</p><a class="text-link" href="/portfolio" data-nav>Explore all work <sup>${portfolio.projects.length}</sup> ${arrow}</a></div></div>${projects.length?`<div class="project-grid selected-grid">${projects.map(card).join('')}</div>`:emptyWork()}</section><section class="about-section" id="about"><div class="about-sticker" aria-hidden="true">STILL<br>EXPLORING<span>↗</span></div><div class="about-heading reveal"><span class="eyebrow">02 / MEET THE MAKER</span><h2>A curious mind.<br>A love for<br><span class="serif">the little things.</span></h2><div class="maker-signature">${esc(profile.name || 'Christian Ganang')}<span>3D Modeler & Digital Artist</span></div></div><div class="about-copy reveal"><span class="about-doodle" aria-hidden="true">${flowerMark}</span><p class="preserve-lines">${esc(profile.about || 'A student of shape, color, and the small details that make an object feel real. Always learning, always making.')}</p><a class="text-link" href="${MAIL}" target="_blank" rel="noopener">Let’s get to know each other ${arrow}</a></div></section>${skills()}${contact()}</main>${footer()}`;
}
function skills() {
  return `<section class="section process-section reveal" id="skills"><div class="section-top"><div><span class="eyebrow">03 / IN THE MAKING</span><h2>A thought. A shape.<br><span class="serif">A little bit of magic.</span></h2></div><p>Learning by doing, one detail at a time.<br>Explore the steps behind a 3D object.</p></div><div class="process-layout"><div class="process-visual" data-stage="shape"><div class="process-object" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><span class="process-visual-label">01 / FINDING THE FORM</span><span class="process-visual-note">An abstract process study</span></div><div class="process-steps"><button class="process-step active" data-step="shape" aria-expanded="true"><span>01</span><div><h3>Start with a shape</h3><p>Simple forms, proportions, and a little patience. Building objects with hard surface and basic organic modeling.</p></div><b class="step-indicator" aria-hidden="true">−</b></button><button class="process-step" data-step="material" aria-expanded="false"><span>02</span><div><h3>Give it character</h3><p>Basic UV mapping and materials bring color, texture, and personality to the surface.</p></div><b class="step-indicator" aria-hidden="true">+</b></button><button class="process-step" data-step="light" aria-expanded="false"><span>03</span><div><h3>Find the right light</h3><p>A considered render brings the form and materials together, setting the mood for the final image.</p></div><b class="step-indicator" aria-hidden="true">+</b></button><div class="toolkit"><span>MY GROWING TOOLKIT</span><div><span class="tool-icon blender-symbol" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path d="M5 8L14 13M3 15H13M8 24L15 18M11 5L20 12"/><ellipse cx="20" cy="17" rx="9" ry="7"/><circle cx="20" cy="17" r="3"/></svg></span> Blender <small>Modeling & rendering</small></div><div><span class="tool-icon unity-symbol" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path d="M16 3L28 10V23L16 30L4 23V10Z M4 10L16 17L28 10 M16 17V30 M16 3V10"/></svg></span> Unity <small>Asset integration</small></div></div></div></div></section>`;
}
function work() {
  document.title = 'The collection — Ganang';
  return `${nav('work')}<main id="main"><section class="page-heading"><div class="page-heading-top"><span class="eyebrow">THE COLLECTION / ${String(portfolio.projects.length).padStart(2,'0')} EXPLORATIONS</span><button class="text-link" id="surprise-project" ${portfolio.projects.length?'':'disabled'}>Surprise me <span aria-hidden="true">⤨</span></button></div><div class="page-title-row"><h1>A world of<br><span class="serif">little possibilities.</span></h1><div class="collection-sticker" aria-hidden="true">LOOK<br>A LITTLE<br>CLOSER <span>↙</span></div></div><div class="page-description"><p>Shapes, spaces, and the details in between.<br>Come explore what I’ve been making.</p><a class="button secondary" href="${DRIVE}" target="_blank" rel="noopener">The full Drive archive ${arrow}</a></div></section><section class="work-section"><div class="work-toolbar"><div class="filters" aria-label="Filter projects">${['All',...new Set(portfolio.projects.map(p=>p.category))].map(cat=>`<button class="filter ${cat===currentFilter?'active':''}" data-filter="${esc(cat)}" aria-pressed="${cat===currentFilter}">${esc(cat)}${cat==='All'?` <span>${portfolio.projects.length}</span>`:''}</button>`).join('')}</div><div class="work-tools"><label class="search"><span aria-hidden="true">⌕</span><input id="project-search" type="search" placeholder="Find something" aria-label="Search projects" value="${esc(query)}"></label><div class="view-switch" aria-label="Gallery layout"><button data-view="gallery" aria-pressed="${galleryMode==='gallery'}" aria-label="Gallery view">▦</button><button data-view="index" aria-pressed="${galleryMode==='index'}" aria-label="Index view">☰</button></div></div></div><div id="project-results" aria-live="polite">${workResults()}</div><div class="collection-end"><span>You’ve reached the end. Curiosity doesn’t have to.</span><a class="text-link" href="${DRIVE}" target="_blank" rel="noopener">There’s more in the archive ${arrow}</a></div></section>${contact()}</main>${footer()}`;
}
function workResults() {
  const filtered = portfolio.projects.filter(p=>(currentFilter==='All'||p.category===currentFilter) && `${p.title} ${p.summary} ${p.tags}`.toLowerCase().includes(query.toLowerCase()));
  if (!portfolio.projects.length) return emptyWork();
  return filtered.length?`<div class="project-grid ${galleryMode==='index'?'index-view':''}">${filtered.map(card).join('')}</div>`:'<div class="no-results"><h3>No discoveries this time.</h3><p>Try another word or category.</p></div>';
}
function detail(id) {
  const p = portfolio.projects.find(p=>p.id===id);
  if (!p) { document.title='Project not found'; return `${nav('work')}<main id="main" class="not-found"><span class="eyebrow">A SMALL DETOUR / 404</span><h1>This little world<br><span class="serif">isn’t here.</span></h1><a class="button dark" href="/portfolio" data-nav>Back to the collection ↗</a></main>${footer()}`; }
  document.title=`${p.title} — Ganang`;
  const next = portfolio.projects[(portfolio.projects.indexOf(p)+1)%portfolio.projects.length];
  return `${nav('work')}<main id="main"><section class="project-heading"><a class="text-link" href="/portfolio" data-nav>← Back to the collection</a><div class="project-heading-row"><div><div class="eyebrow">${esc(p.category)} ${p.year?' / '+esc(p.year):''}</div><h1>${esc(p.title)}<span class="accent">.</span></h1><p>${esc(p.summary)}</p></div><span class="project-heading-flower" aria-hidden="true">${flowerMark}</span></div><div class="tags">${p.tags.split(',').filter(Boolean).map(t=>`<span>${esc(t.trim())}</span>`).join('')}</div></section><div class="detail-image">${p.image?`<button class="render-expand" id="expand-render" aria-label="View full-size render"><img src="${esc(p.image)}" alt="${esc(p.title)}"><span>Take a closer look <b>⊕</b></span></button>`:`<div class="project-placeholder">${flowerMark}<strong>${esc(p.title)}</strong></div>`}</div><section class="section project-story reveal"><div><span class="eyebrow">THE IDEA BEHIND THE OBJECT</span><h2>Every detail<br><span class="serif">has a story.</span></h2></div><div><p class="preserve-lines">${esc(p.description)}</p>${p.url?`<a class="button dark" href="${esc(p.url)}" target="_blank" rel="noopener">Explore the project ${arrow}</a>`:''}<a class="text-link archive-link" href="${DRIVE}" target="_blank" rel="noopener">View the full Drive archive ${arrow}</a></div></section>${next.id!==p.id?`<a class="next-project" href="/project/${next.id}" data-nav><div><span class="eyebrow">A LITTLE MORE TO EXPLORE</span><h2>${esc(next.title)}</h2></div>${next.image?`<img src="${esc(next.image)}" alt="${esc(next.title)}" loading="lazy">`:''}<span aria-hidden="true">↗</span></a>`:''}${contact()}</main>${footer()}${p.image?`<dialog class="image-lightbox" id="render-dialog" aria-label="${esc(p.title)} full-size render"><div class="lightbox-toolbar"><span>${esc(p.title)}</span><button id="close-render" aria-label="Close full-size render">Close ×</button></div><img src="${esc(p.image)}" alt="${esc(p.title)} full-size render"><p>Original render · ${esc(p.category)}</p></dialog>`:''}`;
}

function field(label,name,value='',options={}) {
  const attrs=`name="${name}" id="field-${name}" ${options.required===false?'':'required'} ${options.max?`maxlength="${options.max}"`:''}`;
  return `<label class="form-field" for="field-${name}">${label}${options.textarea?`<textarea ${attrs} rows="${options.rows||4}">${esc(value)}</textarea>`:`<input ${attrs} type="${options.type||'text'}" value="${esc(value)}" ${options.placeholder?`placeholder="${esc(options.placeholder)}"`:''}>`}</label>`;
}
function admin() {
  document.title='Owner studio — Portfolio';
  if (!auth.authenticated) return `${nav()}<main id="main" class="auth-page"><div class="auth-card"><span class="green mono">YOUR PRIVATE STUDIO</span><h1>${auth.needsSetup?'Make it<br><span class="serif">yours.</span>':'Welcome<br><span class="serif">back.</span>'}</h1><p>${auth.needsSetup?'Create your private owner password. You’ll use it to manage your profile and projects on this computer.':'Sign in to curate your work and update your profile.'}</p><form id="auth-form"><label class="form-field">Password<input name="password" type="password" required minlength="${auth.needsSetup?12:1}" maxlength="256" autocomplete="${auth.needsSetup?'new-password':'current-password'}"></label>${auth.needsSetup?'<label class="form-field">Confirm password<input name="confirm" type="password" required minlength="12" autocomplete="new-password"></label><small>Use at least 12 characters. Keep your password somewhere safe.</small>':''}<p id="form-status" class="form-status" role="status"></p><button class="button primary" type="submit">${auth.needsSetup?'Create owner studio':'Sign in'} ${arrow}</button></form><a href="/" data-nav class="text-link">← Back to the website</a></div><div class="auth-art" aria-hidden="true"><span class="auth-sculpture">✳</span></div></main>`;
  const p = editing || {};
  return `${nav()}<main id="main" class="admin-page"><div class="admin-header"><div><div class="eyebrow green">PRIVATE / OWNER WORKSPACE</div><h1>Your work.<br><span class="serif">Your space.</span></h1></div><button class="button secondary" id="logout">Sign out ↗</button></div><p class="admin-note">Changes are saved on this computer and appear immediately on your website.</p><div class="admin-columns"><div><section class="admin-panel"><div class="panel-title"><h2>${editing?'Edit project':'Add a project'}</h2>${editing?'<button class="text-link" id="cancel-edit">Cancel edit ×</button>':''}</div><form id="project-form">${field('Project title','title',p.title,{max:120})}<div class="form-row">${field('Category','category',p.category,{max:60,placeholder:'e.g. 3D Modeling'})}${field('Year (optional)','year',p.year,{max:4,required:false,placeholder:'2026'})}</div>${field('Short introduction','summary',p.summary,{max:250,textarea:true,rows:2})}${field('Project story','description',p.description,{max:12000,textarea:true,rows:6})}${field('Tags, separated by commas (optional)','tags',p.tags,{max:250,required:false})}${field('Project link (optional, https://)','url',p.url,{max:2000,required:false,type:'url'})}<label class="form-field">Cover image (optional)<input id="image-upload" type="file" accept="image/png,image/jpeg,image/webp"><small>PNG, JPEG, or WebP. Maximum 5 MB.</small></label><div id="image-preview">${p.image?`<img src="${p.image}" alt="Current cover"><button class="text-link" type="button" id="remove-image">Remove image ×</button>`:''}</div><label class="check-field"><input name="featured" type="checkbox" ${p.featured?'checked':''}> Feature on the home page</label><p class="form-status" id="project-status" role="status"></p><button class="button primary" type="submit">${editing?'Save changes':'Publish project'} ${arrow}</button></form></section><section class="admin-panel"><h2>Your profile</h2><p>Add your real details to personalize the home page.</p><form id="profile-form">${field('Your name','name',portfolio.profile.name,{max:100})}${field('Your role','role',portfolio.profile.role,{max:150})}${field('About you (English)','about',portfolio.profile.about,{max:3000,textarea:true})}<p class="form-status" id="profile-status" role="status"></p><button class="button secondary" type="submit">Save profile ↗</button></form></section></div><section class="admin-panel project-list-panel"><h2>Published projects <span class="green">(${portfolio.projects.length})</span></h2><div class="admin-project-list">${portfolio.projects.length?portfolio.projects.map(p=>`<article class="admin-project"><div><span class="eyebrow">${esc(p.category)}</span><h3>${esc(p.title)}</h3>${p.featured?'<small class="green">Featured on home</small>':''}</div><div><a href="/project/${p.id}" data-nav>View ↗</a><button data-edit="${p.id}">Edit</button><button class="danger" data-delete="${p.id}">Delete</button></div></article>`).join(''):'<p>No projects yet. Add your first one using the form.</p>'}</div><p id="list-status" class="form-status" role="status"></p><a class="text-link" href="/portfolio" data-nav>View portfolio ${arrow}</a></section></div></main>${footer()}<dialog id="delete-dialog"><form method="dialog"><span class="green mono">CONFIRM DELETE</span><h2>Remove this project?</h2><p>This removes the project from your local portfolio. This action cannot be undone.</p><div class="dialog-actions"><button class="button secondary" value="cancel">Keep project</button><button class="button primary" id="confirm-delete" value="delete">Delete project</button></div></form></dialog>`;
}
async function render() {
  cleanup();
  try {
    portfolio = await api('/api/portfolio');
    if (location.pathname==='/admin') auth = await api('/api/session');
    app.innerHTML = location.pathname==='/admin'?admin():location.pathname==='/portfolio'?work():location.pathname.startsWith('/project/')?detail(location.pathname.split('/').pop()):home();
    bind(); bindStudio(); animate();
    if (location.hash) requestAnimationFrame(()=>document.getElementById(location.hash.slice(1))?.scrollIntoView());
  } catch(error) { app.innerHTML=`<main class="not-found"><h1>Connection paused.</h1><p>${esc(error.message)}</p><p>Make sure the local server is running, then refresh this page.</p></main>`; }
}
function navigate(href) { history.pushState({},'',href); scrollTo({top:0,left:0,behavior:'instant'}); render(); }
document.addEventListener('click', e=> { const a=e.target.closest('a[data-nav]'); if(a && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.button===0) {e.preventDefault();navigate(a.getAttribute('href'));} });
window.addEventListener('popstate',render);
async function submit(form,status,callback) { const button=form.querySelector('button[type="submit"]'); button.disabled=true; status.textContent='Saving…'; try {await callback();} catch(e) {status.textContent=e.message;} finally {button.disabled=false;} }
function bind() {
  document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{currentFilter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',x===b);});document.querySelector('#project-results').innerHTML=workResults();});
  document.querySelector('#project-search')?.addEventListener('input',e=>{query=e.target.value;document.querySelector('#project-results').innerHTML=workResults();});
  const authForm=document.querySelector('#auth-form');
  if(authForm) authForm.onsubmit=e=>{e.preventDefault();submit(authForm,document.querySelector('#form-status'),async()=>{const data=Object.fromEntries(new FormData(authForm));if(auth.needsSetup && data.password!==data.confirm) throw Error('The passwords do not match.');await api(auth.needsSetup?'/api/setup':'/api/login','POST',data);await render();});};
  document.querySelector('#logout')?.addEventListener('click',async()=>{try {await api('/api/logout','POST',{}); editing=null; await render();} catch(e){alert(e.message);}});
  const profileForm=document.querySelector('#profile-form');
  if(profileForm) profileForm.onsubmit=e=>{e.preventDefault();submit(profileForm,document.querySelector('#profile-status'),async()=>{portfolio.profile=await api('/api/profile','PUT',Object.fromEntries(new FormData(profileForm)));document.querySelector('#profile-status').textContent='Profile saved.';});};
  selectedImage=editing?.image||'';
  const upload=document.querySelector('#image-upload');
  if(upload) upload.onchange=async()=>{const file=upload.files[0];if(!file)return;const status=document.querySelector('#project-status');if(file.size>5_000_000 || !['image/png','image/jpeg','image/webp'].includes(file.type)){status.textContent='Use a PNG, JPEG, or WebP image under 5 MB.';upload.value='';return;}try{selectedImage=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('Could not read the image.'));r.readAsDataURL(file);});document.querySelector('#image-preview').innerHTML=`<img src="${selectedImage}" alt="Cover preview"><button class="text-link" type="button" id="remove-image">Remove image ×</button>`;status.textContent='';bindRemove();}catch(e){status.textContent=e.message;}};
  bindRemove();
  document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{editing=portfolio.projects.find(p=>p.id===b.dataset.edit);render().then(()=>document.querySelector('#project-form').scrollIntoView({behavior:'smooth',block:'start'}));});
  document.querySelector('#cancel-edit')?.addEventListener('click',()=>{editing=null;render();});
  document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>{const dialog=document.querySelector('#delete-dialog');dialog.showModal();dialog.onclose=async()=>{if(dialog.returnValue!=='delete')return;try{await api('/api/projects/'+b.dataset.delete,'DELETE');if(editing?.id===b.dataset.delete)editing=null;await render();}catch(e){document.querySelector('#list-status').textContent=e.message;}};});
  const projectForm=document.querySelector('#project-form');
  if(projectForm) projectForm.onsubmit=e=>{e.preventDefault();submit(projectForm,document.querySelector('#project-status'),async()=>{const data=Object.fromEntries(new FormData(projectForm));data.featured=!!data.featured;data.image=selectedImage;await api(editing?'/api/projects/'+editing.id:'/api/projects',editing?'PUT':'POST',data);editing=null;await render();document.querySelector('#project-status').textContent='Project saved. It is now live on your local website.';});};
}
function bindRemove(){document.querySelector('#remove-image')?.addEventListener('click',()=>{selectedImage='';document.querySelector('#image-preview').innerHTML='';document.querySelector('#image-upload').value='';});}

function bindStudio() {
  document.querySelectorAll('[data-view]').forEach(button=>button.onclick=()=>{
    galleryMode=button.dataset.view;
    document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',b===button));
    document.querySelector('#project-results').innerHTML=workResults();
  });
  document.querySelector('#surprise-project')?.addEventListener('click',()=>{
    const p=portfolio.projects[Math.floor(Math.random()*portfolio.projects.length)];
    if(p)navigate('/project/'+p.id);
  });
  document.querySelectorAll('[data-step]').forEach(button=>button.onclick=()=>{
    document.querySelectorAll('[data-step]').forEach(b=>{
      b.classList.toggle('active',b===button);
      b.setAttribute('aria-expanded',b===button);
      b.querySelector('b').textContent=b===button?'−':'+';
    });
    const stage=button.dataset.step;
    document.querySelector('.process-visual').dataset.stage=stage;
    document.querySelector('.process-visual-label').textContent={shape:'01 / FINDING THE FORM',material:'02 / ADDING CHARACTER',light:'03 / SETTING THE MOOD'}[stage];
  });
  const dialog=document.querySelector('#render-dialog');
  document.querySelector('#expand-render')?.addEventListener('click',()=>dialog.showModal());
  document.querySelector('#close-render')?.addEventListener('click',()=>dialog.close());
  dialog?.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
}
function mountStudioCursor() {
  if(location.pathname==='/admin')return()=>{};
  const fine=matchMedia('(hover:hover) and (pointer:fine)');
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const layer=document.createElement('div');
  layer.className='studio-cursor';layer.setAttribute('aria-hidden','true');
  layer.innerHTML='<span class="cursor-point"></span><span class="cursor-follower"><svg class="cursor-petal" viewBox="0 0 80 80" fill="none"><path d="M40 22C18-5-5 18 22 40C-5 62 18 85 40 58C62 85 85 62 58 40C85 18 62-5 40 22Z"/></svg><span class="cursor-symbol">↗</span><span class="cursor-word"></span></span>';
  document.body.append(layer);
  const point=layer.querySelector('.cursor-point'),follower=layer.querySelector('.cursor-follower'),word=layer.querySelector('.cursor-word');
  let active=false,initialized=false,frameId=0,lastTime=0,x=0,y=0,fx=0,fy=0,angle=0;
  const timers=new Set();
  function hide(){active=false;initialized=false;document.body.classList.remove('cursor-active');layer.classList.remove('visible');cancelAnimationFrame(frameId);frameId=0;}
  function frame(time){
    frameId=0;if(!active)return;
    const dt=Math.min(40,time-lastTime||16);lastTime=time;
    const ease=1-Math.exp(-dt/70),dx=x-fx,dy=y-fy;
    fx+=dx*ease;fy+=dy*ease;angle+=(Math.max(-16,Math.min(16,dx*.3))-angle)*.2;
    follower.style.transform=`translate3d(${fx}px,${fy}px,0) rotate(${angle}deg)`;
    if(Math.hypot(dx,dy)>.12||Math.abs(angle)>.1)frameId=requestAnimationFrame(frame);
  }
  function move(event){
    if(document.activeElement?.matches('input,textarea,select,[contenteditable]')||document.querySelector('dialog[open]')||!fine.matches||motion.matches||event.pointerType!=='mouse'||event.target.closest('input,textarea,select,[contenteditable],dialog')){hide();return;}
    x=event.clientX;y=event.clientY;
    if(!initialized){fx=x;fy=y;angle=0;initialized=true;follower.style.transform=`translate3d(${x}px,${y}px,0)`;}
    const target=event.target;
    const mode=target.closest('#shape-canvas')?'drag':target.closest('.project-card')?'project':target.closest('.render-expand')?'zoom':target.closest('a,button')?'link':'idle';
    layer.dataset.mode=mode;word.textContent=mode==='drag'?'Drag':mode==='project'?'View':mode==='zoom'?'Zoom':'';
    active=true;document.body.classList.add('cursor-active');layer.classList.add('visible');
    point.style.transform=`translate3d(${x}px,${y}px,0)`;
    if(!frameId){lastTime=0;frameId=requestAnimationFrame(frame);}
  }
  function click(event){
    if(event.target.closest('input,textarea,select,[contenteditable],dialog')){hide();return;}
    move(event);
    if(!active||event.button!==0)return;
    const echo=document.createElement('span');echo.className='cursor-echo';echo.style.left=`${event.clientX}px`;echo.style.top=`${event.clientY}px`;layer.append(echo);
    const timer=setTimeout(()=>{echo.remove();timers.delete(timer);},550);timers.add(timer);
    layer.classList.add('pressed');
  }
  const release=()=>layer.classList.remove('pressed');
  const leave=e=>{if(!e.relatedTarget)hide();};
  const keyboard=e=>{if(e.key==='Tab')hide();};
  const visibility=()=>{if(document.hidden)hide();};
  const modalGuard=()=>{if(document.querySelector('dialog[open]'))hide();};
  const focusGuard=e=>{if(e.target.closest('input,textarea,select,[contenteditable],dialog'))hide();};
  document.addEventListener('pointermove',move,{passive:true});document.addEventListener('pointerdown',click,{passive:true});document.addEventListener('pointerup',release,{passive:true});document.addEventListener('pointercancel',release,{passive:true});document.addEventListener('pointerout',leave,{passive:true});document.addEventListener('keydown',keyboard);document.addEventListener('visibilitychange',visibility);window.addEventListener('blur',hide);fine.addEventListener('change',hide);motion.addEventListener('change',hide);
  document.addEventListener('click',modalGuard);
  document.addEventListener('focusin',focusGuard);document.addEventListener('pointerover',move,{passive:true});
  return()=>{hide();timers.forEach(clearTimeout);layer.remove();document.removeEventListener('focusin',focusGuard);document.removeEventListener('pointerover',move);document.removeEventListener('click',modalGuard);document.removeEventListener('pointermove',move);document.removeEventListener('pointerdown',click);document.removeEventListener('pointerup',release);document.removeEventListener('pointercancel',release);document.removeEventListener('pointerout',leave);document.removeEventListener('keydown',keyboard);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('blur',hide);fine.removeEventListener('change',hide);motion.removeEventListener('change',hide);};
}

function animate() {
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const fine=matchMedia('(pointer:fine)').matches;
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('revealed');observer.unobserve(entry.target);}
  }),{threshold:0.08});
  document.querySelectorAll('.reveal').forEach(section=>{
    if(!motion.matches){section.classList.add('reveal-ready');observer.observe(section);}
  });
  const unmountCursor=mountStudioCursor();
  const unmountPlayground=mountPlayground(document.querySelector('#playground'));
  let scrollFrame=0,pointerFrame=0,lastPointer=null;
  const progress=()=>{
    scrollFrame=0;
    document.querySelector('.header')?.classList.toggle('scrolled',scrollY>30);
    const available=document.documentElement.scrollHeight-innerHeight;
    document.querySelector('.reading-progress')?.style.setProperty('--progress',available>0?Math.min(1,scrollY/available):0);
    if(motion.matches)return;
    document.querySelectorAll('.project-image').forEach(image=>{
      const r=image.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;
      image.style.setProperty('--image-shift',`${Math.max(-12,Math.min(12,(innerHeight*.5-r.top-r.height*.5)*.035))}px`);
    });
    const about=document.querySelector('.about-section');
    if(about){const r=about.getBoundingClientRect();if(r.bottom>0&&r.top<innerHeight)about.style.setProperty('--scroll-turn',`${(innerHeight*.5-r.top)*.025}deg`);}
  };
  const onScroll=()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(progress);};
  window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('resize',onScroll,{passive:true});progress();
  const paintPointer=()=>{
    pointerFrame=0;if(!lastPointer||motion.matches)return;
    const {target,x,y}=lastPointer;
    const card=target.closest('.project-card');
    if(card){const image=card.querySelector('.project-image'),r=image.getBoundingClientRect();
      image.style.setProperty('--cursor-x',`${Math.max(50,Math.min(r.width-50,x-r.left))}px`);
      image.style.setProperty('--cursor-y',`${Math.max(30,Math.min(r.height-30,y-r.top))}px`);
      image.style.setProperty('--tilt-x',`${-((y-r.top)/r.height-.5)*3}deg`);
      image.style.setProperty('--tilt-y',`${((x-r.left)/r.width-.5)*3}deg`);
    }
    const magnet=target.closest('.button,.nav-contact');
    if(magnet){const r=magnet.getBoundingClientRect();magnet.style.setProperty('--magnet-x',`${(x-r.left-r.width/2)*.045}px`);magnet.style.setProperty('--magnet-y',`${(y-r.top-r.height/2)*.1}px`);}
    const contact=target.closest('.contact');
    if(contact){const r=contact.getBoundingClientRect();contact.style.setProperty('--glow-x',`${x-r.left}px`);contact.style.setProperty('--glow-y',`${y-r.top}px`);}
  };
  const pointer=e=>{if(motion.matches||!fine||e.pointerType!=='mouse')return;lastPointer={target:e.target,x:e.clientX,y:e.clientY};if(!pointerFrame)pointerFrame=requestAnimationFrame(paintPointer);};
  const out=e=>{const magnet=e.target.closest('.button,.nav-contact');if(magnet&&!magnet.contains(e.relatedTarget)){magnet.style.setProperty('--magnet-x','0px');magnet.style.setProperty('--magnet-y','0px');}};
  document.addEventListener('pointermove',pointer,{passive:true});document.addEventListener('pointerout',out,{passive:true});
  cleanup=()=>{unmountCursor();observer.disconnect();unmountPlayground();cancelAnimationFrame(scrollFrame);cancelAnimationFrame(pointerFrame);window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',onScroll);document.removeEventListener('pointermove',pointer);document.removeEventListener('pointerout',out);};
}
render();
