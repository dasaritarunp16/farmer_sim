import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

window.scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 50);

let lastDayDialogueShown = 0;
const savedDialogueDay = localStorage.getItem("lastDayDialogueShown");
if (savedDialogueDay) {
    lastDayDialogueShown = parseInt(savedDialogueDay, 10);
}

let dialogueHistory = JSON.parse(localStorage.getItem("dialogueHistory")) || [];

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener("load", () => {
  const savedDay = localStorage.getItem("currentDay");
  if (savedDay) {
    currentDay = parseInt(localStorage.getItem("currentDay")) || 1;
  } else {
      currentDay = 1;
  }

  const savedPosition = localStorage.getItem("lastPlayerPosition");
  if (savedPosition) {
      const positionData = JSON.parse(savedPosition);
      const interval = setInterval(() => {
          if (workerman) {
              workerman.position.set(positionData.x, positionData.y, positionData.z);
              clearInterval(interval);
          }
      }, 100);
  }

  if (currentDay === 1) {
      currentStory = "intro";
      showDialogue();
  } else {
      showDailyDialogue();
  }
});

let journalOpenedManually = false;

const groundGeometry = new THREE.PlaneGeometry(500, 500);
const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.set(0, 0, 0);
scene.add(ground);

const fencedAreaGeometry = new THREE.PlaneGeometry(100, 100);
const fencedAreaMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
const fencedArea = new THREE.Mesh(fencedAreaGeometry, fencedAreaMaterial);
fencedArea.rotation.x = -Math.PI / 2;
fencedArea.position.set(100, 0.01, -150);
scene.add(fencedArea);

let ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
window.ambientLight = ambientLight;

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

let time = 0;
const dayDuration = 240;
let currentDay = 1;
let lastDay = 1;
const timeUpdateRate = 1;
let timeInterval;
let lastUpdateTime = 0;

const updateTime = () => {
  time += timeUpdateRate;
  updateDayNightCycle(timeUpdateRate);

  let calculatedDay = Math.floor(time / dayDuration) + 1;
  if (calculatedDay !== lastDay) {
      currentDay = calculatedDay;
      lastDay = calculatedDay;

      resetWheatField();
      wellVisitCount = 0;
      wellTradeOffered = false;
      locations.forEach((location) => location.visited = false);
      updateJournal();
      showDailyDialogue();
  }
};

timeInterval = setInterval(updateTime, 1000);

const updateDayNightCycle = () => {
  const normalizedTime = (time % dayDuration) / dayDuration;
  const dayColor = new THREE.Color(0x87ceeb);
  const nightColor = new THREE.Color(0x1a1a40);
  scene.background = dayColor.clone().lerp(nightColor, Math.sin(normalizedTime * Math.PI));

  const maxLightIntensity = 1;
  const minLightIntensity = 0.2;
  const lightIntensity = minLightIntensity + (maxLightIntensity - minLightIntensity) * (1 - Math.cos(normalizedTime * Math.PI)) / 2;
  ambientLight.intensity = lightIntensity;
  directionalLight.intensity = lightIntensity;
};

const journalContainer = document.createElement('div');
journalContainer.style.position = 'absolute';
journalContainer.style.top = '20px';
journalContainer.style.left = '20px';
journalContainer.style.padding = '20px';
journalContainer.style.backgroundColor = '#f4f1ea';
journalContainer.style.color = '#333';
journalContainer.style.fontFamily = 'Georgia, serif';
journalContainer.style.fontSize = '16px';
journalContainer.style.borderRadius = '10px';
journalContainer.style.width = '300px';
journalContainer.style.height = '400px';
journalContainer.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
journalContainer.style.border = '2px solid #d3cbb8';
journalContainer.style.display = 'none';
journalContainer.style.zIndex = '10';
document.body.appendChild(journalContainer);

const instructionsContainer = document.createElement('div');
instructionsContainer.style.position = 'absolute';
instructionsContainer.style.top = '20px';
instructionsContainer.style.left = '400px';
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
instructionsContainer.style.display = 'none';
instructionsContainer.style.zIndex = '10';
document.body.appendChild(instructionsContainer);

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

const openInstructionsButton = document.createElement('button');
openInstructionsButton.textContent = 'Open Instructions';
openInstructionsButton.style.position = 'absolute';
openInstructionsButton.style.top = '200px';
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

