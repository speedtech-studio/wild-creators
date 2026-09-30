const adjectives = [
  "big","small","tall","short","long","strong",
  "fast","slow","heavy","light","colourful","friendly"
];

const comparatives = [
  "bigger","smaller","taller","shorter","longer",
  "stronger","faster","slower","heavier","lighter"
];

const reasons = [
  "it is colourful",
  "it is friendly",
  "it is strong",
  "it is fast",
  "it is special"
];

let selectedAdj = [];
let selectedComp = "";
let selectedReason = "";
let selectedWorld = "land";
let imageData = "";

const $ = s => document.querySelector(s);


// ======================================================
// SUPABASE
// ======================================================

const SUPABASE_URL =
  "https://qobvrgqrutdqwgcthpsu.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_TTiSPzWGwpFI9Grcd9tKfA_TYRiDeVi";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


// Edge Function you created
const IMAGE_FUNCTION = "rapid-responder";


// Keep track of creatures already shown
const displayedCreatures = new Set();


// ======================================================
// CHIPS
// ======================================================

function makeChips(id, items, type) {

  const box = $(id);

  items.forEach(word => {

    const b = document.createElement("button");

    b.className = "chip";
    b.textContent = word;

    b.onclick = () => {

      if (type === "adj") {

        if (selectedAdj.includes(word)) {

          selectedAdj =
            selectedAdj.filter(x => x !== word);

          b.classList.remove("selected");

        } else if (selectedAdj.length < 2) {

          selectedAdj.push(word);

          b.classList.add("selected");

        }

        $("#adjHint").textContent =
          `${selectedAdj.length}/2 selected`;

      } else {

        box
          .querySelectorAll(".chip")
          .forEach(x =>
            x.classList.remove("selected")
          );

        b.classList.add("selected");

        if (type === "comp") {

          selectedComp = word;

        } else {

          selectedReason = word;

        }

      }

    };

    box.appendChild(b);

  });

}


makeChips("#adjBank", adjectives, "adj");

makeChips(
  "#compBank",
  comparatives,
  "comp"
);

makeChips(
  "#reasonBank",
  reasons,
  "reason"
);


// ======================================================
// IMAGE / CAMERA / GALLERY
// ======================================================

function processCreaturePhoto(file) {

  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {

    const img = new Image();

    img.onload = () => {

      const maxSide = 1400;

      const scale = Math.min(
        1,
        maxSide /
        Math.max(
          img.naturalWidth,
          img.naturalHeight
        )
      );

      const canvas =
        document.createElement("canvas");

      canvas.width =
        Math.max(
          1,
          Math.round(
            img.naturalWidth * scale
          )
        );

      canvas.height =
        Math.max(
          1,
          Math.round(
            img.naturalHeight * scale
          )
        );

      const ctx =
        canvas.getContext(
          "2d",
          {
            willReadFrequently: true
          }
        );

      ctx.drawImage(
        img,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const frame =
        ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );

      const px = frame.data;


      // =========================================
      // WHITE BACKGROUND REMOVAL
      // =========================================

      for (
        let i = 0;
        i < px.length;
        i += 4
      ) {

        const red = px[i];

        const green = px[i + 1];

        const blue = px[i + 2];

        const brightest =
          Math.max(
            red,
            green,
            blue
          );

        const darkest =
          Math.min(
            red,
            green,
            blue
          );

        const brightness =
          (
            red +
            green +
            blue
          ) / 3;

        const colourRange =
          brightest -
          darkest;


        if (
          brightness >= 246 &&
          colourRange < 20
        ) {

          px[i + 3] = 0;

        } else if (
          brightness >= 225 &&
          colourRange < 24
        ) {

          px[i + 3] =
            Math.max(
              0,
              Math.min(
                255,
                Math.round(
                  255 *
                  (
                    246 -
                    brightness
                  ) /
                  21
                )
              )
            );

        }

      }


      ctx.putImageData(
        frame,
        0,
        0
      );


      imageData =
        canvas.toDataURL(
          "image/png"
        );


      $("#preview").src =
        imageData;


      $("#previewWrap")
        .classList
        .remove("hidden");


      msg(
        "✨ White background removed — your creature is ready!"
      );

    };


    img.src =
      reader.result;

  };


  reader.readAsDataURL(
    file
  );

}


