const $=id=>document.getElementById(id);
const ADJECTIVES=["big","small","tall","short","long","strong","fast","slow","heavy","light","colourful","friendly"];
let selected=[], habitat="land", view="land", image=null;
let creatures=JSON.parse(localStorage.getItem("wildSeaLandV2")||"[]"), actors=[], raf;

const chips=$("adjectives");
ADJECTIVES.forEach(a=>{const b=document.createElement("button");b.className="chip";b.textContent=a;b.onclick=()=>{if(b.classList.contains("selected")){b.classList.remove("selected");selected=selected.filter(x=>x!==a)}else if(selected.length<2){b.classList.add("selected");selected.push(a)}update()};chips.appendChild(b)});

$("file").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{image=r.result;$("preview").src=image;$("previewBox").classList.remove("hidden");update()};r.readAsDataURL(f)};
["creatureName","ability","comparative","compareAnimal","why"].forEach(id=>$(id).addEventListener("input",update));
document.querySelectorAll(".hab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".hab").forEach(x=>x.classList.remove("active"));b.classList.add("active");habitat=b.dataset.hab;update()});

function update(){
 $("descSentence").textContent=selected.length===2?`My creature is ${selected[0]} and ${selected[1]}.`:"My creature is ___ and ___.";
 const cp=$("comparative").value, an=$("compareAnimal").value;
 $("compareSentence").textContent=cp&&an?`It is ${cp} than a ${an}.`:"It is ___ than a ___.";
 const ok=image&&$("creatureName").value.trim()&&selected.length===2&&$("ability").value&&cp&&an&&$("why").value.trim();
 $("release").disabled=!ok;
 $("status").textContent=ok?"✨ Mission complete! Your creature is ready to enter the Wild World.":"Complete every mission to unlock your creature.";
}

$("removeBg").onclick=()=>{if(!image)return;const im=new Image();im.onload=()=>{const c=$("canvas"),ctx=c.getContext("2d",{willReadFrequently:true}),s=Math.min(1,1000/Math.max(im.width,im.height));c.width=im.width*s;c.height=im.height*s;ctx.drawImage(im,0,0,c.width,c.height);const d=ctx.getImageData(0,0,c.width,c.height),a=d.data;for(let i=0;i<a.length;i+=4){let r=a[i],g=a[i+1],b=a[i+2],mx=Math.max(r,g,b),mn=Math.min(r,g,b);if(r>200&&g>200&&b>200&&mx-mn<42){let alpha=Math.max(0,Math.min(255,(255-Math.min(r,g,b))*5));a[i+3]=alpha}}ctx.putImageData(d,0,0);image=c.toDataURL("image/png");$("preview").src=image;$("removeBg").textContent="✓ Paper background processed"};im.src=image};

$("release").onclick=()=>{
 const c={id:crypto.randomUUID(),image,name:$("creatureName").value.trim(),adjs:[...selected],ability:$("ability").value,comparative:$("comparative").value,animal:$("compareAnimal").value,why:$("why").value.trim(),habitat};
 creatures.push(c);save();setView(habitat);render();flash(`${c.name} entered the ${habitat==="sea"?"Sea":"Land"} World! ✨`);
};

function save(){localStorage.setItem("wildSeaLandV2",JSON.stringify(creatures.slice(-40)))}
function setView(v){view=v;$("world").className="world "+v;$("landTab").classList.toggle("active",v==="land");$("seaTab").classList.toggle("active",v==="sea");render()}
$("landTab").onclick=()=>setView("land");$("seaTab").onclick=()=>setView("sea");

function render(){
 cancelAnimationFrame(raf);actors=[];$("world").querySelectorAll(".creature").forEach(e=>e.remove());
 const visible=creatures.filter(c=>c.habitat===view);$("empty").style.display=visible.length?"none":"flex";
 const box=$("world").getBoundingClientRect();
 visible.slice(-20).forEach((c,i)=>{
  const el=document.createElement("div"),w=105+Math.random()*75;el.className="creature";el.style.width=w+"px";el.style.height=w*.78+"px";
  el.innerHTML=`<img src="${c.image}" alt=""><div class="tag">${safe(c.name)}</div>`;el.onclick=()=>profile(c);$("world").appendChild(el);
  actors.push({el,c,x:20+Math.random()*Math.max(30,box.width-w-40),y:50+Math.random()*Math.max(60,box.height-w-120),vx:(.28+Math.random()*.42)*(Math.random()<.5?-1:1),vy:(Math.random()-.5)*(view==="sea"?.28:.12),w,h:w*.78,p:Math.random()*6.28});
 });
 $("count").textContent=`${creatures.length} Creature${creatures.length===1?"":"s"}`;
 $("cards").innerHTML="";creatures.slice(-15).forEach(c=>{const d=document.createElement("div");d.className="cardMini";d.innerHTML=`<img src="${c.image}"><b>${safe(c.name)} · ${c.habitat==="sea"?"🌊":"🌿"}</b>`;d.onclick=()=>{setView(c.habitat);setTimeout(()=>profile(c),100)};$("cards").appendChild(d)});
 animate();
}
function animate(){let last=performance.now();function tick(t){const box=$("world").getBoundingClientRect(),dt=Math.min(2,(t-last)/16.7);last=t;actors.forEach(a=>{a.x+=a.vx*dt;a.y+=a.vy*dt+Math.sin(t/(view==="sea"?650:900)+a.p)*(view==="sea"?.09:.035);if(a.x<5){a.x=5;a.vx=Math.abs(a.vx)}if(a.x+a.w>box.width-5){a.x=box.width-a.w-5;a.vx=-Math.abs(a.vx)}const top=25,bottom=box.height-a.h-45;if(a.y<top){a.y=top;a.vy=Math.abs(a.vy)}if(a.y>bottom){a.y=bottom;a.vy=-Math.abs(a.vy)}a.el.style.transform=`translate(${a.x}px,${a.y}px) scaleX(${a.vx<0?-1:1}) rotate(${Math.sin(t/900+a.p)*(view==="sea"?3:1.5)}deg)`});raf=requestAnimationFrame(tick)}raf=requestAnimationFrame(tick)}

function profile(c){$("pImg").src=c.image;$("pName").textContent=c.name;$("pHab").textContent=c.habitat==="sea"?"🌊 Sea Creature":"🌿 Land Creature";$("pDesc").textContent=`${c.name} is ${c.adjs[0]} and ${c.adjs[1]}. It can ${c.ability}.`;$("pCompare").textContent=`It is ${c.comparative} than a ${c.animal}.`;$("pWhy").textContent=c.why;$("profile").showModal()}
$("close").onclick=()=>$("profile").close();
$("full").onclick=()=>document.fullscreenElement?document.exitFullscreen():$("worldWrap")?.requestFullscreen?.();
$("reset").onclick=()=>{if(confirm("Remove all creatures from this browser?")){creatures=[];save();render()}};
$("demo").onclick=()=>{const sea=view==="sea";const svg="data:image/svg+xml,"+encodeURIComponent(sea?'<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180"><path d="M30 90 Q95 20 205 65 L270 25 250 90 270 145 205 112 Q95 160 30 90Z" fill="#ffb653" stroke="#173d54" stroke-width="8"/><circle cx="85" cy="78" r="9"/></svg>':'<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><ellipse cx="145" cy="110" rx="95" ry="55" fill="#e6a552" stroke="#274a32" stroke-width="8"/><circle cx="230" cy="75" r="38" fill="#e6a552" stroke="#274a32" stroke-width="8"/><circle cx="242" cy="67" r="6"/><path d="M75 150v42M125 155v40M175 155v40M215 145v45" stroke="#274a32" stroke-width="12"/></svg>');creatures.push({id:crypto.randomUUID(),image:svg,name:sea?"Sunfin":"Leafy",adjs:sea?["colourful","fast"]:["strong","friendly"],ability:sea?"swim":"run fast",comparative:sea?"faster":"bigger",animal:sea?"turtle":"monkey",why:"it is unique and friendly",habitat:view});save();render()};
function flash(msg){$("status").textContent=msg;setTimeout(update,2600)}
function safe(s){return String(s||"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]))}
render();