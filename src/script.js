




// Import necessary modules from Three.js
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// Create the scene, camera, and renderer
window.scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Light blue sky

const camera = new THREE.PerspectiveCamera(
  75, 
  window.innerWidth / window.innerHeight, 
  0.1, 
  1000
);
camera.position.set(0, 10, 50);
let lastDayDialogueShown = 0; // Initialize with 0 to prevent errors

const savedDialogueDay = localStorage.getItem("lastDayDialogueShown");
if (savedDialogueDay) {
    lastDayDialogueShown = parseInt(savedDialogueDay, 10);
}

let dialogueHistory = JSON.parse(localStorage.getItem("dialogueHistory")) || []; // Load saved history


const renderer = new THREE.WebGLRenderer({antialias: true,});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener("load", () => {
  console.log(" Game reloaded, checking for saved position...");

  const savedDay = localStorage.getItem("currentDay");
  if (savedDay) {
    currentDay = parseInt(localStorage.getItem("currentDay")) || 1;
console.log(` Restored or initialized currentDay: ${currentDay}`);

    
  } else {
      currentDay = 1; // ✅ Ensure first day starts properly
  }

  const savedPosition = localStorage.getItem("lastPlayerPosition");
  if (savedPosition) {
      const positionData = JSON.parse(savedPosition);
      const interval = setInterval(() => {
          if (workerman) {
              workerman.position.set(positionData.x, positionData.y, positionData.z);
              console.log(`Player restored to last position: (${positionData.x}, ${positionData.y}, ${positionData.z})`);
              clearInterval(interval);
          }
      }, 100);
  }

  // ✅ Show intro dialogue at the start if it's the first day
  if (currentDay === 1) {
      console.log(" Showing intro dialogue...");
      currentStory = "intro";
      showDialogue(); // ✅ Force intro dialogue on first load
  } else {
      console.log(" Showing saved day's dialogue...");
      showDailyDialogue(); // ✅ Show correct day's dialogue if reloading
  }
});

let journalOpenedManually = false; // ✅ Tracks if journal was closed manually

// Add ground
const groundGeometry = new THREE.PlaneGeometry(500, 500); // Much larger ground
const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 }); // Green grass
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.set(0, 0, 0); // Place ground at the origin
scene.add(ground);

// Add brown plane within the fenced area
const fencedAreaGeometry = new THREE.PlaneGeometry(100, 100); // Adjusted to fit the fence
const fencedAreaMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown dirt
const fencedArea = new THREE.Mesh(fencedAreaGeometry, fencedAreaMaterial);
fencedArea.rotation.x = -Math.PI / 2;
fencedArea.position.set(100, 0.01, -150); // Slightly above ground to avoid z-fighting
scene.add(fencedArea);

// Add lighting
let ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
window.ambientLight = ambientLight; // 🌎 Makes it available in the console


const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);
let time = 0; // Time in the cycle
const dayDuration = 240; // Duration of a full day in seconds (adjustable)

let currentDay = 1;  // 🌞 Ensure this is at the top of your script
let lastDay = 1;      // ✅ Add this to prevent "undefined" error


const timeUpdateRate = 1; // Time increases every second
let timeInterval; // Stores setInterval reference

let lastUpdateTime = 0; // Store last time `updateTime()` was called

const updateTime = () => {
  time += timeUpdateRate;
  updateDayNightCycle(timeUpdateRate);

  let calculatedDay = Math.floor(time / dayDuration) + 1;
  if (calculatedDay !== lastDay) {
      console.log(` New day! Day ${calculatedDay} begins.`);
      currentDay = calculatedDay;
      lastDay = calculatedDay;

      resetWheatField();
      wellVisitCount = 0;
      wellTradeOffered = false;
      locations.forEach((location) => location.visited = false);
      updateJournal();

      // ✅ Ensure `showDailyDialogue()` is only called here
      showDailyDialogue();
  }
};


// ✅ Start time progression on game start
timeInterval = setInterval(updateTime, 1000); // Updates every second

const updateDayNightCycle = () => {
  // ✅ Normalize time within a single day cycle (0 to 1)
  const normalizedTime = (time % dayDuration) / dayDuration;

  // ✅ Adjust sky color transition smoothly
  const dayColor = new THREE.Color(0x87ceeb); // Light blue (day)
  const nightColor = new THREE.Color(0x1a1a40); // Dark blue (night)
  scene.background = dayColor.clone().lerp(nightColor, Math.sin(normalizedTime * Math.PI));

  // ✅ Adjust light intensity dynamically
  const maxLightIntensity = 1;
  const minLightIntensity = 0.2;
  const lightIntensity = minLightIntensity + (maxLightIntensity - minLightIntensity) * (1 - Math.cos(normalizedTime * Math.PI)) / 2;
  ambientLight.intensity = lightIntensity;
  directionalLight.intensity = lightIntensity;
};






// ✅ Create journal container
const journalContainer = document.createElement('div');
journalContainer.style.position = 'absolute';
journalContainer.style.top = '20px';
journalContainer.style.left = '20px';
journalContainer.style.padding = '20px';
journalContainer.style.backgroundColor = '#f4f1ea'; // Light paper-like color
journalContainer.style.color = '#333'; // Dark text color for readability
journalContainer.style.fontFamily = 'Georgia, serif'; // More book-like font
journalContainer.style.fontSize = '16px';
journalContainer.style.borderRadius = '10px';
journalContainer.style.width = '300px';
journalContainer.style.height = '400px'; // Adjusted height for sections
journalContainer.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
journalContainer.style.border = '2px solid #d3cbb8'; // Border resembling an aged book
journalContainer.style.display = 'none'; // Initially hidden
journalContainer.style.zIndex = '10'; // Ensure it layers above other visuals
document.body.appendChild(journalContainer);

// ✅ Create the Instructions container (Popup)
const instructionsContainer = document.createElement('div');
instructionsContainer.style.position = 'absolute';
instructionsContainer.style.top = '20px';
instructionsContainer.style.left = '400px'; // Adjust position so it doesn't overlap the journal
instructionsContainer.style.padding = '20px';
instructionsContainer.style.backgroundColor = '#f4f1ea';
instructionsContainer.style.color = '#333';
instructionsContainer.style.fontFamily = 'Georgia, serif';
instructionsContainer.style.fontSize = '16px';
instructionsContainer.style.borderRadius = '10px';
instructionsContainer.style.width = '350px';
instructionsContainer.style.height = '450px';
instructionsContainer.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
instructionsContainer.style.border = '2px solid #d3cbb8';
instructionsContainer.style.display = 'none'; // Initially hidden
instructionsContainer.style.zIndex = '10';
document.body.appendChild(instructionsContainer);

// ✅ Add Instructions Content
const instructionsText = document.createElement('div');
instructionsText.innerHTML = `
    <strong>Instructions:</strong><br><br>
    - Move using <strong>Arrow Keys</strong>.<br>
    - Walk near objects to interact.<br>
    - Open the <strong>Journal</strong> to track progress.<br>
    - Visit the <strong>Well</strong> to buy water.<br>
    - Trade crops for <strong>gold</strong> at the market.<br>
    - Sleep at <strong>home</strong> to start a new day.<br>
`;
instructionsContainer.appendChild(instructionsText);

