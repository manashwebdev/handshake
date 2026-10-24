const $=s=>document.querySelector(s),fmt=n=>"₹"+n.toLocaleString("en-IN"),IT=[["Logo and brand kit",12000],["Landing page",25000],["Monthly upkeep",4000]];
let st="sent",who="Riya Sharma";
function qr(seed,n=25){let s=seed|1,o="";const r=()=>(s=(s*1664525+1013904223)>>>0)/4294967296;
for(let y=0;y<n;y++)for(let x=0;x<n;x++){let on;
if((x<8&&y<8)||(x>n-9&&y<8)||(x<8&&y>n-9)){const a=x<8?x:x-(n-8),b=y<8?y:y-(n-8),d=Math.max(Math.abs(a-3),Math.abs(b-3));on=a<7&&b<7&&(d==3||d<=1)}else on=r()>.5;
if(on)o+=`<rect x="${x}" y="${y}" width="1" height="1"/>`}
return `<svg class="qr" viewBox="-1 -1 ${n+2} ${n+2}" role="img" aria-label="Demo UPI QR code" fill="#0C0A29">${o}</svg>`}
function calc(){const c=[...document.querySelectorAll(".opt input")].map(i=>i.checked),rows=IT.filter((_,i)=>c[i]),t=rows.reduce((a,r)=>a+r[1],0),dep=+document.querySelector(".seg input:checked").value;return{rows,t,dep,due:Math.round(t*dep/100)}}
function rtop(){const{rows,t}=calc();
$("#items").innerHTML=rows.length?rows.map(r=>`<li>${r[0]}<b style="font-weight:500">${fmt(r[1])}</b></li>`).join(""):"<li>Pick at least one item</li>";
$("#tot").textContent=fmt(t);chk();side()}
function chk(){const a=$("#ap");if(a)a.disabled=!($("#ac").checked&&$("#nm").value.trim()&&calc().t>0)}
function side(){const{t,due}=calc(),i=["sent","approved","paid"].indexOf(st);
$("#ring").style.setProperty("--r",i==2&&t?Math.round(due/t*100):0);$("#rv").textContent=fmt(i==2?due:0);
$("#s1").textContent=i==0?"Sent, waiting for approval":"Approved by "+who;
$("#s2").textContent=["Not due yet","Waiting for "+fmt(due),"Received "+fmt(due)][i];
$("#s3").textContent=i==2?"HS-2026-0001, marked paid":"Created after payment"}
function act(){const{t,due,dep}=calc(),a=$("#act"),i=["sent","approved","paid"].indexOf(st),th=$("#th"),bal=dep<100?`<small>Balance of ${fmt(t-due)} is due on delivery.</small>`:"";
th.style.setProperty("--p",i/2);th.querySelectorAll("span").forEach((s,k)=>s.classList.toggle("on",k<=i));
$("#fs").disabled=st!="sent";$("#rs").style.display=st=="sent"?"none":"inline-flex";
$("#hint").textContent=["This is the client’s view. Approve it on the phone.","Approved. The same link now asks for payment.","Paid. The invoice was created and marked paid."][i];
if(st=="sent")a.innerHTML=`<label>Your name<input type="text" id="nm" value="${who}" autocomplete="off"></label><label class="ck"><input type="checkbox" id="ac"> I accept this proposal and its terms.</label><button class="btn" id="ap" disabled>Approve proposal</button>`;
if(st=="approved")a.innerHTML=`<small>${dep<100?dep+"% deposit":"Full payment"}, by any UPI app</small><b style="display:block;font-size:1.4rem;font-weight:500">${fmt(due)}</b>${qr(due)}<button class="btn" id="pay">Simulate payment</button>${bal}`;
if(st=="paid")a.innerHTML=`<div class="paid"><svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="#16B364"/><path d="M19 33l9 9 17-19" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg><h3 style="margin-top:10px">Paid ${fmt(due)}</h3><p class="mut" style="margin:6px 0">Receipt HS-2026-0001</p>${bal}</div>`;
$("#stamp").classList.toggle("go",st!="sent");side()}
document.addEventListener("change",e=>{if(e.target.closest(".opt,.seg"))rtop();if(e.target.id=="ac")chk()});
document.addEventListener("input",e=>{if(e.target.id=="nm")chk()});
document.addEventListener("click",e=>{const id=e.target.id;
if(id=="ap"){who=$("#nm").value.trim();st="approved";act()}
if(id=="pay"){st="paid";act()}
if(id=="rs"){st="sent";act();rtop()}});
rtop();act();
$("#em").addEventListener("submit",e=>{e.preventDefault();window.hsPre=e.target.querySelector("input").value;window.hsGo("signup")});
const sc=[...document.querySelectorAll(".sc")],dt=[...document.querySelectorAll("#dots button")];
function show(k){sc.forEach((c,i)=>{let p=(i-k+3)%3;c.dataset.p=p==2?-1:p});dt.forEach((d,i)=>d.setAttribute("aria-current",i==k))}
dt.forEach((d,i)=>d.onclick=()=>show(i));show(0);
const rm=matchMedia("(prefers-reduced-motion:reduce)").matches,fine=matchMedia("(hover:hover) and (pointer:fine)").matches,hero=$(".hero"),lap=$(".lap");
let ci=0,hold=false,tk=0;hero.classList.add("go");
dt.forEach((d,i)=>d.addEventListener("click",()=>{ci=i}));
$("#cr").addEventListener("pointerenter",()=>hold=true);$("#cr").addEventListener("pointerleave",()=>hold=false);
if(!rm)setInterval(()=>{if(!hold&&!document.hidden){ci=(ci+1)%3;show(ci)}},4200);
if(!rm){
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){const t=e.target;t.classList.add("in","go");setTimeout(()=>t.style.transitionDelay="0s",1600);io.unobserve(t)}}),{threshold:.15});
document.querySelectorAll(".ctr .pill,.ctr h2,.ctr>p,.why>div,.cr,.dm,.logos span,.cap,.stage .pill,.stage h2,.em,.lap").forEach(el=>{el.classList.add("rv");el.style.transitionDelay=([...el.parentNode.children].indexOf(el)%5)*80+"ms";io.observe(el)});
document.querySelectorAll(".stage,.vis").forEach(el=>io.observe(el));
}else document.querySelectorAll(".stage,.vis").forEach(el=>el.classList.add("go"));
if(!rm&&fine){
document.querySelectorAll(".dm>.cd,.ph,.vis .cd,.lap").forEach(el=>{el.dataset.t=1;
el.addEventListener("pointermove",e=>{const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;el.style.setProperty("--rx",(x*9).toFixed(2)+"deg");el.style.setProperty("--ry",(-y*9).toFixed(2)+"deg")});
el.addEventListener("pointerleave",()=>{el.style.setProperty("--rx","0deg");el.style.setProperty("--ry","0deg")})});
hero.addEventListener("pointermove",e=>{const r=hero.getBoundingClientRect();hero.style.setProperty("--mx",((e.clientX-r.left)/r.width-.5)*2);hero.style.setProperty("--my",((e.clientY-r.top)/r.height-.5)*2)});
hero.addEventListener("pointerleave",()=>{hero.style.setProperty("--mx",0);hero.style.setProperty("--my",0)});
}
const pg=document.createElement("div");pg.id="pg";document.body.append(pg);
function upd(){tk=0;const max=document.documentElement.scrollHeight-innerHeight;pg.style.transform=`scaleX(${max>0?scrollY/max:0})`;
if(!rm){const r=lap.getBoundingClientRect();lap.style.setProperty("--lp",Math.min(1,Math.max(0,(innerHeight-r.top)/(innerHeight*.7))))}}
addEventListener("scroll",()=>{if(!tk)tk=requestAnimationFrame(upd)},{passive:true});addEventListener("resize",upd);upd();