$("#galleryInput")
  .addEventListener(
    "change",
    e =>
      processCreaturePhoto(
        e.target.files[0]
      )
  );


$("#cameraInput")
  .addEventListener(
    "change",
    e =>
      processCreaturePhoto(
        e.target.files[0]
      )
  );


// ======================================================
// LAND / OCEAN
// ======================================================

document
  .querySelectorAll(".world")
  .forEach(b => {

    b.onclick = () => {

      document
        .querySelectorAll(".world")
        .forEach(x =>
          x.classList.remove("active")
        );


      b.classList.add("active");


      selectedWorld =
        b.dataset.world;


      $("#habitatLabel")
        .textContent =
        selectedWorld === "land"
        ? "🌿 Land selected"
        : "🌊 Ocean selected";

    };

  });


// ======================================================
// DATA URL → BLOB
// ======================================================

function dataURLtoBlob(dataURL) {

  const parts =
    dataURL.split(",");

  const mime =
    parts[0]
      .match(
        /:(.*?);/
      )[1];


  const binary =
    atob(
      parts[1]
    );


  const bytes =
    new Uint8Array(
      binary.length
    );


  for (
    let i = 0;
    i < binary.length;
    i++
  ) {

    bytes[i] =
      binary.charCodeAt(i);

  }


  return new Blob(
    [bytes],
    {
      type: mime
    }
  );

}


// ======================================================
// RELEASE CREATURE
// ======================================================

$("#releaseBtn").onclick =
async () => {

  const studentName =
    $("#studentNameInput")
      .value
      .trim();


  const name =
    $("#nameInput")
      .value
      .trim();


  const animal =
    $("#animalInput")
      .value
      .trim();


  if (!studentName) {

    return msg(
      "Please enter your name."
    );

  }


  if (!imageData) {

    return msg(
      "Please take or upload a picture of your creature first."
    );

  }


  if (!name) {

    return msg(
      "Give your creature a name."
    );

  }


  if (
    selectedAdj.length !== 2
  ) {

    return msg(
      "Choose exactly 2 adjectives."
    );

  }


  if (
    !selectedComp ||
    !animal
  ) {

    return msg(
      "Complete the comparison mission."
    );

  }


  if (!selectedReason) {

    return msg(
      "Choose why you like your creature."
    );

  }


  $("#releaseBtn")
    .disabled = true;


  msg(
    "🌍 Releasing your creature to the LIVE class habitat..."
  );


  try {

    // ============================================
    // UPLOAD IMAGE
    // ============================================

    const blob =
      dataURLtoBlob(
        imageData
      );


    const safeStudent =
      studentName
        .toLowerCase()
        .replace(
          /[^a-z0-9]+/g,
          "-"
        )
        .replace(
          /^-|-$/g,
          ""
        )
        .slice(
          0,
          30
        );


    const random =
      Math.random()
        .toString(36)
        .slice(2, 8);


    const filePath =
      `live-class/${Date.now()}-${safeStudent}-${random}.png`;


    const {
      error: uploadError
    } =
      await supabaseClient
        .storage
        .from(
          "creature-images"
        )
        .upload(
          filePath,
          blob,
          {
            contentType:
              "image/png",

            upsert: false
          }
        );


    if (uploadError) {

      throw uploadError;

    }


    // ============================================
    // SAVE CREATURE INFORMATION
    // ============================================

    const {
      data,
      error
    } =
      await supabaseClient
        .from(
          "creatures"
        )
        .insert({

          explorer_name:
            studentName,

          creature_name:
            name,

          drawing_url:
            filePath,

          adjective_1:
            selectedAdj[0],

          adjective_2:
            selectedAdj[1],

          comparative_adjective:
            selectedComp,

          compared_animal:
            animal,

          justification:
            selectedReason,

          habitat:
            selectedWorld

        })
        .select()
        .single();


    if (error) {

      throw error;

    }


    // Show immediately on this device
    await renderDatabaseCreature(
      data,
      true
    );


    msg(
      `✨ ${name} has entered the LIVE ${
        selectedWorld === "land"
        ? "land"
        : "ocean"
      } world!`
    );


  } catch (error) {

    console.error(
      "Release error:",
      error
    );


    msg(
      "❌ Could not release creature: " +
      (
        error.message ||
        "Please check the connection."
      )
    );


  } finally {

    $("#releaseBtn")
      .disabled = false;

  }

};