const inputBox = document.createElement('input');
inputBox.type = 'text';
inputBox.style.marginTop = '10px';
inputBox.style.padding = '10px';
inputBox.style.borderRadius = '5px';
inputBox.style.fontSize = '14px';
inputBox.style.width = '100%';
inputBox.style.boxSizing = 'border-box';
inputBox.style.display = 'none';
journalContainer.appendChild(inputBox);

const closeButton = document.createElement('button');
closeButton.textContent = 'X';
closeButton.style.position = 'absolute';
closeButton.style.top = '10px';
closeButton.style.right = '10px';
closeButton.style.backgroundColor = '#d9534f';
closeButton.style.color = 'white';
closeButton.style.border = 'none';
closeButton.style.borderRadius = '50%';
closeButton.style.width = '25px';
closeButton.style.height = '25px';
closeButton.style.cursor = 'pointer';
closeButton.style.fontWeight = 'bold';
closeButton.addEventListener('click', () => {
  journalContainer.style.display = 'none';
  journalOpenedManually = true;
});

journalContainer.appendChild(closeButton);

let wheatfieldVisitCount = 0;

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
    event: "event2",
    visited: false,
  },
  {
    name: "Wheatfield",
    position: new THREE.Vector3(100, 0, -150),
    event: "wheatfield_legacy",
    visited: false,
  },
  {
    name: "Home",
    position: new THREE.Vector3(-100, 0, 200),
    event: "final",
    visited: false,
  },
  {
    name: "Well",
    position: new THREE.Vector3(-5, 0, -5),
    event: "well_history",
    visited: false,
  },
];

window.currentStory = 'intro';
let totalBushels = 0;
let wellVisitCount = 0;

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
  return current;
};

let lastStoryShown = "";

const showDialogue = () => {
  if (currentStory === lastStoryShown) return;

  if (!story[currentStory]) {
      storyEventsSection.textContent = "No story entry available.";
      return;
  }

  let scene = story[currentStory];
  let dialogueText = scene[`day${currentDay}`] || scene.final || scene.text || "No dialogue available.";

  storyEventsSection.innerHTML = "";
  const textParagraph = document.createElement('p');
  textParagraph.textContent = dialogueText;
  storyEventsSection.appendChild(textParagraph);

  lastStoryShown = currentStory;

  dialogueHistory.push({ day: currentDay, event: currentStory, text: dialogueText });
  localStorage.setItem("dialogueHistory", JSON.stringify(dialogueHistory));

  if (!journalOpenedManually) {
      journalContainer.style.display = "block";
  }
};

const handleUserChoice = (choice) => {
  choice = choice.toLowerCase().trim();

  if (story[currentStory]?.choices?.[choice]) {
      currentStory = getNextStoryNode(currentStory, choice);
      showDialogue();
  } else {
      storyEventsSection.textContent = "Invalid choice. Try again.";
      setTimeout(showDialogue, 2000);
  }
};

const handleFinalHarvest = () => {
  const totalBushelsInput = prompt("Enter the total number of bushels you've collected:");

  if (!totalBushelsInput) {
      return;
  }

  const totalBushels = parseInt(totalBushelsInput, 10);

  if (isNaN(totalBushels)) {
      storyEventsSection.textContent = "Please enter a valid number.";
      return;
  }

  if (totalBushels >= 200) {
      storyEventsSection.textContent = `Congratulations! You produced ${totalBushels} bushels and saved the farm!`;
  } else {
      storyEventsSection.textContent = `Unfortunately, you only produced ${totalBushels} bushels and could not save the farm. The land is lost.`;
  }

  inputBox.style.display = 'none';
  localStorage.setItem("gameOver", "true");
  localStorage.setItem("finalBushels", totalBushels);

  const restartButton = document.createElement('button');
  restartButton.textContent = "Restart Game";
  restartButton.style.marginTop = "10px";
  restartButton.style.padding = "10px";
  restartButton.style.fontSize = "16px";
  restartButton.style.cursor = "pointer";
  restartButton.style.backgroundColor = "#d9534f";
  restartButton.style.color = "white";
  restartButton.style.border = "none";
  restartButton.style.borderRadius = "5px";
  
  restartButton.addEventListener('click', () => {
      resetGame();
      location.reload();
  });

  journalContainer.appendChild(restartButton);
};

inputBox.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
      handleDailyInput(event);
  }
});

