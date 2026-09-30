const adjectives=["big","small","tall","short","long","strong","fast","slow","heavy","light","colourful","friendly"];
const comparatives=["bigger","smaller","taller","shorter","longer","stronger","faster","slower","heavier","lighter"];
const reasons=["it is colourful","it is friendly","it is strong","it is fast","it is special"];

let selectedAdj=[],selectedComp="",selectedReason="",selectedWorld="land",imageData="",activeCreature=null;
const $=s=>document.querySelector(s);

const SUPABASE_URL="https://qobvrgqrutdqwgcthpsu.supabase.co";
const SUPABASE_KEY="sb_publishable_TTiSPzWGwpFI9Grcd9tKfA_TYRiDeVi";
const supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const IMAGE_FUNCTION="rapid-responder";
const displayedCreatures=new Set();

function makeChips(id,items,type){
  const box=$(id);
  items.forEach(word=>{
    const b=document.createElement("button");b.className="chip";b.textContent=word;
    b.onclick=()=>{
      if(type==="adj"){
        if(selectedAdj.includes(word)){selectedAdj=selectedAdj.filter(x=>x!==word);b.classList.remove("selected")}
        else if(selectedAdj.length<2){selectedAdj.push(word);b.classList.add("selected")}
        $("#adjHint").textContent=`${selectedAdj.length}/2 selected`;
      }else{
        box.querySelectorAll(".chip").forEach(x=>x.classList.remove("selected"));
        b.classList.add("selected");
        if(type==="comp")selectedComp=word;else selectedReason=word;
      }
    };
    box.appendChild(b);
  });
}
makeChips("#adjBank",adjectives,"adj");
makeChips("#compBank",comparatives,"comp");
makeChips("#reasonBank",reasons,"reason");

function processCreaturePhoto(file){
  if(!file)return;
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
      const frame=ctx.getImageData(0,0,canvas.width,canvas.height),px=frame.data;
      for(let i=0;i<px.length;i+=4){
        const r=px[i],g=px[i+1],b=px[i+2];
        const brightest=Math.max(r,g,b),darkest=Math.min(r,g,b);
        const brightness=(r+g+b)/3,colourRange=brightest-darkest;
        if(brightness>=246&&colourRange<20)px[i+3]=0;
        else if(brightness>=225&&colourRange<24)px[i+3]=Math.max(0,Math.min(255,Math.round(255*(246-brightness)/21)));
      }
      ctx.putImageData(frame,0,0);
      imageData=canvas.toDataURL("image/png");
      $("#preview").src=imageData;
      $("#previewWrap").classList.remove("hidden");
      msg("✨ White background removed — your creature is ready!");
    };
    img.src=reader.result;
  };
  reader.readAsDataURL(file);
}
$("#galleryInput").addEventListener("change",e=>processCreaturePhoto(e.target.files[0]));
$("#cameraInput").addEventListener("change",e=>processCreaturePhoto(e.target.files[0]));

document.querySelectorAll(".world").forEach(b=>b.onclick=()=>{
  document.querySelectorAll(".world").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");
  selectedWorld=b.dataset.world;
  $("#habitatLabel").textContent=selectedWorld==="land"?"🌿 Land selected":"🌊 Ocean selected";
});

function dataURLtoBlob(dataURL){
  const parts=dataURL.split(","),mime=parts[0].match(/:(.*?);/)[1],binary=atob(parts[1]);
  const bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  return new Blob([bytes],{type:mime});
}