// ✅ Close Button
const closeInstructionsButton = document.createElement('button');
closeInstructionsButton.textContent = 'X';
closeInstructionsButton.style.position = 'absolute';
closeInstructionsButton.style.top = '10px';
closeInstructionsButton.style.right = '10px';
closeInstructionsButton.style.backgroundColor = '#d9534f';
closeInstructionsButton.style.color = 'white';
closeInstructionsButton.style.border = 'none';
closeInstructionsButton.style.borderRadius = '50%';
closeInstructionsButton.style.width = '25px';
closeInstructionsButton.style.height = '25px';
closeInstructionsButton.style.cursor = 'pointer';
closeInstructionsButton.style.fontWeight = 'bold';
closeInstructionsButton.addEventListener('click', () => {
    instructionsContainer.style.display = 'none';
});
instructionsContainer.appendChild(closeInstructionsButton);

// ✅ Create an "Open Instructions" Button
const openInstructionsButton = document.createElement('button');
openInstructionsButton.textContent = 'Open Instructions';
openInstructionsButton.style.position = 'absolute';
openInstructionsButton.style.top = '200px'; // Adjusted so it doesn't overlap with Journal
openInstructionsButton.style.left = '20px';
openInstructionsButton.style.padding = '10px';
openInstructionsButton.style.borderRadius = '5px';
openInstructionsButton.style.fontSize = '14px';
openInstructionsButton.style.cursor = 'pointer';
openInstructionsButton.style.backgroundColor = '#6c757d';
openInstructionsButton.style.color = 'white';
openInstructionsButton.style.border = 'none';
openInstructionsButton.addEventListener('click', () => {
    instructionsContainer.style.display = 'block';
});
document.body.appendChild(openInstructionsButton);


// ✅ Add journal sections
const menuSection = document.createElement('div');
menuSection.textContent = "Menu:";
menuSection.style.borderBottom = '2px solid #d3cbb8';
menuSection.style.paddingBottom = '10px';
menuSection.style.marginBottom = '10px';
menuSection.style.fontWeight = 'bold';
journalContainer.appendChild(menuSection);

const storyEventsSection = document.createElement('div');
storyEventsSection.textContent = "Story Events:\n- A drought destroyed your last harvest. You must produce 200 bushels of crops this season.";
storyEventsSection.style.borderBottom = '2px solid #d3cbb8';
storyEventsSection.style.paddingBottom = '10px';
storyEventsSection.style.marginBottom = '10px';
journalContainer.appendChild(storyEventsSection);




const inputBox = document.createElement('input'); // Add input for user choice inside the journal
inputBox.type = 'text';
inputBox.style.marginTop = '10px';
inputBox.style.padding = '10px';
inputBox.style.borderRadius = '5px';
inputBox.style.fontSize = '14px';
inputBox.style.width = '100%'; // Fit within the journal width
inputBox.style.boxSizing = 'border-box'; // Ensure proper padding inside the width
inputBox.style.display = 'none'; // Initially hidden
journalContainer.appendChild(inputBox);

// Add close button
const closeButton = document.createElement('button');
closeButton.textContent = 'X';
closeButton.style.position = 'absolute';
closeButton.style.top = '10px';
closeButton.style.right = '10px';
closeButton.style.backgroundColor = '#d9534f'; // Softer red
closeButton.style.color = 'white';
closeButton.style.border = 'none';
closeButton.style.borderRadius = '50%';
closeButton.style.width = '25px';
closeButton.style.height = '25px';
closeButton.style.cursor = 'pointer';
closeButton.style.fontWeight = 'bold';
closeButton.addEventListener('click', () => {
  journalContainer.style.display = 'none';
  journalOpenedManually = true; // ✅ Prevent journal from reopening until new dialogue appears
});


journalContainer.appendChild(closeButton);

let wheatfieldVisitCount = 0; // ✅ Tracks how many times the player enters the wheatfield

window.story = {
  intro: {
    text: "The drought last season destroyed your crops. I, Richard Evans, must produce 200 bushels this season or lose my land.",
    requiresInput: false
  },
  wheatfield_legacy: {
      day1: "As I step onto the wheatfield, I am reminded of the generations before me. If I fail, I will be the last Evans to farm this land.",
      day2: "This farm land is something I cherish with all my heart. I remember my grandfather telling me thge stories of the village, of how monsters would eventually eat all the crop. Did not know monsters could take the name DROUGHT ",
      day3: "The wheat field is calling for me. I need to keep presisiting with my effort in order to protect the land I have earned.",
      day4: "The second to last day has arrived. The clock is ticking, but I am going to harvest these final few crops.",
      final: "Taking a look at this soil for what may be my last time. It has never felt so nice to view soil, and crop.",
      requiresInput: false,
  },
  home_reflection: {
      day1: "As I sit by the candlelight, the weight of this season rests heavily on my shoulders. If I fail, I lose everything.",
      day2: "Another long day has passed. The sun has been draining my will to continue, and my legs continue to ache. I need some rest for the moment.",
      day3: "I stare at the wooden beams of my home, wondering if it will still be mine in a week.",
      day4: "Tomorrow is my last. Tonight really may be my last night sleeping well, so I am going to sleep as if it is my last.",
      final:"Lets hope this all ends well.",
      requiresInput: false,
  },
  well_history: {
      day1: "This well has stood for over a hundred years. My great-grandfather built it to ensure our farm never went dry. These holy waters have blessed us all.",
      day2: "The drought has lowered the water level. I draw a bucket, hoping it's enough.",
      day3: "I stare into the well. There seems one or two buckets full left before it is all out.",
      day4:"The holy waters have seemed to finally leave, oh no...",
      final: "Goodbye my friend, for this may be my last time seeing you.",
      requiresInput: false,
  },
  daily_updates: {
    day1: { text: "The drought last season destroyed your crops. I, Richard Evans, must produce 200 bushels this season or lose my land.", requiresInput: false },
    day2: { text: "Another day, another challenge. The villagers are speaking of a storm that approaches. Some people nearby have offered to protect the crop in exchange for some gold. Should I take them up on their offer?", requiresInput: true, choices: ["yes", "no"] },
    day3: { text: "The wheat is growing. But another challenge presents itself. There was a recent drought that plagued the village. As a result, water in the well has dried up. I can still buy water, but for double price. Should I sacrifice some of my land for gold in order to be able to obtain water for regrowth of my plants?", requiresInput: true, choices: ["yes", "no"] },
    day4: { text: "The final days are approaching. A pest swarm came by the village and destroyed some of my crops. However, I can use gold to buy some seed to plant. 10 gold for 10 seed. Should I do it?", requiresInput: true, choices: ["yes", "no"] },
    final: { text: "This is it. The last day to meet my goal. I'll gather up all the bushels.", requiresInput: false },
  },
};



const locations = [
  {
    name: "Market",
    position: new THREE.Vector3(-200, 0, 0),
    event: "event2", // Trade even
    visited: false,
  },
  {
    name: "Wheatfield",
    position: new THREE.Vector3(100, 0, -150),
    event: "wheatfield_legacy", // First harvest dialogue
    visited: false,
  },
  {
    name: "Home",
    position: new THREE.Vector3(-100, 0, 200),
    event: "final", // Final harvest dialogue
    visited: false,
  },
  {
    name: "Well",  // 💧 Adding the Well location
    position: new THREE.Vector3(-5, 0, -5), // Match the well's actual position
    event: "well_history", // First well visit dialogue
    visited: false,
  },
];