// ======================================================
// GET PRIVATE IMAGE THROUGH EDGE FUNCTION
// ======================================================

async function getCreatureImage(
  path
) {

  const {
    data,
    error
  } =
    await supabaseClient
      .functions
      .invoke(
        IMAGE_FUNCTION,
        {
          body: {
            path
          }
        }
      );


  if (error) {

    throw error;

  }


  if (!data?.url) {

    throw new Error(
      "Creature image URL was not returned."
    );

  }


  return data.url;

}


// ======================================================
// CONVERT DATABASE ROW TO CREATURE
// ======================================================

async function renderDatabaseCreature(
  row,
  animate = false
) {

  if (!row?.id) return;


  if (
    displayedCreatures.has(
      String(row.id)
    )
  ) {

    return;

  }


  try {

    const imageURL =
      await getCreatureImage(
        row.drawing_url
      );


    const creature = {

      id:
        row.id,

      student:
        row.explorer_name ||
        "Explorer",

      name:
        row.creature_name ||
        "Creature",

      animal:
        row.compared_animal ||
        "animal",

      adj: [
        row.adjective_1 ||
        "",
        row.adjective_2 ||
        ""
      ],

      comp:
        row.comparative_adjective ||
        "",

      reason:
        row.justification ||
        "",

      world:
        row.habitat ||
        "land",

      img:
        imageURL

    };


    displayedCreatures.add(
      String(row.id)
    );


    addCreature(
      creature,
      animate
    );


    updateLiveCounter();


  } catch (error) {

    console.error(
      "Could not display creature:",
      error
    );

  }

}


// ======================================================
// ADD CREATURE TO HABITAT
// ======================================================

function addCreature(
  d,
  animate = false
) {

  const b =
    document.createElement(
      "button"
    );


  b.className =
    `creature ${d.world}`;


  if (d.id) {

    b.dataset.creatureId =
      d.id;

  }


  const img =
    document.createElement(
      "img"
    );


  img.src =
    d.img;


  img.alt =
    d.name;


  b.appendChild(
    img
  );


  // ============================================
  // STUDENT NAME LABEL
  // ============================================

  if (d.student) {

    const studentTag =
      document.createElement(
        "span"
      );


    studentTag.className =
      "student-tag";


    studentTag.textContent =
      d.student;


    b.appendChild(
      studentTag
    );

  }


  // ============================================
  // POSITION
  // ============================================

  let x;
  let y;


  if (d.id) {

    const seed =
      Number(d.id);


    x =
      8 +
      (
        seed * 37
      ) %
      72;


    y =
      d.world === "land"
      ? 8 +
        (
          seed * 19
        ) %
        28

      : 58 +
        (
          seed * 23
        ) %
        25;

  } else {

    x =
      8 +
      Math.random() *
      72;


    y =
      d.world === "land"
      ? 8 +
        Math.random() *
        28

      : 58 +
        Math.random() *
        25;

  }


  b.style.left =
    x + "%";


  b.style.top =
    y + "%";


  b.style.animationDelay =
    (
      -Math.random() *
      3
    ) +
    "s";


  b.onclick =
    () =>
      showProfile(d);


  $("#creatureLayer")
    .appendChild(b);


  // New creature entrance
  if (animate) {

    b.animate(

      [
        {
          opacity: 0,
          transform:
            "scale(0.2)"
        },

        {
          opacity: 1,
          transform:
            "scale(1.18)"
        },

        {
          opacity: 1,
          transform:
            "scale(1)"
        }
      ],

      {
        duration: 900,
        easing:
          "ease-out"
      }

    );

  }

}


// ======================================================
// CREATURE PROFILE
// ======================================================