$("#releaseBtn").onclick=async()=>{
  const studentName=$("#studentNameInput").value.trim();
  const name=$("#nameInput").value.trim(),animal=$("#animalInput").value.trim();
  if(!studentName)return msg("Please enter your name.");
  if(!imageData)return msg("Please take or upload a picture of your creature first.");
  if(!name)return msg("Give your creature a name.");
  if(selectedAdj.length!==2)return msg("Choose exactly 2 adjectives.");
  if(!selectedComp||!animal)return msg("Complete the comparison mission.");
  if(!selectedReason)return msg("Choose why you like your creature.");

  $("#releaseBtn").disabled=true;
  msg("🌍 Releasing your creature to the LIVE class habitat...");

  try{
    const blob=dataURLtoBlob(imageData);
    const safeStudent=studentName.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,30)||"explorer";
    const filePath=`live-class/${Date.now()}-${safeStudent}-${Math.random().toString(36).slice(2,8)}.png`;

    const {error:uploadError}=await supabaseClient.storage.from("creature-images").upload(filePath,blob,{contentType:"image/png",upsert:false});
    if(uploadError)throw uploadError;

    const {data,error}=await supabaseClient.from("creatures").insert({
      explorer_name:studentName,
      creature_name:name,
      drawing_url:filePath,
      adjective_1:selectedAdj[0],
      adjective_2:selectedAdj[1],
      comparative_adjective:selectedComp,
      compared_animal:animal,
      justification:selectedReason,
      habitat:selectedWorld
    }).select().single();
    if(error)throw error;

    await renderDatabaseCreature(data,true);
    msg(`✨ ${name} has entered the LIVE ${selectedWorld==="land"?"land":"ocean"} world!`);
  }catch(error){
    console.error("Release error:",error);
    msg("❌ Could not release creature: "+(error.message||"Please check the connection."));
  }finally{
    $("#releaseBtn").disabled=false;
  }
};

async function getCreatureImage(path){
  const {data,error}=await supabaseClient.functions.invoke(IMAGE_FUNCTION,{body:{path}});
  if(error)throw error;
  if(!data?.url)throw new Error("Creature image URL was not returned.");
  return data.url;
}

async function renderDatabaseCreature(row,animate=false){
  if(!row?.id||displayedCreatures.has(String(row.id)))return;
  try{
    const imageURL=await getCreatureImage(row.drawing_url);
    const creature={
      id:row.id,
      student:row.explorer_name||"Explorer",
      name:row.creature_name||"Creature",
      animal:row.compared_animal||"animal",
      adj:[row.adjective_1||"",row.adjective_2||""],
      comp:row.comparative_adjective||"",
      reason:row.justification||"",
      world:row.habitat||"land",
      img:imageURL,
      drawingPath:row.drawing_url
    };
    displayedCreatures.add(String(row.id));
    addCreature(creature,animate);
    updateLiveCounter();
  }catch(error){console.error("Could not display creature:",error)}
}

function addCreature(d,animate=false){
  const b=document.createElement("button");
  b.className=`creature ${d.world}`;
  if(d.id)b.dataset.creatureId=d.id;

  const img=document.createElement("img");img.src=d.img;img.alt=d.name;b.appendChild(img);

  if(d.student){
    const tag=document.createElement("span");
    tag.className="student-tag";tag.textContent=d.student;b.appendChild(tag);
  }

  const seed=Number(d.id)||Math.floor(Math.random()*10000);
  const x=8+(seed*37)%72;
  const y=d.world==="land"?8+(seed*19)%28:58+(seed*23)%25;
  b.style.left=x+"%";b.style.top=y+"%";b.style.animationDelay=(-Math.random()*3)+"s";
  b.onclick=()=>showProfile(d);
  $("#creatureLayer").appendChild(b);

  if(animate)b.animate(
    [{opacity:0,transform:"scale(.2)"},{opacity:1,transform:"scale(1.18)"},{opacity:1,transform:"scale(1)"}],
    {duration:900,easing:"ease-out"}
  );
}

function showProfile(d){
  activeCreature=d;
  $("#profileImg").src=d.img;
  $("#profileName").textContent=d.student?`${d.name} — ${d.student}`:d.name;
  $("#profileDescribe").textContent=`It is ${d.adj[0]} and ${d.adj[1]}.`;
  $("#profileCompare").textContent=`It is ${d.comp} than a ${d.animal}.`;
  $("#profileReason").textContent=`I like my creature because ${d.reason}.`;
  $("#deleteCreatureBtn").classList.toggle("hidden",!d.id);
  $("#profile").classList.remove("hidden");
}

$("#closeProfile").onclick=()=>{
  activeCreature=null;
  $("#profile").classList.add("hidden");
};