window.currentStory = 'intro'; // Start at the intro
let totalBushels = 0; // Track total bushels
let wellVisitCount = 0; // 💧 Track well visits

// Function to determine the next story node based on the current node and choice
const getNextStoryNode = (current, choice) => {
  if (current === 'intro') {
    return choice === 'beans' ? 'beans' : 'wheat';
  } else if (current === 'beans' || current === 'wheat') {
    return 'event2';
  } else if (current === 'event2') {
    return 'harvest1';
  } else if (current === 'harvest1') {
    return 'event4';
  } else if (current === 'event4') {
    return 'final';
  }
  return current; // Default to stay on the same node if no match
};
let lastStoryShown = ""; // ✅ Ensures this variable is defined

const showDialogue = () => {
  if (currentStory === lastStoryShown) return; // ✅ Prevent duplicate calls

  console.log(` Loading dialogue for: ${currentStory}`);

  if (!story[currentStory]) {
      console.warn(`⚠️ No story entry found for: ${currentStory}`);
      storyEventsSection.textContent = "⚠️ No story entry available.";
      return;
  }

  let scene = story[currentStory];
  let dialogueText = scene[`day${currentDay}`] || scene.final || scene.text || "No dialogue available.";

  console.log(` Displaying dialogue: ${dialogueText}`);

  storyEventsSection.innerHTML = "";
  const textParagraph = document.createElement('p');
  textParagraph.textContent = dialogueText;
  storyEventsSection.appendChild(textParagraph);

  lastStoryShown = currentStory; // ✅ Store last shown dialogue

  // ✅ Track the dialogue shown
  dialogueHistory.push({ day: currentDay, event: currentStory, text: dialogueText });
  localStorage.setItem("dialogueHistory", JSON.stringify(dialogueHistory)); // Save to localStorage

  // ✅ Auto-open journal when new dialogue appears
  if (!journalOpenedManually) {
      journalContainer.style.display = "block";
      console.log(" Auto-opening journal for new dialogue.");
  }
};








const handleUserChoice = (choice) => {
  choice = choice.toLowerCase().trim(); // Normalize input

  if (story[currentStory]?.choices?.[choice]) {
      currentStory = getNextStoryNode(currentStory, choice);
      showDialogue(); // Immediately update UI
  } else {
      storyEventsSection.textContent = "❌ Invalid choice. Try again.";
      setTimeout(showDialogue, 2000); // Retry after 2 seconds
  }
};


// Function to handle final harvest input
const handleFinalHarvest = () => {
  console.log(" Final harvest time! Checking total bushels...");

  // Create a prompt for the player to enter their total bushels
  const totalBushelsInput = prompt("Enter the total number of bushels you've collected:");

  if (!totalBushelsInput) {
      console.log(" No input received.");
      return;
  }

  const totalBushels = parseInt(totalBushelsInput, 10);

  if (isNaN(totalBushels)) {
      console.warn("❌ Invalid number entered.");
      storyEventsSection.textContent = "⚠️ Please enter a valid number.";
      return;
  }

  console.log(`Player entered: ${totalBushels} bushels`);

  // Determine win or loss condition
  if (totalBushels >= 200) {
      console.log(" You win! The farm is saved!");
      storyEventsSection.textContent = `🏆 Congratulations! You produced ${totalBushels} bushels and saved the farm! 🎉`;
  } else {
      console.log(" You lose. The farm is lost.");
      storyEventsSection.textContent = ` Unfortunately, you only produced ${totalBushels} bushels and could not save the farm. The land is lost.`;
  }

  // Hide input after final result
  inputBox.style.display = 'none';

  // Save game outcome to localStorage
  localStorage.setItem("gameOver", "true");
  localStorage.setItem("finalBushels", totalBushels);

  // Optionally offer a restart button
  const restartButton = document.createElement('button');
  restartButton.textContent = "Restart Game";
  restartButton.style.marginTop = "10px";
  restartButton.style.padding = "10px";
  restartButton.style.fontSize = "16px";
  restartButton.style.cursor = "pointer";
  restartButton.style.backgroundColor = "#d9534f"; // Red color for emphasis
  restartButton.style.color = "white";
  restartButton.style.border = "none";
  restartButton.style.borderRadius = "5px";
  
  restartButton.addEventListener('click', () => {
      resetGame();
      location.reload();
  });

  journalContainer.appendChild(restartButton);
};


// Add event listener for user input
// ✅ Listen for Enter key when typing in input box
inputBox.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
      handleDailyInput(event); // ✅ Call function when user presses Enter
  }
});


function showJournal() {
  journalContainer.style.display = 'block';
  journalOpenedManually = false; // ✅ Reset flag when journal opens
  updateJournal();
  showDialogue();
}


// Add a button to open the journal
const openJournalButton = document.createElement('button');
openJournalButton.textContent = 'Open Journal';
openJournalButton.style.position = 'absolute';
openJournalButton.style.top = '150px';
openJournalButton.style.left = '20px';
openJournalButton.style.padding = '10px';
openJournalButton.style.borderRadius = '5px';
openJournalButton.style.fontSize = '14px';
openJournalButton.style.cursor = 'pointer';
openJournalButton.style.backgroundColor = '#6c757d'; // Neutral color
openJournalButton.style.color = 'white';
openJournalButton.style.border = 'none';
openJournalButton.addEventListener('click', showJournal);

document.body.appendChild(openJournalButton);
// Start the dialogue in the journal
showDialogue();
let homeVisitCount = 0; // 🏡 Track number of nights at home

const checkLocationProximity = () => { 
  if (!workerman) return;

  const playerPosition = new THREE.Vector3();
  workerman.getWorldPosition(playerPosition);

  locations.forEach((location) => {
    const distance = playerPosition.distanceTo(location.position);

    if (distance <= 50 && !location.visited) {
      console.log(` Entered ${location.name}`);

      let eventKey = location.event;
      if (location.name === "Home") eventKey = "home_reflection";
      if (location.name === "Wheatfield") eventKey = "wheatfield_legacy";
      if (location.name === "Well") eventKey = "well_history";

      console.log(` Setting currentStory to: ${eventKey}`);

      // ✅ Ensure journal opens when a new dialogue loads
      if (story[eventKey]) {
        currentStory = eventKey;
        journalOpenedManually = false; // ✅ Reset flag to allow reopening
        showDialogue();
      } else {
        console.warn(`⚠️ No dialogue found for ${eventKey}`);
        storyEventsSection.textContent = "⚠️ No dialogue available for this event.";
      }

      location.visited = true; // ✅ Prevent re-triggering in the same day
    }
  });

  // ✅ Reset visits at the start of a new day
  if ((time % dayDuration) / dayDuration < 0.01) {
    locations.forEach((location) => location.visited = false);
  }
};


let dailyDialogueShownForDay = 0; // Track the last day dialogue was shown

