(function(){
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const root=document.documentElement;
$('#theme').onclick=()=>{root.dataset.theme=root.dataset.theme==='light'?'dark':'light'};
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('show'),1800)}
$$('[data-copy]').forEach(b=>b.onclick=async()=>{try{await navigator.clipboard.writeText(b.dataset.copy);toast('Copied '+b.dataset.copy)}catch(e){toast(b.dataset.copy)}});
// nav + scrollspy
const secs=$$('main section');
$('#nav').innerHTML=secs.map(s=>`<li><a href="#${s.id}" data-id="${s.id}">${s.querySelector('h2').textContent}</a></li>`).join('');
const links=$$('#nav a');
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)links.forEach(l=>{const on=l.dataset.id===e.target.id;l.classList.toggle('on',on);if(on)l.setAttribute('aria-current','true');else l.removeAttribute('aria-current')})}),{rootMargin:'-30% 0px -60% 0px'});
secs.forEach(s=>io.observe(s));
// counters
const cio=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting)return;cio.unobserve(e.target);const el=e.target,n=+el.dataset.n,d=+el.dataset.d,p=el.dataset.plus?'+':'';
if(matchMedia('(prefers-reduced-motion:reduce)').matches){el.textContent=n.toLocaleString('en-AU',{minimumFractionDigits:d,maximumFractionDigits:d})+p;return}
const t0=performance.now();(function f(t){const k=Math.min(1,(t-t0)/1100),v=n*(1-Math.pow(1-k,3));el.textContent=v.toLocaleString('en-AU',{minimumFractionDigits:d,maximumFractionDigits:d})+(k===1?p:'');if(k<1)requestAnimationFrame(f)})(t0)}));
$$('[data-n]').forEach(e=>cio.observe(e));
// skills
const G={'Languages':['Python','JavaScript','SQL','R','HTML','CSS','C'],'Development':['Git/GitHub','Godot (GDScript)','Responsive web','DOM manipulation','REST APIs'],'Data and cloud':['Google Cloud','BigQuery','Tableau'],'3D and game':['Unity','Maya','Blender','Substance Painter']};
const K={'Git/GitHub':'git','Godot (GDScript)':'godot','Substance Painter':'substance'};
let cur=Object.keys(G)[0],sel=null;
const projs=$$('.proj');
function tabs(){$('#tabs').innerHTML=Object.keys(G).map(k=>`<button class="tab" role="tab" aria-selected="${k===cur}" data-k="${k}">${k}</button>`).join('');$$('.tab').forEach(t=>t.onclick=()=>{cur=t.dataset.k;tabs();chips()})}
function chips(){$('#chips').innerHTML=G[cur].map(n=>{const k=K[n]||n.toLowerCase();return`<button class="chip" aria-pressed="${sel&&sel.k===k}" data-k="${k}" data-n="${n}">${n}</button>`}).join('');
$$('.chip').forEach(c=>c.onclick=()=>{const k=c.dataset.k;sel=sel&&sel.k===k?null:{k,n:c.dataset.n};chips();apply()})}
function apply(){let n=0;projs.forEach(p=>{const m=!sel||p.dataset.s.split(',').includes(sel.k);p.classList.toggle('dim',!m);p.classList.toggle('hit',!!sel&&m);if(m)n++});
const h=$('#hint');if(!sel){h.textContent='Select a skill to see which projects use it.';return}
h.innerHTML=(n?`${n} project${n>1?'s':''} highlighted for ${sel.n}. `:`No listed project uses ${sel.n} yet. `)+'<button id="clr">Clear</button> '+(n?'<button id="go">Jump to projects</button>':'');
$('#clr').onclick=()=>{sel=null;chips();apply()};const g=$('#go');if(g)g.onclick=()=>$('#projects').scrollIntoView()}
tabs();chips();
// expanders
function wire(sel,box){$$(sel).forEach(b=>b.addEventListener('click',()=>{const c=b.closest(box),o=!c.classList.contains('open');c.classList.toggle('open',o);b.setAttribute('aria-expanded',o);const t=b.querySelector('.tog');if(t)t.textContent=o?'Hide':'Details'}))}
wire('.proj .head','.proj');wire('.item button','.item');

// playful role cycle + sparkles
const roles=['Data Science and AI student','Game developer','3D artist','Piano player'];let ri=0;
const rt=$('#roleTxt'),wv=$('#wave');
function nextRole(){rt.classList.add('out');setTimeout(()=>{ri=(ri+1)%roles.length;rt.textContent=roles[ri];rt.classList.remove('out')},250)}
$('#role').onclick=()=>{nextRole();wv.classList.remove('go');void wv.offsetWidth;wv.classList.add('go')};
if(!matchMedia('(prefers-reduced-motion:reduce)').matches)setInterval(nextRole,3500);
function spark(x,y){if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;for(let i=0;i<7;i++){const e=document.createElement('span');e.className='spark';e.textContent=['🌿','🍃','🌸'][i%3];e.style.left=x+'px';e.style.top=y+'px';document.body.appendChild(e);requestAnimationFrame(()=>{e.style.transform=`translate(${(Math.random()-.5)*120}px,${-30-Math.random()*90}px)`;e.style.opacity=0});setTimeout(()=>e.remove(),900)}}
$$('[data-copy]').forEach(b=>b.addEventListener('click',e=>spark(e.clientX||b.getBoundingClientRect().left+20,e.clientY||b.getBoundingClientRect().top)));
})();