function showProfile(d) {

  $("#profileImg").src =
    d.img;


  $("#profileName")
    .textContent =
    d.student
    ? `${d.name} — ${d.student}`
    : d.name;


  $("#profileDescribe")
    .textContent =
    `It is ${d.adj[0]} and ${d.adj[1]}.`;


  $("#profileCompare")
    .textContent =
    `It is ${d.comp} than a ${d.animal}.`;


  $("#profileReason")
    .textContent =
    `I like my creature because ${d.reason}.`;


  $("#profile")
    .classList
    .remove(
      "hidden"
    );

}


$("#closeProfile")
  .onclick =
  () =>
    $("#profile")
      .classList
      .add(
        "hidden"
      );


// ======================================================
// STATUS MESSAGE
// ======================================================

function msg(t) {

  $("#status")
    .textContent =
    t;

}


// ======================================================
// LIVE CLASS COUNTER
// ======================================================

function updateLiveCounter() {

  const counter =
    $("#liveCounter");


  if (!counter) return;


  const total =
    displayedCreatures
      .size;


  counter.textContent =
    `🟢 Live Class: ${total} ${
      total === 1
      ? "creature"
      : "creatures"
    }`;

}


// ======================================================
// LOAD EXISTING CLASS CREATURES
// ======================================================

async function loadClassCreatures() {

  msg(
    "🌍 Connecting to the live class habitat..."
  );


  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        "creatures"
      )
      .select("*")
      .order(
        "created_at",
        {
          ascending: true
        }
      );


  if (error) {

    console.error(
      "Load error:",
      error
    );


    msg(
      "⚠️ Could not connect to the live class."
    );


    return;

  }


  for (
    const row of data
  ) {

    await renderDatabaseCreature(
      row,
      false
    );

  }


  updateLiveCounter();


  msg(
    "🟢 Live Class connected!"
  );

}


// ======================================================
// REALTIME
// ======================================================

supabaseClient
  .channel(
    "wild-creator-live-class"
  )

  .on(

    "postgres_changes",

    {
      event:
        "INSERT",

      schema:
        "public",

      table:
        "creatures"
    },

    payload => {

      renderDatabaseCreature(
        payload.new,
        true
      );

    }

  )

  .subscribe(
    status => {

      console.log(
        "Realtime:",
        status
      );

    }
  );


// ======================================================
// LOAD CLASS
// ======================================================

loadClassCreatures();


// ======================================================
// FULL SCREEN — WHOLE WEBSITE
// ======================================================

$("#fullBtn").onclick =
() => {

  if (
    !document.fullscreenElement
  ) {

    document
      .documentElement
      .requestFullscreen?.();

  } else {

    document
      .exitFullscreen?.();

  }

};


// ======================================================
// HABITAT-ONLY FULL SCREEN
// ======================================================

const habitatStage =
  $("#stage");


const habitatFullBtn =
  $("#habitatFullBtn");


habitatFullBtn.onclick =
async () => {

  try {

    if (
      document.fullscreenElement ||
      document.webkitFullscreenElement
    ) {

      if (
        document.exitFullscreen
      ) {

        await document
          .exitFullscreen();

      } else if (
        document.webkitExitFullscreen
      ) {

        document
          .webkitExitFullscreen();

      }

      return;

    }


    if (
      habitatStage
        .requestFullscreen
    ) {

      await habitatStage
        .requestFullscreen();

    } else if (
      habitatStage
        .webkitRequestFullscreen
    ) {

      habitatStage
        .webkitRequestFullscreen();

    } else {

      msg(
        "Full-screen habitat is not supported by this browser."
      );

    }


  } catch (err) {

    msg(
      "Full-screen habitat is not supported by this browser."
    );

  }

};


// ======================================================
// UPDATE HABITAT FULLSCREEN BUTTON
// ======================================================

function updateHabitatFullscreenButton() {

  const active =
    document.fullscreenElement ===
      habitatStage ||

    document
      .webkitFullscreenElement ===
      habitatStage;


  habitatFullBtn
    .textContent =
    active
    ? "↙ Exit Full Screen"
    : "⛶ Habitat Full Screen";

}


document
  .addEventListener(
    "fullscreenchange",
    updateHabitatFullscreenButton
  );


document
  .addEventListener(
    "webkitfullscreenchange",
    updateHabitatFullscreenButton
  );