const showDailyDialogue = () => {
  console.log(` [showDailyDialogue] Triggered! Current Day: ${currentDay}`);

  if (dailyDialogueShownForDay === currentDay) {
      console.warn(` Dialogue for Day ${currentDay} already shown. Skipping.`);
      return;
  }

  let eventKey = `day${currentDay}`;
  let dialogueData = story.daily_updates[eventKey] || story.daily_updates.final;

  if (!dialogueData) {
      console.warn(`⚠️ No daily update found for: ${eventKey}`);
      return;
  }

  console.log(` [showDailyDialogue] Displaying: ${dialogueData.text}`);

  currentStory = eventKey;
  storyEventsSection.innerHTML = "";

  const textParagraph = document.createElement("p");
  textParagraph.textContent = dialogueData.text;
  storyEventsSection.appendChild(textParagraph);

  journalContainer.style.display = "block"; // Auto-open journal

  if (dialogueData.requiresInput) {
      console.log(" Event requires input. Showing input box...");
      inputBox.style.display = "block";
      inputBox.focus();
  } else {
      inputBox.style.display = "none";
  }

  dailyDialogueShownForDay = currentDay;
  localStorage.setItem("lastDayDialogueShown", currentDay);

  // ✅ Track daily dialogue shown
  dialogueHistory.push({ day: currentDay, event: eventKey, text: dialogueData.text });
  localStorage.setItem("dialogueHistory", JSON.stringify(dialogueHistory));
};








const userResponses = JSON.parse(localStorage.getItem("userInputs")) || []; // Load previous data

const handleDailyInput = () => {
    let userChoice = inputBox.value.trim().toLowerCase();
    let eventKey = `day${currentDay}`;
    let dialogueData = story.daily_updates[eventKey];

    if (!dialogueData || !dialogueData.requiresInput) return;

    if (dialogueData.choices.includes(userChoice)) {
        console.log(` User chose: ${userChoice}`);

        // ✅ Save question & answer in `userResponses`
        userResponses.push({ question: dialogueData.text, answer: userChoice });

        // ✅ Save to localStorage
        localStorage.setItem("userInputs", JSON.stringify(userResponses));

        updateJournal();
        inputBox.style.display = "none";
        inputBox.value = "";
    } else {
        console.warn(" Invalid choice. Try again.");
        storyEventsSection.textContent = "Invalid choice. Please enter 'yes' or 'no'.";
        inputBox.value = "";
    }
};












// Add a farm fence
const createFence = (x, z, rotate = false) => {
  const postGeometry = new THREE.CylinderGeometry(0.5, 0.5, 8, 16);
  const postMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown wood
  const post = new THREE.Mesh(postGeometry, postMaterial);
  post.position.set(x, 4, z);

  const railGeometry = new THREE.BoxGeometry(12, 0.5, 0.5);
  const railMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
  const topRail = new THREE.Mesh(railGeometry, railMaterial);
  const bottomRail = new THREE.Mesh(railGeometry, railMaterial);

  if (rotate) {
    topRail.rotation.y = Math.PI / 2;
    bottomRail.rotation.y = Math.PI / 2;
  }

  topRail.position.set(x, 6, z);
  bottomRail.position.set(x, 3, z);

  scene.add(post, topRail, bottomRail);
};
let marketLoaded = false; // ✅ Declare globally

const fbxLoader = new FBXLoader();
const buildings = []
// Load FBX model (market)
let market; // Store the market object globally for collision detection
fbxLoader.load(
  '/MARKET.fbx',
  (object) => {
    object.position.set(-200, 0, 0); // Set market position
    object.scale.set(0.05, 0.05, 0.05); // Scale the market
    scene.add(object);

    // Add the market to the buildings array
    buildings.push({
      name: 'Market',
      position: object.position,
      visited: false,
    });

    market = object; // Assign the market object for future use
    marketLoaded = true;
  },
  (xhr) => {
    console.log((xhr.loaded / xhr.total) + '% loaded');
  },
  (error) => {
    console.error('Error loading FBX model:', error);
  }
);
// Create a square fence perimeter with touching fences
for (let x = -50; x <= 50; x += 10) {
  createFence(x+100, -200, false); // Bottom side
  createFence(x+100, -100, false);  // Top side
}
for (let z = -50; z <= 50; z += 10) {
  createFence(150, z - 150, true); // Left side
  createFence(50, z - 150, true);  // Right side
}
  const instanceCount = 50;
  const wheatGeometry = new THREE.BoxGeometry(4, 8, 2);
  const wheatMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 }); // Yellow color for wheat
  const wheatMesh = new THREE.InstancedMesh(wheatGeometry, wheatMaterial, instanceCount);
  for (let i = 0; i < instanceCount; i++) {
    const x = Math.random() * 100 + 50;
    const z = Math.random() * 100 - 200;
    const matrix = new THREE.Matrix4().setPosition(x, 4, z);
    wheatMesh.setMatrixAt(i, matrix);
  }
  const wheatGrowthLevels = new Array(instanceCount).fill(1); // 🌾 Track growth state (1 = small, 2 = grown)

  const resetWheatField = (fullReset) => {
    let wheatToGenerate = fullReset ? 50 : 40; // ✅ 50 if paid, else 40

    console.log(` Resetting wheat field! (Watered: ${wheatWatered}, Full Reset: ${fullReset})`);

    for (let i = 0; i < wheatToGenerate; i++) {
        const x = Math.random() * 100 + 50; // Random position inside fenced area
        const z = Math.random() * 100 - 200;
        const matrix = new THREE.Matrix4().setPosition(x, 4, z);

        wheatMesh.setMatrixAt(i, matrix);
        wheatGrowthLevels[i] = 1; // Reset growth state
    }

    wheatMesh.instanceMatrix.needsUpdate = true; // Apply changes
    console.log(` Wheat field has been reset with ${wheatToGenerate} crops!`);

    wheatWatered = false;
    wheatPromptVisible = false;
};

  
  scene.add(wheatMesh);

let wheatfieldPosition = new THREE.Vector3(100, 0, -150); // Center of wheatfield
const wheatfieldDistance = 50; // Distance threshold for watering interaction
let wheatWatered = false; // Has the wheat been watered?
let wheatPromptVisible = false; // Prevents multiple UI popups
let lastWateredDay = 0; // ✅ Tracks when the player last watered the field

const wateringBox = document.createElement('div');
wateringBox.style.position = 'absolute';
wateringBox.style.bottom = '20px';
wateringBox.style.left = '50%';
wateringBox.style.transform = 'translateX(-50%)';
wateringBox.style.padding = '15px';
wateringBox.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
wateringBox.style.color = 'white';
wateringBox.style.fontFamily = 'Arial, sans-serif';
wateringBox.style.fontSize = '16px';
wateringBox.style.borderRadius = '5px';
wateringBox.style.display = 'none'; // Initially hidden
document.body.appendChild(wateringBox);