function showJournal() {
  journalContainer.style.display = 'block';
  journalOpenedManually = false;
  updateJournal();
  showDialogue();
}

const openJournalButton = document.createElement('button');
openJournalButton.textContent = 'Open Journal';
openJournalButton.style.position = 'absolute';
openJournalButton.style.top = '150px';
openJournalButton.style.left = '20px';
openJournalButton.style.padding = '10px';
openJournalButton.style.borderRadius = '5px';
openJournalButton.style.fontSize = '14px';
openJournalButton.style.cursor = 'pointer';
openJournalButton.style.backgroundColor = '#6c757d';
openJournalButton.style.color = 'white';
openJournalButton.style.border = 'none';
openJournalButton.addEventListener('click', showJournal);

document.body.appendChild(openJournalButton);
showDialogue();

let homeVisitCount = 0;

const checkLocationProximity = () => { 
  if (!workerman) return;

  const playerPosition = new THREE.Vector3();
  workerman.getWorldPosition(playerPosition);

  locations.forEach((location) => {
    const distance = playerPosition.distanceTo(location.position);

    if (distance <= 50 && !location.visited) {
      let eventKey = location.event;
      if (location.name === "Home") eventKey = "home_reflection";
      if (location.name === "Wheatfield") eventKey = "wheatfield_legacy";
      if (location.name === "Well") eventKey = "well_history";

      if (story[eventKey]) {
        currentStory = eventKey;
        journalOpenedManually = false;
        showDialogue();
      } else {
        storyEventsSection.textContent = "No dialogue available for this event.";
      }

      location.visited = true;
    }
  });

  if ((time % dayDuration) / dayDuration < 0.01) {
    locations.forEach((location) => location.visited = false);
  }
};

let dailyDialogueShownForDay = 0;

const showDailyDialogue = () => {
  if (dailyDialogueShownForDay === currentDay) {
      return;
  }

  let eventKey = `day${currentDay}`;
  let dialogueData = story.daily_updates[eventKey] || story.daily_updates.final;

  if (!dialogueData) {
      return;
  }

  currentStory = eventKey;
  storyEventsSection.innerHTML = "";

  const textParagraph = document.createElement("p");
  textParagraph.textContent = dialogueData.text;
  storyEventsSection.appendChild(textParagraph);

  journalContainer.style.display = "block";

  if (dialogueData.requiresInput) {
      inputBox.style.display = "block";
      inputBox.focus();
  } else {
      inputBox.style.display = "none";
  }

  dailyDialogueShownForDay = currentDay;
  localStorage.setItem("lastDayDialogueShown", currentDay);

  dialogueHistory.push({ day: currentDay, event: eventKey, text: dialogueData.text });
  localStorage.setItem("dialogueHistory", JSON.stringify(dialogueHistory));
};

const userResponses = JSON.parse(localStorage.getItem("userInputs")) || [];

const handleDailyInput = () => {
    let userChoice = inputBox.value.trim().toLowerCase();
    let eventKey = `day${currentDay}`;
    let dialogueData = story.daily_updates[eventKey];

    if (!dialogueData || !dialogueData.requiresInput) return;

    if (dialogueData.choices.includes(userChoice)) {
        userResponses.push({ question: dialogueData.text, answer: userChoice });
        localStorage.setItem("userInputs", JSON.stringify(userResponses));

        updateJournal();
        inputBox.style.display = "none";
        inputBox.value = "";
    } else {
        storyEventsSection.textContent = "Invalid choice. Please enter 'yes' or 'no'.";
        inputBox.value = "";
    }
};

