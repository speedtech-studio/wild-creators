const C=window.WILD_CONFIG,db=supabase.createClient(C.supabaseUrl,C.supabasePublishableKey),pages=["login","home","create","archive","shares","family"];
function show(x){pages.forEach(p=>document.getElementById(p).classList.toggle("active",p===x));scrollTo(0,0)}
function setMsg(id,t,ok=false){let e=document.getElementById(id);e.textContent=t;e.style.color=ok?"#287044":"#a33"}
async function login(){setMsg("loginMsg","Signing in...");let{error}=await db.auth.signInWithPassword({email:email.value.trim(),password:password.value});if(error)return setMsg("loginMsg",error.message);enter()}
async function logout(){await db.auth.signOut();nav.hidden=true;show("login")}
async function enter(){nav.hidden=false;show("home");await refresh()}
db.auth.getSession().then(({data})=>{if(data.session)enter()});
drawing.onchange=e=>{let f=e.target.files[0];if(f){preview.src=URL.createObjectURL(f);preview.style.display="block"}};
function esc(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function fill(el,a,v,k,f){el.innerHTML=`<option value="">${f}</option>`+(a||[]).map(r=>`<option value="${r[v]}">${esc(r[k])}</option>`).join("")}
async function refresh(){let{data}=await db.from("schools").select("*").order("school_name");fill(school,data,"id","school_name","Choose school");fill(aSchool,data,"id","school_name","Choose school");await loadClasses();await archiveClasses()}
school.onchange=loadClasses;classSel.onchange=loadStudents;aSchool.onchange=archiveClasses;aClass.onchange=archiveStudents;
async function loadClasses(){if(!school.value){fill(classSel,[],"id","class_name","Choose class");fill(student,[],"id","student_name","Choose student");return}let{data}=await db.from("classes").select("*").eq("school_id",school.value).order("class_name");classSel.innerHTML='<option value="">Choose class</option>'+(data||[]).map(r=>`<option value="${r.id}">${esc(r.year_level)} • ${esc(r.class_name)}</option>`).join("");loadStudents()}
async function loadStudents(){if(!classSel.value)return fill(student,[],"id","student_name","Choose student");let{data}=await db.from("students").select("*").eq("class_id",classSel.value).order("student_name");fill(student,data,"id","student_name","Choose student")}
async function addSchool(){let n=newSchool.value.trim();if(!n)return alert("Enter school name.");let{error}=await db.from("schools").insert({school_name:n});if(error)return alert(error.message);newSchool.value="";refresh()}
async function addClass(){if(!school.value)return alert("Choose school first.");if(!year.value.trim()||!newClass.value.trim())return alert("Enter year and class.");let{error}=await db.from("classes").insert({school_id:+school.value,year_level:year.value.trim(),class_name:newClass.value.trim()});if(error)return alert(error.message);newClass.value="";loadClasses()}
async function addStudent(){if(!classSel.value)return alert("Choose class first.");if(!newStudent.value.trim())return alert("Enter student name.");let{error}=await db.from("students").insert({class_id:+classSel.value,student_name:newStudent.value.trim(),student_code:studentCode.value.trim()||null});if(error)return alert(error.message);newStudent.value="";studentCode.value="";loadStudents()}
async function saveCreature(){setMsg("saveMsg","");if(!student.value)return setMsg("saveMsg","Choose a student.");if(!cname.value.trim())return setMsg("saveMsg","Give the creature a name.");let f=drawing.files[0];if(!f)return setMsg("saveMsg","Upload the drawing first.");saveBtn.disabled=true;setMsg("saveMsg","Saving...");try{let ext=(f.name.split(".").pop()||"jpg").replace(/[^a-z0-9]/gi,""),path=`student-${student.value}/${Date.now()}-${crypto.randomUUID()}.${ext}`;let{error:u}=await db.storage.from(C.bucket).upload(path,f,{contentType:f.type||"image/jpeg"});if(u)throw u;let row={student_id:+student.value,creature_name:cname.value.trim(),drawing_url:path,adjective_1:adj1.value.trim(),adjective_2:adj2.value.trim(),has_feature:feature.value.trim(),ability:ability.value.trim(),comparative_adjective:comp.value,compared_animal:animal.value.trim(),justification:reason.value.trim()};let{error}=await db.from("creatures").insert(row);if(error)throw error;setMsg("saveMsg","✓ Saved to the student's Wild Collection!",true);["cname","adj1","adj2","feature","ability","animal","reason"].forEach(x=>document.getElementById(x).value="");drawing.value="";preview.style.display="none"}catch(e){setMsg("saveMsg","Could not save: "+e.message)}finally{saveBtn.disabled=false}}
async function openArchive(){show("archive");await refresh()}
async function archiveClasses(){if(!aSchool.value){fill(aClass,[],"id","class_name","Choose class");fill(aStudent,[],"id","student_name","Choose student");return}let{data}=await db.from("classes").select("*").eq("school_id",aSchool.value).order("class_name");aClass.innerHTML='<option value="">Choose class</option>'+(data||[]).map(r=>`<option value="${r.id}">${esc(r.year_level)} • ${esc(r.class_name)}</option>`).join("");archiveStudents()}
async function archiveStudents(){if(!aClass.value)return fill(aStudent,[],"id","student_name","Choose student");let{data}=await db.from("students").select("*").eq("class_id",aClass.value).order("student_name");fill(aStudent,data,"id","student_name","Choose student")}
async function loadCreatures(){if(!aStudent.value)return alert("Choose student.");collection.innerHTML="<p>Loading...</p>";let{data,error}=await db.from("creatures").select("*").eq("student_id",aStudent.value).order("created_at",{ascending:false});if(error)return collection.innerHTML=`<p>${esc(error.message)}</p>`;crumb.textContent=`🏫 ${aSchool.options[aSchool.selectedIndex].text} › 🚪 ${aClass.options[aClass.selectedIndex].text} › 🧒 ${aStudent.options[aStudent.selectedIndex].text} › 🐾 Wild Collection`;if(!data?.length)return collection.innerHTML="<p>No creatures saved yet.</p>";let cards=await Promise.all(data.map(async r=>{let img="";if(r.drawing_url){let{data:s}=await db.storage.from(C.bucket).createSignedUrl(r.drawing_url,3600);img=s?.signedUrl||""}let desc=`${r.creature_name} is ${r.adjective_1||"unique"} and ${r.adjective_2||"creative"}. It has ${r.has_feature||"special features"}. It can ${r.ability||"do amazing things"}.`;return `<article class="creature">${img?`<img src="${img}" alt="Creature drawing">`:""}<div class="info"><div class="date">${new Date(r.created_at).toLocaleDateString()}</div><h3>${esc(r.creature_name)}</h3><p>${esc(desc)}</p><p><b>Compare:</b> It is ${esc(r.comparative_adjective||"different")} than a ${esc(r.compared_animal||"wild animal")}.</p><p><b>Why I like it:</b> ${esc(r.justification||"—")}</p></div></article>`}));collection.innerHTML=cards.join("")}

// ---------- V3: private family collection links ----------
async function openShares(){show("shares");await refreshShareSelectors()}
async function refreshShareSelectors(){
 const {data}=await db.from("schools").select("*").order("school_name");
 fill(sSchool,data,"id","school_name","Choose school"); fill(sClass,[],"id","class_name","Choose class"); fill(sStudent,[],"id","student_name","Choose student");
}
sSchool.onchange=async()=>{if(!sSchool.value)return fill(sClass,[],"id","class_name","Choose class");let{data}=await db.from("classes").select("*").eq("school_id",sSchool.value).order("class_name");sClass.innerHTML='<option value="">Choose class</option>'+(data||[]).map(r=>`<option value="${r.id}">${esc(r.year_level)} • ${esc(r.class_name)}</option>`).join("");fill(sStudent,[],"id","student_name","Choose student")}
sClass.onchange=async()=>{if(!sClass.value)return fill(sStudent,[],"id","student_name","Choose student");let{data}=await db.from("students").select("*").eq("class_id",sClass.value).order("student_name");fill(sStudent,data,"id","student_name","Choose student")}
async function createShareLink(){
 if(!sStudent.value)return alert("Choose a student first.");
 let {data,error}=await db.rpc("create_student_share",{p_student_id:+sStudent.value});
 if(error)return alert(error.message);
 const token=Array.isArray(data)?data[0]?.share_token:data?.share_token||data;
 const link=`${location.origin}${location.pathname}?collection=${encodeURIComponent(token)}`;
 shareResult.style.display="block";
 shareResult.innerHTML=`<b>Private family link</b><br><a href="${link}" target="_blank">${esc(link)}</a><br><br><button onclick="navigator.clipboard.writeText('${link.replace(/'/g,"")}').then(()=>alert('Link copied!'))">📋 Copy Link</button>`;
}
async function loadFamilyCollection(token){
 nav.hidden=true; show("family");
 familyCollection.innerHTML="<p>Opening private collection...</p>";
 try{
   const endpoint=`${C.supabaseUrl}/functions/v1/family-collection?token=${encodeURIComponent(token)}`;
   const r=await fetch(endpoint,{headers:{apikey:C.supabasePublishableKey}});
   const payload=await r.json(); if(!r.ok)throw new Error(payload.error||"Unable to open collection");
   familyTitle.textContent=`${payload.student_name}'s Wild Collection 🐾`;
   familySub.textContent="A growing collection of imagination and English learning.";
   if(!payload.creatures?.length){familyCollection.innerHTML="<p>No creatures have been added yet.</p>";return}
   familyCollection.innerHTML=payload.creatures.map(c=>`<article class="creature">${c.image_url?`<img src="${c.image_url}" alt="Creature drawing">`:""}<div class="info"><div class="date">${new Date(c.created_at).toLocaleDateString()}</div><h3>${esc(c.creature_name)}</h3><p>${esc(c.creature_name)} is ${esc(c.adjective_1||"unique")} and ${esc(c.adjective_2||"creative")}. It has ${esc(c.has_feature||"special features")}. It can ${esc(c.ability||"do amazing things")}.</p><p><b>Compare:</b> It is ${esc(c.comparative_adjective||"different")} than a ${esc(c.compared_animal||"wild animal")}.</p><p><b>Why I like it:</b> ${esc(c.justification||"—")}</p></div></article>`).join("");
 }catch(e){familyTitle.textContent="Collection unavailable";familySub.textContent="This private link may be invalid or inactive.";familyCollection.innerHTML=""}
}
const familyToken=new URLSearchParams(location.search).get("collection");
if(familyToken){loadFamilyCollection(familyToken)}