const waterWheatfield = () => {
  if (water > 0) {
    water--; // Deduct 1 water bucket
    wheatWatered = true; // ✅ Mark field as watered
    lastWateredDay = currentDay; // ✅ Store the current day as the last watered day
    console.log(` The wheatfield has been watered on Day ${currentDay}! Water left: ${water}`);

    updateJournal(); // ✅ Update UI
    wateringBox.style.display = 'none'; // Hide prompt
    wheatPromptVisible = false; // Reset prompt state
  } else {
    console.log(" You don't have enough water!");
    wateringBox.innerHTML = `You need at least 1 water to water the field.`;
    setTimeout(() => {
      wateringBox.style.display = 'none';
      wheatPromptVisible = false;
    }, 3000);
  }
};

  
const offerWatering = () => {
  if (water > 0) { // ✅ Only show the prompt if the player has water
    wateringBox.innerHTML = `
      The soil looks dry. Water the field?
      <br>
      <button id="waterYes">Yes</button>
      <button id="waterNo">No</button>
    `;
    wateringBox.style.display = 'block';
  } else {
    console.log(" Not enough water to water the field.");
    wateringBox.style.display = 'none'; // Hide the UI if water is 0
    wheatPromptVisible = false;
  }
};

const checkWheatfieldProximity = () => {
  if (!workerman) return;

  const playerPosition = new THREE.Vector3();
  workerman.getWorldPosition(playerPosition);

  const distance = playerPosition.distanceTo(wheatfieldPosition);

  if (distance <= wheatfieldDistance) {
    if (!locations.find((loc) => loc.name === "Wheatfield").visited) {
      console.log(" Entered Wheatfield - Checking dialogue...");

      // ✅ Track wheatfield visits
      wheatfieldVisitCount++;

      // ✅ Select appropriate dialogue for each visit
      let eventKey = "wheatfield_legacy";
      if (wheatfieldVisitCount === 2) eventKey = "wheatfield_legacy_2";
      if (wheatfieldVisitCount >= 3) eventKey = "wheatfield_legacy_final";

      // ✅ Display dialogue
      if (story[eventKey]) {
        currentStory = eventKey;
        showDialogue();
      }

      // ✅ Mark location as visited (prevents re-triggering)
      locations.find((loc) => loc.name === "Wheatfield").visited = true;
    }

    // ✅ Check if watering is needed
    if (!wheatWatered && !wheatPromptVisible) {
      console.log(" The wheat needs watering!");
      wheatPromptVisible = true;
      offerWatering(); // 🌱 Show watering prompt
    }
  }

  // ✅ Reset daily so the player can visit again
  if ((time % dayDuration) / dayDuration < 0.01) {
    locations.find((loc) => loc.name === "Wheatfield").visited = false;
    wheatPromptVisible = false;
    wheatWatered = false;
    lastWateredDay = currentDay;  // ✅ Ensure watering resets each day
}

};



document.body.addEventListener('click', (event) => {
  if (event.target.id === 'waterYes') {
      console.log(" Watering the wheatfield!");
      waterWheatfield();
  } else if (event.target.id === 'waterNo') {
      console.log("Declined to water.");
      wateringBox.style.display = 'none';
      wheatPromptVisible = false;
  }
});











// ✅ Declare global variables
let collectedWheat = 0; // Number of wheat the player has
let gold = 0; // Player's gold amount
const tradeDistance = 50; // Distance threshold to trigger trade
let tradeOffered = false; // Prevent multiple trade prompts

// ✅ Create trade box UI
const tradeBox = document.createElement('div');
tradeBox.style.position = 'absolute';
tradeBox.style.bottom = '20px';
tradeBox.style.left = '50%';
tradeBox.style.transform = 'translateX(-50%)';
tradeBox.style.padding = '15px';
tradeBox.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
tradeBox.style.color = 'white';
tradeBox.style.fontFamily = 'Arial, sans-serif';
tradeBox.style.fontSize = '16px';
tradeBox.style.borderRadius = '5px';
tradeBox.style.display = 'none'; // Initially hidden
document.body.appendChild(tradeBox);
const updateHUD = () => {
  console.log(` HUD Updated: Gold = ${gold}, Wheat = ${collectedWheat}`);

const progressSection = document.getElementById('progressSection');
  if (progressSection) {
      progressSection.textContent = `Bushels: ${collectedWheat} / 120 | Gold: ${gold}`;
  } else {
      console.error(" Journal progress section not found.");
  }
};
const checkWheatPickup = () => {
  if (!workerman || !wheatMesh) return;

  const workermanPosition = new THREE.Vector3();
  workerman.getWorldPosition(workermanPosition);

  for (let i = 0; i < instanceCount; i++) {
      const wheatMatrix = new THREE.Matrix4();
      wheatMesh.getMatrixAt(i, wheatMatrix);

      const wheatPosition = new THREE.Vector3().setFromMatrixPosition(wheatMatrix);
      const distance = workermanPosition.distanceTo(wheatPosition);

      if (distance < 5) { // If player is close enough to wheat
          console.log(` Picking up wheat at index ${i}, distance: ${distance}`);

          // Move wheat far away (simulate removing it)
          wheatMesh.setMatrixAt(i, new THREE.Matrix4().makeTranslation(1000, 1000, 1000)); 
          wheatGrowthLevels[i] = 0; // Mark wheat as "harvested"
          wheatMesh.instanceMatrix.needsUpdate = true; // Ensure changes are applied
          
          collectedWheat++; // ✅ Increase collected wheat
          console.log(` Total wheat collected: ${collectedWheat}`);

          updateJournal(); // ✅ Update UI immediately
          return; // Prevent multiple pickups at once
      }
  }
};




const updateJournal = () => {
  console.log(` Updating Journal: Day ${currentDay}, Bushels: ${collectedWheat}, Gold: ${gold}, Water: ${water}`);

  // ✅ Update individual elements within the journal instead of replacing text
  document.getElementById('dayCount').textContent = currentDay;
  document.getElementById('bushelCount').textContent = collectedWheat;
  document.getElementById('goldCount').textContent = gold;
  document.getElementById('waterCount').textContent = water;
};





const tradeWheatForGold = () => {
  if (collectedWheat > 0) {
    collectedWheat--;
    gold++;
    console.log(` Trade successful! Gold = ${gold}, Wheat = ${collectedWheat}`);

    updateJournal();
    tradeBox.style.display = 'none';
    tradeOffered = false;
  } else {
    console.log(' No wheat to trade.');
  }
};


//Function to offer a trade when near the market
const offerTrade = () => {
  if (collectedWheat > 0) {
    tradeBox.innerHTML = `
      You have ${collectedWheat} wheat crops. Do you want to trade 1 wheat for 1 gold?
      <br>
      <button id="tradeYes">Yes</button>
      <button id="tradeNo">No</button>
    `;
    tradeBox.style.display = 'block';
  } else {
    tradeBox.innerHTML = `You have no wheat crops to trade.`;
    tradeBox.style.display = 'block';
    setTimeout(() => {
      tradeBox.style.display = 'none';
    }, 3000);
  }
};
//Event for Trade Buttons
document.body.addEventListener('click', (event) => {
  if (event.target.id === 'tradeYes') {
    tradeWheatForGold();
  } else if (event.target.id === 'tradeNo') {
    tradeBox.style.display = 'none';
    tradeOffered = false;
  }
})
//Keep Trading Functionality for Market
const checkMarketProximity = () => {
  if (!workerman || !market) return;

  const playerPosition = new THREE.Vector3();
  workerman.getWorldPosition(playerPosition);

  const distance = playerPosition.distanceTo(market.position);

  if (distance <= tradeDistance && !tradeOffered) {
      offerTrade();
      tradeOffered = true;
  } else if (distance > tradeDistance) {
      tradeOffered = false;
      tradeBox.style.display = "none";
  }
};
;