const createFence = (x, z, rotate = false) => {
  const postGeometry = new THREE.CylinderGeometry(0.5, 0.5, 8, 16);
  const postMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
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

let marketLoaded = false;
const fbxLoader = new FBXLoader();
const buildings = []

let market;
fbxLoader.load(
  '/MARKET.fbx',
  (object) => {
    object.position.set(-200, 0, 0);
    object.scale.set(0.05, 0.05, 0.05);
    scene.add(object);

    buildings.push({
      name: 'Market',
      position: object.position,
      visited: false,
    });

    market = object;
    marketLoaded = true;
  },
  (xhr) => {},
  (error) => {
    console.error('Error loading FBX model:', error);
  }
);

for (let x = -50; x <= 50; x += 10) {
  createFence(x+100, -200, false);
  createFence(x+100, -100, false);
}
for (let z = -50; z <= 50; z += 10) {
  createFence(150, z - 150, true);
  createFence(50, z - 150, true);
}

const instanceCount = 50;
const wheatGeometry = new THREE.BoxGeometry(4, 8, 2);
const wheatMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
const wheatMesh = new THREE.InstancedMesh(wheatGeometry, wheatMaterial, instanceCount);

for (let i = 0; i < instanceCount; i++) {
    const x = Math.random() * 100 + 50;
    const z = Math.random() * 100 - 200;
    const matrix = new THREE.Matrix4().setPosition(x, 4, z);
    wheatMesh.setMatrixAt(i, matrix);
}

const wheatGrowthLevels = new Array(instanceCount).fill(1);

const resetWheatField = (fullReset) => {
    let wheatToGenerate = fullReset ? 50 : 40;

    for (let i = 0; i < wheatToGenerate; i++) {
        const x = Math.random() * 100 + 50;
        const z = Math.random() * 100 - 200;
        const matrix = new THREE.Matrix4().setPosition(x, 4, z);

        wheatMesh.setMatrixAt(i, matrix);
        wheatGrowthLevels[i] = 1;
    }

    wheatMesh.instanceMatrix.needsUpdate = true;

    wheatWatered = false;
    wheatPromptVisible = false;
};
  
scene.add(wheatMesh);

let wheatfieldPosition = new THREE.Vector3(100, 0, -150);
const wheatfieldDistance = 50;
let wheatWatered = false;
let wheatPromptVisible = false;
let lastWateredDay = 0;

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
wateringBox.style.display = 'none';
document.body.appendChild(wateringBox);

const waterWheatfield = () => {
  if (water > 0) {
    water--;
    wheatWatered = true;
    lastWateredDay = currentDay;

    updateJournal();
    wateringBox.style.display = 'none';
    wheatPromptVisible = false;
  } else {
    wateringBox.innerHTML = `You need at least 1 water to water the field.`;
    setTimeout(() => {
      wateringBox.style.display = 'none';
      wheatPromptVisible = false;
    }, 3000);
  }
};
  
const offerWatering = () => {
  if (water > 0) {
    wateringBox.innerHTML = `
      The soil looks dry. Water the field?
      <br>
      <button id="waterYes">Yes</button>
      <button id="waterNo">No</button>
    `;
    wateringBox.style.display = 'block';
  } else {
    wateringBox.style.display = 'none';
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
      wheatfieldVisitCount++;

      let eventKey = "wheatfield_legacy";
      if (wheatfieldVisitCount === 2) eventKey = "wheatfield_legacy_2";
      if (wheatfieldVisitCount >= 3) eventKey = "wheatfield_legacy_final";

      if (story[eventKey]) {
        currentStory = eventKey;
        showDialogue();
      }

      locations.find((loc) => loc.name === "Wheatfield").visited = true;
    }

    if (!wheatWatered && !wheatPromptVisible) {
      wheatPromptVisible = true;
      offerWatering();
    }
  }

  if ((time % dayDuration) / dayDuration < 0.01) {
    locations.find((loc) => loc.name === "Wheatfield").visited = false;
    wheatPromptVisible = false;
    wheatWatered = false;
    lastWateredDay = currentDay;
  }
};

document.body.addEventListener('click', (event) => {
  if (event.target.id === 'waterYes') {
      waterWheatfield();
  } else if (event.target.id === 'waterNo') {
      wateringBox.style.display = 'none';
      wheatPromptVisible = false;
  }
});

let collectedWheat = 0;
let gold = 0;
const tradeDistance = 50;
let tradeOffered = false;

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
tradeBox.style.display = 'none';
document.body.appendChild(tradeBox);

const updateHUD = () => {
  const progressSection = document.getElementById('progressSection');
  if (progressSection) {
      progressSection.textContent = `Bushels: ${collectedWheat} / 120 | Gold: ${gold}`;
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

      if (distance < 5) {
          wheatMesh.setMatrixAt(i, new THREE.Matrix4().makeTranslation(1000, 1000, 1000)); 
          wheatGrowthLevels[i] = 0;
          wheatMesh.instanceMatrix.needsUpdate = true;
          
          collectedWheat++;

          updateJournal();
          return;
      }
  }
};