$("#deleteCreatureBtn").onclick=async()=>{
  if(!activeCreature?.id)return;

  const ok=confirm(`Delete ${activeCreature.name}? This will remove it from the class habitat.`);
  if(!ok)return;

  const id=activeCreature.id;
  const drawingPath=activeCreature.drawingPath;
  $("#deleteCreatureBtn").disabled=true;
  $("#deleteCreatureBtn").textContent="Deleting...";

  try{
    const {error}=await supabaseClient.from("creatures").delete().eq("id",id);
    if(error)throw error;

    // Image cleanup is attempted too. If Storage DELETE isn't allowed, the class creature
    // is still removed from the habitat/database and the unused image can be cleaned later.
    if(drawingPath){
      const {error:storageError}=await supabaseClient.storage.from("creature-images").remove([drawingPath]);
      if(storageError)console.warn("Image cleanup skipped:",storageError.message);
    }

    removeCreatureFromScreen(id);
    $("#profile").classList.add("hidden");
    activeCreature=null;
    msg("🗑️ Creature deleted. You can create a new one!");
  }catch(error){
    console.error("Delete error:",error);
    msg("❌ Could not delete creature: "+(error.message||"Please try again."));
  }finally{
    $("#deleteCreatureBtn").disabled=false;
    $("#deleteCreatureBtn").textContent="🗑️ Delete Creature";
  }
};

function removeCreatureFromScreen(id){
  displayedCreatures.delete(String(id));
  document.querySelector(`[data-creature-id="${id}"]`)?.remove();
  updateLiveCounter();
}

function msg(t){$("#status").textContent=t}

function updateLiveCounter(){
  const counter=$("#liveCounter");
  if(!counter)return;
  const total=displayedCreatures.size;
  counter.textContent=`🟢 Live Class: ${total} ${total===1?"creature":"creatures"}`;
}

async function loadClassCreatures(){
  msg("🌍 Connecting to the live class habitat...");
  const {data,error}=await supabaseClient.from("creatures").select("*").order("created_at",{ascending:true});
  if(error){console.error("Load error:",error);msg("⚠️ Could not connect to the live class.");return}
  for(const row of data)await renderDatabaseCreature(row,false);
  updateLiveCounter();
  msg("🟢 Live Class connected!");
}

supabaseClient.channel("wild-creator-live-class")
  .on("postgres_changes",{event:"INSERT",schema:"public",table:"creatures"},payload=>renderDatabaseCreature(payload.new,true))
  .on("postgres_changes",{event:"DELETE",schema:"public",table:"creatures"},payload=>{
    if(payload.old?.id)removeCreatureFromScreen(payload.old.id);
    if(activeCreature?.id===payload.old?.id){
      activeCreature=null;
      $("#profile").classList.add("hidden");
    }
  })
  .subscribe(status=>console.log("Realtime:",status));

loadClassCreatures();

$("#fullBtn").onclick=()=>{
  if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
};

const habitatStage=$("#stage"),habitatFullBtn=$("#habitatFullBtn");
habitatFullBtn.onclick=async()=>{
  try{
    if(document.fullscreenElement||document.webkitFullscreenElement){
      if(document.exitFullscreen)await document.exitFullscreen();
      else if(document.webkitExitFullscreen)document.webkitExitFullscreen();
      return;
    }
    if(habitatStage.requestFullscreen)await habitatStage.requestFullscreen();
    else if(habitatStage.webkitRequestFullscreen)habitatStage.webkitRequestFullscreen();
    else msg("Full-screen habitat is not supported by this browser.");
  }catch(err){msg("Full-screen habitat is not supported by this browser.")}
};
function updateHabitatFullscreenButton(){
  const active=document.fullscreenElement===habitatStage||document.webkitFullscreenElement===habitatStage;
  habitatFullBtn.textContent=active?"↙ Exit Full Screen":"⛶ Habitat Full Screen";
}
document.addEventListener("fullscreenchange",updateHabitatFullscreenButton);
document.addEventListener("webkitfullscreenchange",updateHabitatFullscreenButton);