// ✅ Create Sleep Prompt UI
const sleepBox = document.createElement('div');
sleepBox.style.position = 'absolute';
sleepBox.style.bottom = '20px';
sleepBox.style.left = '50%';
sleepBox.style.transform = 'translateX(-50%)';
sleepBox.style.padding = '15px';
sleepBox.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
sleepBox.style.color = 'white';
sleepBox.style.fontFamily = 'Arial, sans-serif';
sleepBox.style.fontSize = '16px';
sleepBox.style.borderRadius = '5px';
sleepBox.style.display = 'none'; // Initially hidden
document.body.appendChild(sleepBox);

// ✅ Ensure movement handlers exist before being referenced
const movementHandler = (event) => {
  if (!workerman) return;
  
  switch (event.key) {
      case 'ArrowUp':
          workerman.position.z -= 1;
          break;
      case 'ArrowDown':
          workerman.position.z += 1;
          break;
      case 'ArrowLeft':
          workerman.position.x -= 1;
          break;
      case 'ArrowRight':
          workerman.position.x += 1;
          break;
  }
};

const stopMovementHandler = (event) => {
  if (!workerman) return;
  console.log(" Player stopped moving.");
};

// ✅ Add event listeners when game starts
document.addEventListener("keydown", movementHandler);
document.addEventListener("keyup", stopMovementHandler);

// ✅ Function to Show Sleep Prompt
let sleepBoxVisible = false; // ✅ Track if sleep box is visible

const showSleepPrompt = () => {
  if (sleepBoxVisible) return; // Prevent multiple prompts
  console.log(" Showing sleep prompt!");

  sleepBox.innerHTML = `
      <strong>It's getting late.</strong> Do you want to sleep and start a new day?
      <br>
      <button id="sleepYes">Yes</button>
      <button id="sleepNo">No</button>
  `;
  sleepBox.style.display = 'block';
  sleepBoxVisible = true; // Prevents duplicate prompts
};



document.body.addEventListener('click', (event) => {
  if (event.target.id === 'sleepYes') {
      console.log(" Player chose to sleep!");
      sleepBox.style.display = 'none';
      sleepBoxVisible = false; // ✅ Ensure it resets properly
      handleSleep();
  } else if (event.target.id === 'sleepNo') {
      console.log(" Player chose not to sleep.");
      sleepBox.style.display = 'none'; // Hide the prompt
      sleepBoxVisible = false; // ✅ Ensure the prompt can appear again later
  }
});




let homeVisitedToday = false; // ✅ Track if home dialogue was shown already

const checkHomeProximity = () => {
  if (!workerman) return;

  const playerPosition = new THREE.Vector3();
  workerman.getWorldPosition(playerPosition);

  const homePosition = new THREE.Vector3(-100, 0, 200);
  const homeDistance = 50;
  const distance = playerPosition.distanceTo(homePosition);

  const timeProgress = (time % dayDuration) / dayDuration;
  console.log(` Time Progress: ${timeProgress.toFixed(2)} | Current Day: ${currentDay}`);

  if (distance <= homeDistance && !homeVisitedToday) {
      console.log(" Entered Home - Showing journal dialogue...");
      homeVisitedToday = true;

      let eventKey = `home_reflection`;
      let dialogueText = story[eventKey][`day${currentDay}`] || story[eventKey].final;

      if (dialogueText) {
          console.log(` Showing home dialogue: ${dialogueText}`);
          currentStory = eventKey;
          showDialogue();
      } else {
          console.warn(` No dialogue found for ${eventKey} on Day ${currentDay}`);
      }
  }

  if (timeProgress > 0.5 && !sleepBoxVisible) {
      console.log(" Night-time reached! Showing sleep prompt.");
      showSleepPrompt();
  }

  // ✅ Ensure home dialogue resets each morning
  if (timeProgress < 0.2) {
      homeVisitedToday = false; 
  }
};











// ✅ Handle Sleep Logic
let sleeping = false;
let dayHasChanged = false;  // ✅ NEW FLAG to prevent duplicate calls

const handleSleep = () => {
  if (sleeping) return;
  sleeping = true;
  sleepBoxVisible = false;

  console.log(" Going to sleep... Current Day before sleep:", currentDay);
  sleepBox.style.display = 'none';

  // ✅ Step 1: Show home reflection dialogue before sleeping
  let eventKey = `home_reflection`;
  let dialogueText = story[eventKey][`day${currentDay}`] || story[eventKey].final;

  if (dialogueText) {
      console.log(` Showing home reflection before sleep: ${dialogueText}`);
      currentStory = eventKey;
      showDialogue();  // ✅ Display the home reflection dialogue
  } else {
      console.warn(` No home reflection dialogue found for ${eventKey} on Day ${currentDay}`);
  }

  // ✅ Step 2: Wait for 5 seconds before fading to black
  setTimeout(() => {
      // Hide scene to simulate sleeping
      renderer.domElement.style.display = "none";
      document.body.style.backgroundColor = "black";
      console.log(" Screen fades to black after 5 seconds.");

      // ✅ Step 3: Save player position before sleeping
      if (workerman) {
          const positionData = {
              x: workerman.position.x,
              y: workerman.position.y,
              z: workerman.position.z
          };
          localStorage.setItem("lastPlayerPosition", JSON.stringify(positionData));
          console.log(" Player position saved:", positionData);
      }

      if (currentDay >= 5) { 
          // 🚨 Day 6 - Display Win/Loss Results
          console.log(" Day 6 reached! Checking if player wins or loses...");
          setTimeout(() => {
              renderer.domElement.style.display = "block";
              document.body.style.backgroundColor = "";
              showGameResult(); // Display win/loss message
          }, 2000);
          return;
      }

      // ✅ Step 4: Proceed with sleep logic (new day starts)
      console.log(` New day is starting! Updating currentDay from ${currentDay} to ${currentDay + 1}`);
      currentDay += 1;
      localStorage.setItem("currentDay", currentDay);
      lastDayDialogueShown = currentDay;
      localStorage.setItem("lastDayDialogueShown", currentDay);

      time = 0;
      homeVisitedToday = false;
      journalOpenedManually = false; // ✅ Reset journal state

      setTimeout(() => {
          resetWheatField();
          wellVisitCount = 0;
          wellTradeOffered = false;
          wheatPromptVisible = false;
          locations.forEach((location) => (location.visited = false));

          setTimeout(() => {
              // Wake up (Show scene again)
              renderer.domElement.style.display = "block";
              document.body.style.backgroundColor = "";

              sleeping = false;
              sleepBoxVisible = false;

              console.log(" New day starts! Updated currentDay:", currentDay);

              // ✅ Ensure the journal is open at the start of the new day
              journalContainer.style.display = "block";
              console.log(" Journal forced open on new day.");

              // ✅ Only show dialogue once
              console.log(` Calling showDailyDialogue() after waking up to Day ${currentDay}...`);
              showDailyDialogue();

              updateJournal();
          }, 2000);

      }, 2000);
  }, 5000);  // ✅ **Wait for 5 seconds before screen turns black**
};


