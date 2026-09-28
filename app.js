const adjectives=["big","small","tall","short","long","strong","fast","slow","heavy","light","colourful","friendly"];
const comparatives=["bigger","smaller","taller","shorter","longer","stronger","faster","slower","heavier","lighter"];
const reasons=["it is colourful","it is friendly","it is strong","it is fast","it is special"];
let selectedAdj=[], selectedComp="", selectedReason="", selectedWorld="land", imageData="";
const $=s=>document.querySelector(s);

function makeChips(id,items,type){
  const box=$(id);
  items.forEach(word=>{
    const b=document.createElement("button"); b.className="chip"; b.textContent=word;
    b.onclick=()=>{
      if(type==="adj"){
        if(selectedAdj.includes(word)){selectedAdj=selectedAdj.filter(x=>x!==word);b.classList.remove("selected")}
        else if(selectedAdj.length<2){selectedAdj.push(word);b.classList.add("selected")}
        $("#adjHint").textContent=`${selectedAdj.length}/2 selected`;
      } else {
        box.querySelectorAll(".chip").forEach(x=>x.classList.remove("selected"));
        b.classList.add("selected");
        if(type==="comp") selectedComp=word; else selectedReason=word;
      }
    }; box.appendChild(b);
  });
}
makeChips("#adjBank",adjectives,"adj"); makeChips("#compBank",comparatives,"comp"); makeChips("#reasonBank",reasons,"reason");

$("#fileInput").addEventListener("change",e=>{
  const f=e.target.files[0]; if(!f)return;
  const reader=new FileReader();

  reader.onload=()=>{
    const img=new Image();

    img.onload=()=>{
      const maxSide=1400;
      const scale=Math.min(1,maxSide/Math.max(img.naturalWidth,img.naturalHeight));
      const canvas=document.createElement("canvas");
      canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));
      canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));

      const ctx=canvas.getContext("2d",{willReadFrequently:true});
      ctx.drawImage(img,0,0,canvas.width,canvas.height);

      const frame=ctx.getImageData(0,0,canvas.width,canvas.height);
      const px=frame.data;

      // Automatically remove white / near-white paper.
      // A soft transparent edge helps prevent a white halo.
      for(let i=0;i<px.length;i+=4){
        const red=px[i], green=px[i+1], blue=px[i+2];
        const brightest=Math.max(red,green,blue);
        const darkest=Math.min(red,green,blue);
        const brightness=(red+green+blue)/3;
        const colourRange=brightest-darkest;

        if(brightness>=246 && colourRange<20){
          px[i+3]=0;
        }else if(brightness>=225 && colourRange<24){
          px[i+3]=Math.max(0,Math.min(255,Math.round(255*(246-brightness)/21)));
        }
      }

      ctx.putImageData(frame,0,0);
      imageData=canvas.toDataURL("image/png");

      $("#preview").src=imageData;
      $("#previewWrap").classList.remove("hidden");
      msg("✨ White background removed — your creature is ready!");
    };

    img.src=reader.result;
  };

  reader.readAsDataURL(f);
});
document.querySelectorAll(".world").forEach(b=>b.onclick=()=>{
  document.querySelectorAll(".world").forEach(x=>x.classList.remove("active"));b.classList.add("active");
  selectedWorld=b.dataset.world;$("#habitatLabel").textContent=selectedWorld==="land"?"🌿 Land selected":"🌊 Ocean selected";
});
$("#releaseBtn").onclick=()=>{
  const name=$("#nameInput").value.trim(), animal=$("#animalInput").value.trim();
  if(!imageData)return msg("Please scan or upload your creature first.");
  if(!name)return msg("Give your creature a name.");
  if(selectedAdj.length!==2)return msg("Choose exactly 2 adjectives.");
  if(!selectedComp||!animal)return msg("Complete the comparison mission.");
  if(!selectedReason)return msg("Choose why you like your creature.");
  const data={name,animal,adj:[...selectedAdj],comp:selectedComp,reason:selectedReason,world:selectedWorld,img:imageData};
  addCreature(data); saveCreature(data); msg(`✨ ${name} has entered the ${selectedWorld==="land"?"land":"ocean"} world!`);
};
function msg(t){$("#status").textContent=t}
function addCreature(d){
  const b=document.createElement("button"); b.className=`creature ${d.world}`;
  const img=document.createElement("img"); img.src=d.img; img.alt=d.name;b.appendChild(img);
  const x=8+Math.random()*72, y=d.world==="land"?(8+Math.random()*28):(58+Math.random()*25);
  b.style.left=x+"%";b.style.top=y+"%";b.style.animationDelay=(-Math.random()*3)+"s";
  b.onclick=()=>showProfile(d);$("#creatureLayer").appendChild(b);
}
function showProfile(d){
  $("#profileImg").src=d.img;$("#profileName").textContent=d.name;
  $("#profileDescribe").textContent=`It is ${d.adj[0]} and ${d.adj[1]}.`;
  $("#profileCompare").textContent=`It is ${d.comp} than a ${d.animal}.`;
  $("#profileReason").textContent=`I like my creature because ${d.reason.replace(/^it is /,"it is ")}.`;
  $("#profile").classList.remove("hidden");
}
$("#closeProfile").onclick=()=>$("#profile").classList.add("hidden");
function saveCreature(d){
  try{const old=JSON.parse(localStorage.getItem("wild-creatures")||"[]");old.push(d);localStorage.setItem("wild-creatures",JSON.stringify(old.slice(-20)))}catch(e){}
}
try{JSON.parse(localStorage.getItem("wild-creatures")||"[]").forEach(addCreature)}catch(e){}
$("#fullBtn").onclick=()=>{if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();else document.exitFullscreen?.()};