const updateJournal = () => {
  document.getElementById('dayCount').textContent = currentDay;
  document.getElementById('bushelCount').textContent = collectedWheat;
  document.getElementById('goldCount').textContent = gold;
  document.getElementById('waterCount').textContent = water;
};

const tradeWheatForGold = () => {
  if (collectedWheat > 0) {
    collectedWheat--;
    gold++;

    updateJournal();
    tradeBox.style.display = 'none';
    tradeOffered = false;
  }
};

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

document.body.addEventListener('click', (event) => {
  if (event.target.id === 'tradeYes') {
    tradeWheatForGold();
  } else if (event.target.id === 'tradeNo') {
    tradeBox.style.display = 'none';
    tradeOffered = false;
  }
})

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
sleepBox.style.display = 'none';
document.body.appendChild(sleepBox);

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
};

document.addEventListener("keydown", movementHandler);
document.addEventListener("keyup", stopMovementHandler);

let sleepBoxVisible = false;

const showSleepPrompt = () => {
  if (sleepBoxVisible) return;

  sleepBox.innerHTML = `
      <strong>It's getting late.</strong> Do you want to sleep and start a new day?
      <br>
      <button id="sleepYes">Yes</button>
      <button id="sleepNo">No</button>
  `;
  sleepBox.style.display = 'block';
  sleepBoxVisible = true;
};

document.body.addEventListener('click', (event) => {
  if (event.target.id === 'sleepYes') {
      sleepBox.style.display = 'none';
      sleepBoxVisible = false;
      handleSleep();
  } else if (event.target.id === 'sleepNo') {
      sleepBox.style.display = 'none';
      sleepBoxVisible = false;
  }
});

let homeVisitedToday = false;

const checkHomeProximity = () => {
  if (!workerman) return;

  const playerPosition = new THREE.Vector3();
  workerman.getWorldPosition(playerPosition);

  const homePosition = new THREE.Vector3(-100, 0, 200);
  const homeDistance = 50;
  const distance = playerPosition.distanceTo(homePosition);

  const timeProgress = (time % dayDuration) / dayDuration;

  if (distance <= homeDistance && !homeVisitedToday) {
      homeVisitedToday = true;

      let eventKey = `home_reflection`;
      let dialogueText = story[eventKey][`day${currentDay}`] || story[eventKey].final;

      if (dialogueText) {
          currentStory = eventKey;
          showDialogue();
      }
  }

  if (timeProgress > 0.5 && !sleepBoxVisible) {
      showSleepPrompt();
  }

  if (timeProgress < 0.2) {
      homeVisitedToday = false; 
  }
};

let sleeping = false;
let dayHasChanged = false;

const handleSleep = () => {
  if (sleeping) return;
  sleeping = true;
  sleepBoxVisible = false;

  sleepBox.style.display = 'none';

  let eventKey = `home_reflection`;
  let dialogueText = story[eventKey][`day${currentDay}`] || story[eventKey].final;

  if (dialogueText) {
      currentStory = eventKey;
      showDialogue();
  }

  setTimeout(() => {
      renderer.domElement.style.display = "none";
      document.body.style.backgroundColor = "black";

      if (workerman) {
          const positionData = {
              x: workerman.position.x,
              y: workerman.position.y,
              z: workerman.position.z
          };
          localStorage.setItem("lastPlayerPosition", JSON.stringify(positionData));
      }

      if (currentDay >= 5) { 
          setTimeout(() => {
              renderer.domElement.style.display = "block";
              document.body.style.backgroundColor = "";
              showGameResult();
          }, 2000);
          return;
      }

      currentDay += 1;
      localStorage.setItem("currentDay", currentDay);
      lastDayDialogueShown = currentDay;
      localStorage.setItem("lastDayDialogueShown", currentDay);

      time = 0;
      homeVisitedToday = false;
      journalOpenedManually = false;

      setTimeout(() => {
          resetWheatField();
          wellVisitCount = 0;
          wellTradeOffered = false;
          wheatPromptVisible = false;
          locations.forEach((location) => (location.visited = false));

          setTimeout(() => {
              renderer.domElement.style.display = "block";
              document.body.style.backgroundColor = "";

              sleeping = false;
              sleepBoxVisible = false;

              journalContainer.style.display = "block";

              showDailyDialogue();
              updateJournal();
          }, 2000);
      }, 2000);
  }, 5000);
};