const showGameResult = () => {
  
  journalContainer.style.display = "block"; // Force journal to open
  storyEventsSection.innerHTML = ""; // Clear previous entries

  if (collectedWheat >= 120) {
      // Player Wins
      console.log(" Congratulations! You produced enough bushels and saved your farm!");
      storyEventsSection.innerHTML = `
          <h3>🎉 Congratulations! 🎉</h3>
          <p>You successfully produced <strong>${collectedWheat}</strong> bushels of wheat!</p>
          <p>You saved the farm and secured your family's future.</p>
      `;
  } else {
      // Player Loses
      console.log(" Game Over. You did not produce enough bushels.");
      storyEventsSection.innerHTML = `
          <h3> Game Over </h3>
          <p>You only produced <strong>${collectedWheat}</strong> bushels of wheat.</p>
          <p>Unfortunately, it was not enough, and you lost the farm.</p>
      `;
  }
  console.log(" Checking final results...");

    // ✅ Save final stats to localStorage before redirecting
    localStorage.setItem("finalDay", currentDay);
    localStorage.setItem("totalWheatCollected", collectedWheat);
    localStorage.setItem("totalWaterBuckets", water);
    localStorage.setItem("userInputs", JSON.stringify(userResponses));

    // ✅ Redirect to the summary page after a delay (for effect)
    setTimeout(() => {
        window.location.href = "summary.html";
    }, 3000);  // Wait 3 seconds before redirecting
};












let workerman;
let mixer;
let action;

// Load the FBX model with embedded animations
fbxLoader.load(
  '/ye4.fbx', // Replace with the actual path to your `ye.fbx` file
  (object) => {
    // Initialize the model
    mixer = new THREE.AnimationMixer(object);
    workerman = object;
    workerman.scale.set(0.1, 0.1, 0.1); // Adjust scale as needed
    workerman.position.set(50, 0, 50); // Adjust position as needed
    scene.add(workerman);

    // Initialize and play the first animation
    if (object.animations.length > 0) {
      action = mixer.clipAction(object.animations[0]); // Get the first animation
      action.setLoop(THREE.LoopRepeat); // Set to loop infinitely
      action.play(); // Start the animation
      console.log('Animation initialized:', object.animations[0].name);
    } else {
      console.warn('No animations found in the FBX file.');
    }
  },
  (xhr) => {
    console.log(`FBX Loading Progress: ${(xhr.loaded / xhr.total) * 100}%`);
  },
  (error) => {
    console.error('Error loading FBX model:', error);
  }
);
const cameraOffset = new THREE.Vector3(0, 5, 10); // Offset from the workerman's position

// Key movement logic for the workerman
let workermanSpeed = 1;
let isWorkermanMoving = false;

document.addEventListener('keydown', (event) => {
  if (document.activeElement === inputBox) return; // ✅ Prevent movement if typing

  if (workerman && action) {
      action.play(); // ✅ Start animation only for movement keys
      isWorkermanMoving = true;
  }

  if (workerman) {
      switch (event.key) {
          case 'ArrowUp':
              workerman.position.z -= workermanSpeed; // Move forward
              workerman.rotation.y = 0;
              break;
          case 'ArrowDown':
              workerman.position.z += workermanSpeed; // Move backward
              workerman.rotation.y = Math.PI;
              break;
          case 'ArrowLeft':
              workerman.position.x -= workermanSpeed; // Move left
              workerman.rotation.y = Math.PI / 2;
              break;
          case 'ArrowRight':
              workerman.position.x += workermanSpeed; // Move right
              workerman.rotation.y = -Math.PI / 2;
              break;
      }
  }
});

document.addEventListener('keyup', (event) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
    if (isWorkermanMoving && action) {
      action.stop(); // Stop animation
      isWorkermanMoving = false;
    }
  }
});



// Load FBX model (house)
const loadHouse = (position) => {
  fbxLoader.load(
    '/house5.fbx',
    (object) => {
      object.traverse((child) => {
        if (child.isMesh) {
          if (child.name.toLowerCase().includes('wall')) {
            child.material = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown walls
          } else if (child.name.toLowerCase().includes('window')) {
            child.material = new THREE.MeshStandardMaterial({ color: 0xFFFF00, emissive: 0xFFFF00 }); // Yellow windows
          }
        }
      });
      object.position.set(position.x, position.y, position.z); // Set house position
      object.scale.set(0.1, 0.1, 0.1); // Scale the house
      scene.add(object);
    },
    (xhr) => {
      console.log((xhr.loaded / xhr.total) + '% loaded');
    },
    (error) => {
      console.error('Error loading FBX model:', error);
    }
  );
};

// Place 5 houses at well-spaced positions
const housePositions = [
  { x: -100, y: 0, z: 200 },
  { x: -50, y: 0, z: -50 },
  { x: 250, y: 0, z: 50 },
  { x: 200, y: 0, z: 200 },
  
];
housePositions.forEach((pos) => loadHouse(pos));

let water = 0; // Number of water buckets collected
const wellDistance = 30; // Distance threshold to buy water
let wellLoaded = false; // Ensure well is loaded before interaction
let well; // Reference to the well model
let wellTradeOffered = false; // Prevent multiple trade prompts

// Load FBX model (well)
fbxLoader.load(
  '/well2.fbx',
  (object) => {
    object.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9, metalness: 0.1 }); // Less shiny brown color for the well
      }
    });
    object.position.set(-5, 0, -5); // Position the well on the green plane
    object.scale.set(0.02, 0.02, 0.02); // Scale the well to smaller size
    scene.add(object);
    well = object; // ✅ Store the well for distance checking
    wellLoaded = true;
  },
  (xhr) => {
    console.log((xhr.loaded / xhr.total) + '% loaded');
  },
  (error) => {
    console.error('Error loading FBX model:', error);
  }
);

const progressSection = document.createElement('div');
progressSection.id = "progressSection";
progressSection.style.fontWeight = 'bold';
progressSection.style.padding = '10px';
progressSection.style.border = '1px solid #d3cbb8';
progressSection.style.borderRadius = '5px';
progressSection.style.backgroundColor = '#eee';
progressSection.style.marginBottom = '10px';
journalContainer.appendChild(progressSection);

// ✅ Initial population of data inside the journal
progressSection.innerHTML = `
    <p><strong>📅 Day:</strong> <span id="dayCount">${currentDay}</span></p>
    <p><strong>🌾 Bushels:</strong> <span id="bushelCount">${collectedWheat}</span> / 120</p>
    <p><strong>💰 Gold:</strong> <span id="goldCount">${gold}</span></p>
    <p><strong>💧 Water:</strong> <span id="waterCount">${water}</span></p>
`;


const waterTradeBox = document.createElement('div');
waterTradeBox.style.position = 'absolute';
waterTradeBox.style.bottom = '20px';
waterTradeBox.style.left = '50%';
waterTradeBox.style.transform = 'translateX(-50%)';
waterTradeBox.style.padding = '15px';
waterTradeBox.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
waterTradeBox.style.color = 'white';
waterTradeBox.style.fontFamily = 'Arial, sans-serif';
waterTradeBox.style.fontSize = '16px';
waterTradeBox.style.borderRadius = '5px';
waterTradeBox.style.display = 'none'; // Initially hidden
document.body.appendChild(waterTradeBox);

