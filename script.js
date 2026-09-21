const screens=["welcome","draw","upload","life","profile","language","final"];
const adjectives=["big","small","tall","strong","fast","colourful","friendly","scary","long","heavy"];
let current=0, imageData="", scale=1, pos={x:0,y:0}, selected=[];
const dots=document.getElementById("stepDots");
for(let i=0;i<6;i++){let d=document.createElement("i");d.className="dot"+(i===0?" on":"");dots.appendChild(d)}
function progress(step){
  const n=Math.min(step+1,6), pct=Math.round(n/6*100);
  document.getElementById("progressLabel").textContent=step>=6?"Adventure complete!":`Mission ${n} of 6`;
  document.getElementById("progressPct").textContent=pct+"%";
  document.getElementById("progressBar").style.width=pct+"%";
  [...dots.children].forEach((d,i)=>d.classList.toggle("on",i<n));
}
function go(n){
  document.getElementById("screen-"+screens[current]).classList.remove("active");
  current=n; document.getElementById("screen-"+screens[current]).classList.add("active");
  progress(n); window.scrollTo({top:0,behavior:"smooth"});
}
const input=document.getElementById("fileInput");
input.addEventListener("change",e=>{
  const f=e.target.files[0]; if(!f)return;
  const r=new FileReader();
  r.onload=ev=>{
    imageData=ev.target.result;
    const p=document.getElementById("preview");p.src=imageData;p.style.display="block";
    document.getElementById("uploadIcon").style.display="none";
    document.getElementById("uploadTitle").textContent="Great drawing!";
    document.getElementById("uploadNext").disabled=false;
    document.getElementById("lifePreview").src=imageData;
    document.getElementById("creature3d").src=imageData;
    document.getElementById("finalImage").src=imageData;
  };r.readAsDataURL(f);
});
function bringToLife(){
  const b=document.getElementById("lifeBtn"),t=document.getElementById("lifeText");
  b.disabled=true;b.textContent="🌿 WILD MAGIC IN PROGRESS...";
  let messages=["Reading your creature...","Adding wild energy...","Opening the digital habitat...","Your creature is alive!"];
  let i=0; const timer=setInterval(()=>{t.textContent=messages[i++];if(i===messages.length){clearInterval(timer);setTimeout(()=>go(4),650)}},650);
}
const bank=document.getElementById("wordBank");
adjectives.forEach(w=>{let b=document.createElement("button");b.className="word";b.textContent=w;b.type="button";b.onclick=()=>{b.classList.toggle("selected");selected=[...document.querySelectorAll(".word.selected")].map(x=>x.textContent);};bank.appendChild(b)});
["adj1","adj2"].forEach(id=>{const s=document.getElementById(id);adjectives.forEach(w=>s.add(new Option(w,w)))});
function profileNext(){
  if(!document.getElementById("creatureName").value.trim()){alert("Give your creature a name first! 🐾");return}
  if(selected.length){document.getElementById("adj1").value=selected[0];document.getElementById("adj2").value=selected[1]||selected[0]}
  document.getElementById("hasSentence").value=document.getElementById("hasText").value;
  document.getElementById("canSentence").value=document.getElementById("canText").value;
  go(5);
}
function finish(){
  const name=document.getElementById("creatureName").value.trim()||"My Creature";
  const a1=document.getElementById("adj1").value,a2=document.getElementById("adj2").value;
  const has=document.getElementById("hasSentence").value.trim()||"amazing features";
  const can=document.getElementById("canSentence").value.trim()||"do amazing things";
  const comp=document.getElementById("compareAdj").value, animal=document.getElementById("compareAnimal").value.trim()||"lion";
  const reason=document.getElementById("reason").value.trim()||"it is unique";
  document.getElementById("finalName").textContent=name;
  document.getElementById("finalDescription").textContent=`${name} is ${a1} and ${a2}. It has ${has}. It can ${can}.`;
  document.getElementById("finalCompare").textContent=`It is ${comp} than a ${animal}.`;
  document.getElementById("finalReason").textContent=`I like my creature because ${reason}.`;
  go(6);
}
const viewer=document.getElementById("viewer"),creature=document.getElementById("creature3d");let drag=false,start={x:0,y:0};
function render(){creature.style.transform=`translate(${pos.x}px,${pos.y}px) scale(${scale})`}
viewer.addEventListener("pointerdown",e=>{drag=true;start={x:e.clientX-pos.x,y:e.clientY-pos.y};viewer.setPointerCapture(e.pointerId)});
viewer.addEventListener("pointermove",e=>{if(!drag)return;pos={x:e.clientX-start.x,y:e.clientY-start.y};render()});
viewer.addEventListener("pointerup",()=>drag=false);
function zoom(v){scale=Math.max(.5,Math.min(1.8,scale+v));render()}
function resetCreature(){scale=1;pos={x:0,y:0};render()}
function restart(){location.reload()}
progress(0);