const showGameResult = () => {
  journalContainer.style.display = "block";
  storyEventsSection.innerHTML = "";

  if (collectedWheat >= 120) {
      storyEventsSection.innerHTML = `
          <h3>Congratulations!</h3>
          <p>You successfully produced <strong>${collectedWheat}</strong> bushels of wheat!</p>
          <p>You saved the farm and secured your family's future.</p>
      `;
  } else {
      storyEventsSection.innerHTML = `
          <h3>Game Over</h3>
          <p>You only produced <strong>${collectedWheat}</strong> bushels of wheat.</p>
          <p>Unfortunately, it was not enough, and you lost the farm.</p>
      `;
  }

    localStorage.setItem("finalDay", currentDay);
    localStorage.setItem("totalWheatCollected", collectedWheat);
    localStorage.setItem("totalWaterBuckets", water);
    localStorage.setItem("userInputs", JSON.stringify(userResponses));

    setTimeout(() => {
        window.location.href = "summary.html";
    }, 3000);
};

let workerman;
let mixer;
let action;

fbxLoader.load(
  '/ye4.fbx',
  (object) => {
    mixer = new THREE.AnimationMixer(object);
    workerman = object;
    workerman.scale.set(0.1, 0.1, 0.1);
    workerman.position.set(50, 0, 50);
    scene.add(workerman);

    if (object.animations.length > 0) {
      action = mixer.clipAction(object.animations[0]);
      action.setLoop(THREE.LoopRepeat);
      action.play();
    }
  },
  (xhr) => {},
  (error) => {
    console.error('Error loading FBX model:', error);
  }
);

const cameraOffset = new THREE.Vector3(0, 5, 10);

let workermanSpeed = 1;
let isWorkermanMoving = false;

document.addEventListener('keydown', (event) => {
  if (document.activeElement === inputBox) return;

  if (workerman && action) {
      action.play();
      isWorkermanMoving = true;
  }

  if (workerman) {
      switch (event.key) {
          case 'ArrowUp':
              workerman.position.z -= workermanSpeed;
              workerman.rotation.y = 0;
              break;
          case 'ArrowDown':
              workerman.position.z += workermanSpeed;
              workerman.rotation.y = Math.PI;
              break;
          case 'ArrowLeft':
              workerman.position.x -= workermanSpeed;
              workerman.rotation.y = Math.PI / 2;
              break;
          case 'ArrowRight':
              workerman.position.x += workermanSpeed;
              workerman.rotation.y = -Math.PI / 2;
              break;
      }
  }
});

document.addEventListener('keyup', (event) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
    if (isWorkermanMoving && action) {
      action.stop();
      isWorkermanMoving = false;
    }
  }
});

const loadHouse = (position) => {
  fbxLoader.load(
    '/house5.fbx',
    (object) => {
      object.traverse((child) => {
        if (child.isMesh) {
          if (child.name.toLowerCase().includes('wall')) {
            child.material = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
          } else if (child.name.toLowerCase().includes('window')) {
            child.material = new THREE.MeshStandardMaterial({ color: 0xFFFF00, emissive: 0xFFFF00 });
          }
        }
      });
      object.position.set(position.x, position.y, position.z);
      object.scale.set(0.1, 0.1, 0.1);
      scene.add(object);
    },
    (xhr) => {},
    (error) => {
      console.error('Error loading FBX model:', error);
    }
  );
};

const housePositions = [
  { x: -100, y: 0, z: 200 },
  { x: -50, y: 0, z: -50 },
  { x: 250, y: 0, z: 50 },
  { x: 200, y: 0, z: 200 },
];
housePositions.forEach((pos) => loadHouse(pos));

let water = 0;
const wellDistance = 30;
let wellLoaded = false;
let well;
let wellTradeOffered = false;

fbxLoader.load(
  '/well2.fbx',
  (object) => {
    object.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9, metalness: 0.1 });
      }
    });
    object.position.set(-5, 0, -5);
    object.scale.set(0.02, 0.02, 0.02);
    scene.add(object);
    well = object;
    wellLoaded = true;
  },
  (xhr) => {},
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