// ✅ Ensure this function is called whenever these actions happen:
const buyWater = () => {
  if (gold >= 2) {
    gold -= 2; 
    water++; 
    console.log(` Bought 1 bucket of water! Water: ${water}, Gold: ${gold}`);

    updateJournal(); // ✅ Ensure UI updates
    waterTradeBox.style.display = 'none'; 
    wellTradeOffered = false; 
  } else {
    console.log(' Not enough gold!');
  }
};

const offerWaterTrade = () => {
  if (gold >= 2) {
    waterTradeBox.innerHTML = `
      You have ${gold} gold. Buy a bucket of water for 2 gold?
      <br>
      <button id="buyWaterYes">Yes</button>
      <button id="buyWaterNo">No</button>
    `;
    waterTradeBox.style.display = 'block';
  } else {
    waterTradeBox.innerHTML = `You need at least 2 gold to buy water.`;
    waterTradeBox.style.display = 'block';
    setTimeout(() => {
      waterTradeBox.style.display = 'none';
    }, 3000);
  }
};
// ✅ Step 6: Event Listener for Water Purchase (Place it here!)
document.body.addEventListener('click', (event) => {
  if (event.target.id === 'buyWaterYes') {
      console.log(" Buying water!");
      buyWater(); // Call function to buy water
  } else if (event.target.id === 'buyWaterNo') {
      console.log(" Declined water purchase.");
      waterTradeBox.style.display = 'none';
      wellTradeOffered = false; // Reset trade state
  }
});
const checkWellProximity = () => {
  if (!workerman || !well) return;

  const playerPosition = new THREE.Vector3();
  workerman.getWorldPosition(playerPosition);

  const distance = playerPosition.distanceTo(well.position);

  // ✅ Ensure player can visit the well daily
  if (distance <= wellDistance && wellVisitCount < currentDay) { 
      console.log(` Entered Well - Day ${currentDay}, Showing dialogue...`);

      wellVisitCount = currentDay;  // ✅ Ensure wellVisitCount updates with days

      // ✅ Pick dialogue based on the day
      let eventKey = "well_history";
      if (currentDay === 2) eventKey = "well_history_2";
      else if (currentDay >= 3) eventKey = "well_history_final";

      if (story[eventKey]) {
          currentStory = eventKey;
          showDialogue();
      } else {
          console.warn(` No dialogue found for ${eventKey}`);
      }

      // ✅ Call offerWaterTrade() to show the buttons
      if (!wellTradeOffered) {
          offerWaterTrade();  // 🚰 Now the trade box will appear!
          wellTradeOffered = true;  // Prevent multiple triggers
      }
  }
};

const resetGame = () => {
  console.log(" Resetting game to default state...");

  // ✅ Clear all saved game data
  localStorage.removeItem("currentDay");
  localStorage.removeItem("lastPlayerPosition");

  // ✅ Reset variables to initial values
  currentDay = 1;
  lastDay = 1;
  collectedWheat = 0;
  gold = 0;
  water = 0;
  wellVisitCount = 0;
  wellTradeOffered = false;
  wheatPromptVisible = false;
  locations.forEach((location) => location.visited = false);

  // ✅ Reset UI elements
  updateJournal();
  showDailyDialogue();

  // ✅ Reset player position to the starting point
  if (workerman) {
      workerman.position.set(50, 0, 50); // Set to default spawn location
  }

  console.log(" Game has been reset!");
};
const resetButton = document.createElement('button');
resetButton.textContent = 'Restart Game';
resetButton.style.position = 'absolute';
resetButton.style.top = '20px';
resetButton.style.right = '20px';
resetButton.style.padding = '10px';
resetButton.style.borderRadius = '5px';
resetButton.style.fontSize = '14px';
resetButton.style.cursor = 'pointer';
resetButton.style.backgroundColor = '#d9534f'; // Red color for emphasis
resetButton.style.color = 'white';
resetButton.style.border = 'none';
resetButton.addEventListener('click', () => {
    if (confirm("Are you sure you want to restart the game? This will erase all progress.")) {
        resetGame();
        location.reload(); // ✅ Reload the page to apply changes
    }
});
document.body.appendChild(resetButton);





let tower; // Store the tower reference globally

fbxLoader.load(
  '/yessir2.fbx',
  (object) => {
    object.position.set(0, 0, 150);
    object.rotation.y = Math.PI / 2;
    object.scale.set(0.2, 0.2, 0.2);
    scene.add(object);
    
    tower = object; // ✅ Store reference to hide later
  },
  (xhr) => {
    console.log((xhr.loaded / xhr.total) + '% loaded');
  },
  (error) => {
    console.error('Error loading FBX model:', error);
  }
);

const quitButton = document.createElement('button');
quitButton.textContent = 'Quit Game';
quitButton.style.position = 'absolute';
quitButton.style.top = '60px'; // Adjusted position
quitButton.style.right = '20px';
quitButton.style.padding = '10px';
quitButton.style.borderRadius = '5px';
quitButton.style.fontSize = '14px';
quitButton.style.cursor = 'pointer';
quitButton.style.backgroundColor = '#dc3545'; // Red color
quitButton.style.color = 'white';
quitButton.style.border = 'none';

// ✅ Event listener for quitting
quitButton.addEventListener('click', () => {
  const confirmQuit = confirm("Are you sure you want to quit the game?");
  if (confirmQuit) {
      console.log("🚪 Exiting game and saving stats...");

      // ✅ Run the showGameResult() function before quitting
      saveGameResult();

      // ✅ Redirect to summary page AFTER saving data
      setTimeout(() => {
          window.location.href = "summary.html";
      }, 1000);  // Small delay to ensure data is saved
  }
});

// ✅ Function to Save the Final Game Result Before Exiting
const saveGameResult = () => {
  let gameOutcomeText = "";

  if (collectedWheat >= 200) {
      gameOutcomeText = `🎉 Congratulations! You produced ${collectedWheat} bushels and saved the farm! 🎉`;
  } else {
      gameOutcomeText = `💀 Unfortunately, you only produced ${collectedWheat} bushels and could not save the farm. The land is lost.`;
  }

  // ✅ Store all necessary data for `summary.html`
  localStorage.setItem("finalDay", currentDay);
  localStorage.setItem("totalWheatCollected", collectedWheat);
  localStorage.setItem("totalWaterBuckets", water);
  localStorage.setItem("userInputs", JSON.stringify(userResponses));
  localStorage.setItem("gameOutcome", gameOutcomeText);

  // ✅ Save the dialogue history as well
  localStorage.setItem("dialogueHistory", JSON.stringify(dialogueHistory));

  console.log("✅ Game result saved:", gameOutcomeText);
};


// ✅ Add the button to the page
document.body.appendChild(quitButton);


// Add controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enableZoom = true; // Allow zooming in and out

// Define clock before animate() to avoid undefined error 
const clock = new THREE.Clock();
let lastAnimateTime = 0; // Store last time `animate()` was called

const animate = () => {
    requestAnimationFrame(animate);

    const now = Date.now(); // Get current timestamp
    
    lastAnimateTime = now; // Update last time for the next check

    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);

    if (workerman) { 
        checkLocationProximity();
        checkMarketProximity();
        checkWheatfieldProximity();
        checkWellProximity();
        checkHomeProximity();
        checkWheatPickup();
    }

    controls.update();

    renderer.render(scene, camera);
};

animate(); // Start animation loop
