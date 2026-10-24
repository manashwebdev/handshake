(()=>{
const q=s=>document.querySelector(s),R=n=>"₹"+n.toLocaleString("en-IN"),E=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])),
reduce=matchMedia("(prefers-reduced-motion:reduce)").matches,fineP=matchMedia("(hover:hover) and (pointer:fine)").matches,
V=["lv","av","dv"],TT={lv:"Handshake: your deal, one link",av:"Log in · Handshake",dv:"Dashboard · Handshake"},AUTH=["login","signup","dashboard"];
let view="lv",mode="login",flt="all",sid=0,user=null,deals=[];
async function api(p,o={}){const r=await fetch("/api"+p,{method:o.method||"GET",headers:o.body?{"Content-Type":"application/json"}:{},body:o.body?JSON.stringify(o.body):undefined,credentials:"same-origin"});
let d={};try{d=await r.json()}catch(e){}if(!r.ok){const x=new Error(d.error||"Something went wrong.");x.status=r.status;throw x}return d}
const boot=api("/me").then(d=>{user=d.user;const a=q('nav a[href="#login"]');if(a){a.textContent="Dashboard";a.setAttribute("href","#dashboard")}}).catch(()=>{user=null});
/* smooth scroll */
const yOf=el=>Math.max(0,el.getBoundingClientRect().top+scrollY-72);
function sm(y){const my=++sid,s=scrollY,d=Math.min(y,document.documentElement.scrollHeight-innerHeight)-s;
if(reduce||Math.abs(d)<2){scrollTo({top:s+d,behavior:"instant"});return}
const D=Math.min(1200,450+Math.abs(d)*.22),t0=performance.now();
(function f(t){if(my!=sid)return;const p=Math.min(1,(t-t0)/D),e=p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;scrollTo({top:s+d*e,behavior:"instant"});if(p<1)requestAnimationFrame(f)})(t0)}
let tg=scrollY,cur=scrollY,wr=0;
function tick(){cur+=(tg-cur)*.12;if(Math.abs(tg-cur)<.5){cur=tg;wr=0}scrollTo({top:cur,behavior:"instant"});if(wr)wr=requestAnimationFrame(tick)}
addEventListener("wheel",e=>{if(reduce||!fineP||e.ctrlKey||view!="lv")return;e.preventDefault();sid++;if(!wr)tg=cur=scrollY;
tg=Math.max(0,Math.min(tg+e.deltaY*(e.deltaMode==1?16:1),document.documentElement.scrollHeight-innerHeight));if(!wr)wr=requestAnimationFrame(tick)},{passive:false});
addEventListener("scroll",()=>{if(!wr){tg=cur=scrollY}},{passive:true});
/* routing */
function show(v){view=v;V.forEach(i=>q("#"+i).hidden=i!=v);q("#pg").style.display=v=="lv"?"":"none";document.title=TT[v]}
async function route(h){await boot;
if(h=="dashboard"){if(!user)return go("login");show("dv");await renderD();scrollTo(0,0);return}
if(h=="login"||h=="signup"){if(user)return go("dashboard");show("av");setMode(h);scrollTo(0,0);return}
const was=view,t=h&&h!="top"?document.getElementById(h):null;show("lv");
if(was=="lv")return;scrollTo({top:t?yOf(t):0,behavior:"instant"})}
function go(h){try{history.replaceState(null,"","#"+h)}catch(e){}return route(h)}
window.hsGo=go;
document.addEventListener("click",async e=>{
const a=e.target.closest('a[href^="#"]');
if(a){const h=a.getAttribute("href").slice(1),t=h&&document.getElementById(h);
if(AUTH.includes(h)){e.preventDefault();go(h)}
else if(t){e.preventDefault();view!="lv"?go(h):sm(h=="top"?0:yOf(t))}}
if(e.target.id=="lo"){try{await api("/auth/logout",{method:"POST"})}catch(x){}user=null;deals=[];go("top")}
const f=e.target.closest("[data-f]");if(f){flt=f.dataset.f;draw()}
if(e.target.closest("[data-up]")){try{user=(await api("/billing/upgrade",{method:"POST"})).user;draw()}catch(x){const m=q("#ple");if(m)m.textContent=x.message}}
const b=e.target.closest("[data-a]");
if(b){b.disabled=true;try{await api("/deals/"+b.dataset.id+"/"+b.dataset.a,{method:"POST"})}catch(x){}await renderD()}});
addEventListener("hashchange",()=>{const h=location.hash.slice(1);if(AUTH.includes(h))route(h)});
/* auth */
const err=m=>{q("#xe").textContent=m};
function setMode(m){mode=m;const s=m=="signup",f=q("#xf");
q("#xm input[value="+m+"]").checked=true;q("#nmw").hidden=!s;q("#rlw").hidden=!s;
q("#xt").textContent=s?"Create your account":"Welcome back";
q("#xs").textContent=s?"Free to start. No credit card required.":"Log in to see your proposals and payments.";
q("#xb").textContent=s?"Create account":"Log in";f.pw.autocomplete=s?"new-password":"current-password";err("");
if(s&&window.hsPre){f.em.value=window.hsPre;window.hsPre=""}}
document.addEventListener("change",e=>{if(e.target.name=="m")go(e.target.value)});
q("#xf").addEventListener("submit",async e=>{e.preventDefault();const f=e.target,b=q("#xb");err("");
const body={email:f.em.value.trim(),password:f.pw.value};if(mode=="signup"){body.name=f.nm.value.trim();body.role=f.rl.value}
b.disabled=true;
try{user=(await api("/auth/"+mode,{method:"POST",body})).user;f.reset();go("dashboard")}catch(x){err(x.message)}finally{b.disabled=false}});
/* dashboard */
const due=d=>Math.round(d.total*d.deposit/100);
async function renderD(){if(!user)return go("login");
try{deals=(await api("/deals")).deals}catch(x){if(x.status==401){user=null;return go("login")}deals=[]}
draw()}
function draw(){if(!user)return;const u=user,all=deals,cl=u.role=="client",
sum=(f,g)=>all.filter(f).reduce((a,d)=>a+g(d),0),h=new Date().getHours();
q("#dh").textContent=(h<12?"Good morning":h<17?"Good afternoon":"Good evening")+", "+u.name.split(" ")[0]+"!";
q("#who").textContent=u.name;q("#rc").textContent=cl?"Client":"Freelancer";
q("#dsub").textContent=cl?"Proposals sent to you. Approve, then pay by UPI.":"Your proposals and payments in one place.";
const pro=u.plan=="pro",act=all.filter(d=>d.status!="paid").length;
q("#pl").innerHTML=cl?"":`<span class="pill ${pro?"v":""}">${pro?"Pro plan":"Free plan"}</span> <small class="mut">${pro?"Unlimited proposals":act+" of "+u.limit+" active proposals used"}</small>${pro?"":` <button class="btn o s" data-up="1" style="margin-left:6px">Upgrade to Pro</button>`}<small class="mut" id="ple" style="display:block;margin-top:6px"></small>`;
const S=cl?[["Waiting for your yes",sum(d=>d.status=="sent",d=>d.total)],["To pay",sum(d=>d.status=="approved",due)],["Paid",sum(d=>d.status=="paid",due)]]:[["Total in proposals",sum(()=>1,d=>d.total)],["Awaiting payment",sum(d=>d.status=="approved",due)],["Received",sum(d=>d.status=="paid",due)]];
q("#sg").innerHTML=S.map(([l,v])=>`<div class="cd"><small class="mut">${l}</small><div class="big">${R(v)}</div></div>`).join("");
q("#nw").hidden=cl;q("#dg").classList.toggle("f",!cl);
const n=k=>all.filter(d=>k=="all"||d.status==k).length;
q("#fx").innerHTML=["all","sent","approved","paid"].map(k=>`<button class="pill" data-f="${k}" aria-pressed="${flt==k}">${k[0].toUpperCase()+k.slice(1)} · ${n(k)}</button>`).join("");
const L=all.filter(d=>flt=="all"||d.status==flt);
q("#dl").innerHTML=L.length?L.map(d=>{const c={sent:"cs",approved:"ca",paid:"cp"}[d.status];let a;
if(cl&&d.status=="sent")a=`<button class="btn s" data-a="approve" data-id="${E(d.id)}">Approve</button>`;
else if(cl&&d.status=="approved")a=`<button class="btn s" data-a="pay" data-id="${E(d.id)}">Pay ${R(due(d))}</button>`;
else if(d.status=="paid")a=`<small class="mut">Receipt HS-${E(d.id.slice(-6).toUpperCase())}</small>`;
else a=`<small class="mut">${d.status=="sent"?"Waiting for client approval":"Waiting for payment"}</small>`;
return`<div class="xdl"><div><b style="font-weight:500">${E(d.title)}</b><small class="mut" style="display:block">${cl?"From "+E(d.owner?d.owner.name:""):E(d.clientName)+" · "+E(d.clientEmail)}</small></div><div><span class="chip ${c}">${d.status[0].toUpperCase()+d.status.slice(1)}</span><div>${R(d.total)}</div></div><small class="mut">${d.deposit}% upfront · ${R(due(d))}</small><div>${a}</div></div>`}).join(""):`<p class="mut" style="margin-top:14px">${cl?"Nothing here yet. Proposals sent to your email will show up here.":"No proposals here yet. Send your first one."}</p>`}
q("#nf").addEventListener("submit",async e=>{e.preventDefault();const f=e.target;q("#ne").textContent="";
try{await api("/deals",{method:"POST",body:{title:f.ti.value,clientName:f.cn.value,clientEmail:f.ce2.value,total:f.tt.value,deposit:f.dp.value}});f.reset();flt="all";await renderD()}
catch(x){q("#ne").textContent=x.message}});
const h0=location.hash.slice(1);if(AUTH.includes(h0))route(h0);
})();