progressSection.innerHTML = `
    <p><strong>Day:</strong> <span id="dayCount">${currentDay}</span></p>
    <p><strong>Bushels:</strong> <span id="bushelCount">${collectedWheat}</span> / 120</p>
    <p><strong>Gold:</strong> <span id="goldCount">${gold}</span></p>
    <p><strong>Water:</strong> <span id="waterCount">${water}</span></p>
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
waterTradeBox.style.display = 'none';
document.body.appendChild(waterTradeBox);

const buyWater = () => {
  if (gold >= 2) {
    gold -= 2; 
    water++; 

    updateJournal();
    waterTradeBox.style.display = 'none'; 
    wellTradeOffered = false; 
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

document.body.addEventListener('click', (event) => {
  if (event.target.id === 'buyWaterYes') {
      buyWater();
  } else if (event.target.id === 'buyWaterNo') {
      waterTradeBox.style.display = 'none';
      wellTradeOffered = false;
  }
});

const checkWellProximity = () => {
  if (!workerman || !well) return;

  const playerPosition = new THREE.Vector3();
  workerman.getWorldPosition(playerPosition);

  const distance = playerPosition.distanceTo(well.position);

  if (distance <= wellDistance && wellVisitCount < currentDay) { 
      wellVisitCount = currentDay;

      let eventKey = "well_history";
      if (currentDay === 2) eventKey = "well_history_2";
      else if (currentDay >= 3) eventKey = "well_history_final";

      if (story[eventKey]) {
          currentStory = eventKey;
          showDialogue();
      }

      if (!wellTradeOffered) {
          offerWaterTrade();
          wellTradeOffered = true;
      }
  }
};

const resetGame = () => {
  localStorage.removeItem("currentDay");
  localStorage.removeItem("lastPlayerPosition");

  currentDay = 1;
  lastDay = 1;
  collectedWheat = 0;
  gold = 0;
  water = 0;
  wellVisitCount = 0;
  wellTradeOffered = false;
  wheatPromptVisible = false;
  locations.forEach((location) => location.visited = false);

  updateJournal();
  showDailyDialogue();

  if (workerman) {
      workerman.position.set(50, 0, 50);
  }
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
resetButton.style.backgroundColor = '#d9534f';
resetButton.style.color = 'white';
resetButton.style.border = 'none';
resetButton.addEventListener('click', () => {
    if (confirm("Are you sure you want to restart the game? This will erase all progress.")) {
        resetGame();
        location.reload();
    }
});
document.body.appendChild(resetButton);

let tower;

fbxLoader.load(
  '/yessir2.fbx',
  (object) => {
    object.position.set(0, 0, 150);
    object.rotation.y = Math.PI / 2;
    object.scale.set(0.2, 0.2, 0.2);
    scene.add(object);
    
    tower = object;
  },
  (xhr) => {},
  (error) => {
    console.error('Error loading FBX model:', error);
  }
);

const quitButton = document.createElement('button');
quitButton.textContent = 'Quit Game';
quitButton.style.position = 'absolute';
quitButton.style.top = '60px';
quitButton.style.right = '20px';
quitButton.style.padding = '10px';
quitButton.style.borderRadius = '5px';
quitButton.style.fontSize = '14px';
quitButton.style.cursor = 'pointer';
quitButton.style.backgroundColor = '#dc3545';
quitButton.style.color = 'white';
quitButton.style.border = 'none';

quitButton.addEventListener('click', () => {
  const confirmQuit = confirm("Are you sure you want to quit the game?");
  if (confirmQuit) {
      saveGameResult();

      setTimeout(() => {
          window.location.href = "summary.html";
      }, 1000);
  }
});

const saveGameResult = () => {
  let gameOutcomeText = "";

  if (collectedWheat >= 200) {
      gameOutcomeText = `Congratulations! You produced ${collectedWheat} bushels and saved the farm!`;
  } else {
      gameOutcomeText = `Unfortunately, you only produced ${collectedWheat} bushels and could not save the farm. The land is lost.`;
  }

  localStorage.setItem("finalDay", currentDay);
  localStorage.setItem("totalWheatCollected", collectedWheat);
  localStorage.setItem("totalWaterBuckets", water);
  localStorage.setItem("userInputs", JSON.stringify(userResponses));
  localStorage.setItem("gameOutcome", gameOutcomeText);
  localStorage.setItem("dialogueHistory", JSON.stringify(dialogueHistory));
};

document.body.appendChild(quitButton);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enableZoom = true;

const clock = new THREE.Clock();
let lastAnimateTime = 0;

const animate = () => {
    requestAnimationFrame(animate);

    const now = Date.now();
    lastAnimateTime = now;

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

animate();