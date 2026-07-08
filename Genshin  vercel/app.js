// Teyvat Chrono Dashboard Controller Logic

// Official element SVG paths extracted from genshin-optimizer (frzyc/genshin-optimizer, MIT)
const ELEMENT_ICONS = {
  Pyro:    { color: "#ef7027", path: "https://gi.yatta.moe/assets/UI/UI_Buff_Element_Fire.png" },
  Hydro:   { color: "#47bfe0", path: "https://gi.yatta.moe/assets/UI/UI_Buff_Element_Water.png" },
  Anemo:   { color: "#74c2a0", path: "https://gi.yatta.moe/assets/UI/UI_Buff_Element_Wind.png" },
  Electro: { color: "#9f71cf", path: "https://gi.yatta.moe/assets/UI/UI_Buff_Element_Electric.png" },
  Dendro:  { color: "#a0c64a", path: "https://gi.yatta.moe/assets/UI/UI_Buff_Element_Grass.png" },
  Cryo:    { color: "#a8d8e0", path: "https://gi.yatta.moe/assets/UI/UI_Buff_Element_Ice.png" },
  Geo:     { color: "#c8a040", path: "https://gi.yatta.moe/assets/UI/UI_Buff_Element_Rock.png" },
  Physical:{ color: "#aaaaaa", path: "" },
};

function getElementSVG(element) {
  const el = ELEMENT_ICONS[element];
  if (!el || !el.path) return '';
  return `<img class="el-icon" src="${el.path}" alt="${element}" style="width:14px;height:14px;vertical-align:middle;filter:drop-shadow(0 0 2px rgba(0,0,0,0.5))">`;
}

// Parse character name from avatar_side_icon URL
// Handles multiple HoYoLAB URL formats:
//   .../UI_AvatarIcon_Side_Amber.png
//   .../UI_AvatarIcon_Side_Amber.webp
//   .../UI_AvatarIcon_Amber.png
//   or any future format changes
function parseCharacterNameFromIcon(url) {
  if (!url) return "Character";
  try {
    const filename = url.split('/').pop().split('?')[0]; 
    let rawName = filename.replace(/\.[^.]+$/, '');
    
    if (/^[0-9a-f]{10,}$/i.test(rawName)) return "Character";
    
    rawName = rawName.replace(/^UI_AvatarIcon_Side_/, '')
                     .replace(/^UI_AvatarIcon_Costume_/, '')
                     .replace(/^UI_AvatarIcon_/, '')
                     .replace(/^AvatarIcon_Side_/, '')
                     .replace(/^AvatarIcon_/, '');
                     
    if (!rawName) return "Character";
    
    let readable = rawName.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
    return readable || "Character";
  } catch (e) {
    return "Character";
  }
}

// ── Domain icon SVG helpers ───────────────────────────────────────────────
function bookIcon(t) {
  if (t && t.icon) {
    return `<img src="https://gi.yatta.moe/assets/UI/UI_ItemIcon_${t.icon}.png" alt="${t.name}" style="width:28px;height:28px;vertical-align:middle">`;
  }
  const c = typeof t === 'string' ? t : (t.color || "#ccc");
  return `<svg viewBox="0 0 28 28" width="28" height="28" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="2" width="15" height="24" rx="2" fill="${c}" fill-opacity=".12" stroke="${c}" stroke-width="1.4"/>
    <line x1="8" y1="8"  x2="15" y2="8"  stroke="${c}" stroke-width="1.1" stroke-opacity=".75"/>
    <line x1="8" y1="12" x2="15" y2="12" stroke="${c}" stroke-width="1.1" stroke-opacity=".75"/>
    <line x1="8" y1="16" x2="13" y2="16" stroke="${c}" stroke-width="1.1" stroke-opacity=".75"/>
    <rect x="19" y="2" width="3" height="24" rx="1" fill="${c}" fill-opacity=".45"/>
    <line x1="4" y1="14" x2="19" y2="14" stroke="${c}" stroke-width="1" stroke-opacity=".25" stroke-dasharray="2 2"/>
  </svg>`;
}
function shieldIcon(c) {
  return `<svg viewBox="0 0 28 28" width="28" height="28" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 3 L23 7 v8 Q23 22 14 26 Q5 22 5 15 V7 Z" fill="${c}" fill-opacity=".14" stroke="${c}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M14 7 L20 10 v6 Q20 19 14 22 Q8 19 8 16 V10 Z" fill="${c}" fill-opacity=".28"/>
    <line x1="14" y1="9" x2="14" y2="20" stroke="${c}" stroke-width=".8" stroke-opacity=".5"/>
    <line x1="9" y1="13" x2="19" y2="13" stroke="${c}" stroke-width=".8" stroke-opacity=".5"/>
  </svg>`;
}
function swordIcon(c) {
  return `<svg viewBox="0 0 28 28" width="28" height="28" xmlns="http://www.w3.org/2000/svg">
    <polygon points="14,3 11.5,20 14,23 16.5,20" fill="${c}" fill-opacity=".18" stroke="${c}" stroke-width="1.3" stroke-linejoin="round"/>
    <line x1="14" y1="3" x2="14" y2="23" stroke="${c}" stroke-width="1.5"/>
    <line x1="9" y1="18" x2="19" y2="18" stroke="${c}" stroke-width="2" stroke-linecap="round"/>
    <circle cx="14" cy="23" r="1.8" fill="${c}" fill-opacity=".7"/>
  </svg>`;
}
function bowIcon(c) {
  return `<svg viewBox="0 0 28 28" width="28" height="28" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 4 Q3 14 7 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round"/>
    <line x1="7" y1="4"  x2="7" y2="24" stroke="${c}" stroke-width="1" stroke-opacity=".3" stroke-dasharray="2 2"/>
    <line x1="7" y1="4"  x2="21" y2="14" stroke="${c}" stroke-width="1" stroke-opacity=".5"/>
    <line x1="7" y1="24" x2="21" y2="14" stroke="${c}" stroke-width="1" stroke-opacity=".5"/>
    <line x1="8" y1="14" x2="22" y2="14" stroke="${c}" stroke-width="1.4"/>
    <polygon points="22,14 18,12.5 18,15.5" fill="${c}"/>
  </svg>`;
}

// Domain Materials Data Map (Genshin Impact)
const DOMAIN_MATERIALS = {
  // Talent Books — color = region element color
  talents: [
    { name: "Philosophies of Freedom",    icon: "104303", color: "#74c2a0", location: "Mondstadt (Forsaken Rift)",          days: [1, 4, 0], characters: ["Amber", "Barbara", "Diona", "Klee", "Sucrose", "Tartaglia", "Aloy"] },
    { name: "Philosophies of Resistance", icon: "104306", color: "#74c2a0", location: "Mondstadt (Forsaken Rift)",          days: [2, 5, 0], characters: ["Bennett", "Diluc", "Eula", "Jean", "Mona", "Noelle", "Razor"] },
    { name: "Philosophies of Ballad",     icon: "104309", color: "#74c2a0", location: "Mondstadt (Forsaken Rift)",          days: [3, 6, 0], characters: ["Albedo", "Fischl", "Kaeya", "Lisa", "Rosaria", "Venti"] },
    { name: "Philosophies of Prosperity", icon: "104312", color: "#c8a040", location: "Liyue (Taishan Mansion)",            days: [1, 4, 0], characters: ["Keqing", "Ningguang", "Qiqi", "Shenhe", "Traveler (Geo)", "Yelan", "Xiao"] },
    { name: "Philosophies of Diligence",  icon: "104315", color: "#c8a040", location: "Liyue (Taishan Mansion)",            days: [2, 5, 0], characters: ["Chongyun", "Ganyu", "Hu Tao", "Kazuha", "Xiangling", "Yun Jin"] },
    { name: "Philosophies of Gold",       icon: "104318", color: "#c8a040", location: "Liyue (Taishan Mansion)",            days: [3, 6, 0], characters: ["Beidou", "Xingqiu", "Xinyan", "Zhongli", "Yanfei"] },
    { name: "Philosophies of Transience", icon: "104322", color: "#9f71cf", location: "Inazuma (Violet Court)",             days: [1, 4, 0], characters: ["Yoimiya", "Kokomi", "Thoma", "Shikanoin Heizou", "Traveler (Electro)"] },
    { name: "Philosophies of Elegance",   icon: "104325", color: "#9f71cf", location: "Inazuma (Violet Court)",             days: [2, 5, 0], characters: ["Ayaka", "Ayato", "Sara", "Itto", "Kuki Shinobu"] },
    { name: "Philosophies of Light",      icon: "104328", color: "#9f71cf", location: "Inazuma (Violet Court)",             days: [3, 6, 0], characters: ["Raiden Shogun", "Yae Miko", "Sayu", "Gorou"] },
    { name: "Philosophies of Admonition", icon: "104331", color: "#a0c64a", location: "Sumeru (Steeple of Ignorance)",      days: [1, 4, 0], characters: ["Tighnari", "Cyno", "Faruzan", "Candace", "Traveler (Dendro)"] },
    { name: "Philosophies of Ingenuity",  icon: "104334", color: "#a0c64a", location: "Sumeru (Steeple of Ignorance)",      days: [2, 5, 0], characters: ["Nahida", "Alhaitham", "Dori", "Layla"] },
    { name: "Philosophies of Praxis",     icon: "104337", color: "#a0c64a", location: "Sumeru (Steeple of Ignorance)",      days: [3, 6, 0], characters: ["Wanderer", "Nilou", "Dehya", "Collei", "Kaveh"] },
    { name: "Philosophies of Equity",     icon: "104340", color: "#47bfe0", location: "Fontaine (Pale Forgotten Glory)",    days: [1, 4, 0], characters: ["Lyney", "Neuvillette", "Navia", "Traveler (Hydro)"] },
    { name: "Philosophies of Justice",    icon: "104343", color: "#47bfe0", location: "Fontaine (Pale Forgotten Glory)",    days: [2, 5, 0], characters: ["Wriothesley", "Furina", "Charlotte", "Freminet"] },
    { name: "Philosophies of Order",      icon: "104346", color: "#47bfe0", location: "Fontaine (Pale Forgotten Glory)",    days: [3, 6, 0], characters: ["Arlecchino", "Clorinde", "Emilie", "Sigewinne", "Chevreuse", "Gaming"] },
    { name: "Philosophies of Contention", icon: "104349", color: "#ef7027", location: "Natlan (Ruins of Sacrificial Fire)", days: [1, 4, 0], characters: ["Mualani", "Kachina", "Kinich"] },
    { name: "Philosophies of Kindling",   icon: "104352", color: "#ef7027", location: "Natlan (Ruins of Sacrificial Fire)", days: [2, 5, 0], characters: ["Chasca", "Olorun"] },
    { name: "Philosophies of Conflict",   icon: "104355", color: "#ef7027", location: "Natlan (Ruins of Sacrificial Fire)", days: [3, 6, 0], characters: ["Xilonen", "Citlali"] }
  ],
  // Weapon Ascension Materials
  weapons: [
    { name: "Decarabian",            icon: "114004", color: "#8abcd0", location: "Mondstadt (Cecilia Garden)", days: [1, 4, 0], usage: "Various Weapons" },
    { name: "Boreal Wolf",           icon: "114008", color: "#c8c090", location: "Mondstadt (Cecilia Garden)", days: [2, 5, 0], usage: "Various Weapons" },
    { name: "Dandelion Gladiator",   icon: "114012", color: "#c87858", location: "Mondstadt (Cecilia Garden)", days: [3, 6, 0], usage: "Various Weapons" },
    { name: "Guyun",                 icon: "114016", color: "#c8c090", location: "Liyue (Hidden Palace of Lianshan Formula)", days: [1, 4, 0], usage: "Various Weapons" },
    { name: "Mist Veiled Elixir",    icon: "114020", color: "#8abcd0", location: "Liyue (Hidden Palace of Lianshan Formula)", days: [2, 5, 0], usage: "Various Weapons" },
    { name: "Aerosiderite",          icon: "114024", color: "#c87858", location: "Liyue (Hidden Palace of Lianshan Formula)", days: [3, 6, 0], usage: "Various Weapons" },
    { name: "Distant Sea",           icon: "114028", color: "#9f71cf", location: "Inazuma (Court of Flowing Sand)", days: [1, 4, 0], usage: "Various Weapons" },
    { name: "Narukami",              icon: "114032", color: "#c8c090", location: "Inazuma (Court of Flowing Sand)", days: [2, 5, 0], usage: "Various Weapons" },
    { name: "Mask",                  icon: "114036", color: "#c87858", location: "Inazuma (Court of Flowing Sand)", days: [3, 6, 0], usage: "Various Weapons" },
    { name: "Forest Dew",            icon: "114040", color: "#a0c64a", location: "Sumeru (Tower of Abject Pride)", days: [1, 4, 0], usage: "Various Weapons" },
    { name: "Oasis Garden",          icon: "114044", color: "#c8c090", location: "Sumeru (Tower of Abject Pride)", days: [2, 5, 0], usage: "Various Weapons" },
    { name: "Scorching Might",       icon: "114048", color: "#c87858", location: "Sumeru (Tower of Abject Pride)", days: [3, 6, 0], usage: "Various Weapons" },
    { name: "Sacred Dewdrop",        icon: "114052", color: "#47bfe0", location: "Fontaine (Echoes of the Deep Tides)", days: [1, 4, 0], usage: "Various Weapons" },
    { name: "Pristine Sea",          icon: "114056", color: "#c8c090", location: "Fontaine (Echoes of the Deep Tides)", days: [2, 5, 0], usage: "Various Weapons" },
    { name: "Ancient Chord",         icon: "114060", color: "#c87858", location: "Fontaine (Echoes of the Deep Tides)", days: [3, 6, 0], usage: "Various Weapons" },
    { name: "Blazing Sacrificial Heart", icon: "114064", color: "#ef7027", location: "Natlan (Blazing Ruins)", days: [1, 4, 0], usage: "Various Weapons" },
    { name: "Delirious Decadence",   icon: "114068", color: "#c8c090", location: "Natlan (Blazing Ruins)", days: [2, 5, 0], usage: "Various Weapons" },
    { name: "Secret Source",         icon: "114072", color: "#c87858", location: "Natlan (Blazing Ruins)", days: [3, 6, 0], usage: "Various Weapons" }
  ]
};

// Global App State Object
let state = {
  // Credentials
  uid: "",
  server: "os_euro",
  ltoken: "",
  ltuid: "",
  discordWebhook: "",
  
  // Settings
  manualMode: false,
  soundMuted: false,
  autoCheckin: false,

  // Sync tracking
  lastSyncTime: 0,
  nextSyncTime: 0,
  
  // Resin Data
  resin: {
    count: 0,
    lastUpdate: 0, // Date.now() timestamp
    alert160Triggered: false,
    alert200Triggered: false
  },

  // Realm Currency Data
  currency: {
    count: 0,
    lastUpdate: 0,
    rate: 30, // Default for 20k Adeptal Energy
    max: 2400, // Default for Trust Rank 10
    alertFullTriggered: false
  },

  // Cooldowns
  transformerReadyAt: 0, // Date.now() ms timestamp when transformer becomes ready (0 = already ready)
  customTimers: [], // Array of { id, name, duration, startTime }

  // Resets & Checklist states
  dailyCommissionsClaimed: false,
  dailyCommissionsDone: 0,
  katheryneClaimed: false,
  weeklyBossesDone: 0,
  reputationBountiesDone: false,
  reputationRequestsDone: false,
  teapotResinBought: false,
  paimonFatesBought: false,

  // Account metadata
  playerInfo: null, // from Battle Chronicle Index
  explorations: [], // from Battle Chronicle Index
  characters: [], // from Battle Chronicle Index
  abyss: null, // from Abyss
  ledger: null, // from YsLedger
  expeditions: [], // from Daily Notes

  // Checkin info
  checkinDaysCount: 0,
  checkedInToday: false
};

// Server Timezones offset mapping relative to UTC
const SERVER_OFFSETS = {
  os_usa: -5,  // America Server (GMT-5)
  os_euro: 1,  // Europe Server (GMT+1)
  os_asia: 8,  // Asia Server (GMT+8)
  os_cht: 8    // TW/HK/MO Server (GMT+8)
};

// Fallback codes (used only when offline and no cached codes exist)
const FALLBACK_PROMO_CODES = [];

// Live codes fetched from /api/codes (populated at runtime)
let livePromoCodes = [];

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
  loadLocalStorage();
  setupEventListeners();
  setupTabSystem();
  
  // Start the timers loop (runs every second)
  setInterval(appTimerLoop, 1000);

  // Auto-refresh data every 15 minutes
  setInterval(() => {
    if (state.uid && state.ltoken && state.ltuid) handleRefresh();
  }, 15 * 60 * 1000);

  // Initial draw and time update
  appTimerLoop();
  updateUI();
  updateDomainSchedule(new Date().getDay()); // Select today's day filter

  // Fetch live active promo codes
  fetchActiveCodes();

  // Auto-fetch on load if credentials already saved
  if (state.uid && state.ltoken && state.ltuid) {
    handleRefresh();
  } else {
    // No credentials yet — open settings immediately
    openSettingsModal();
  }

  // Auto Check-in on Load if allowed
  if (state.autoCheckin && state.ltoken && state.ltuid) {
    runAutoCheckin();
  }

  // Request notification permission proactively
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  // Wake lock — keep screen on while dashboard is open
  acquireWakeLock();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') acquireWakeLock();
  });
});

// Load state from localStorage
function loadLocalStorage() {
  const storedState = localStorage.getItem("teyvat_chrono_state");
  if (storedState) {
    try {
      const parsed = JSON.parse(storedState);
      state = { ...state, ...parsed };
    } catch (e) {
      console.error("Error parsing stored state, resetting.", e);
    }
  }

  // Load promo codes from cache (will be overwritten by live fetch)
  const storedCodes = localStorage.getItem("teyvat_chrono_codes");
  if (storedCodes) {
    try {
      livePromoCodes = JSON.parse(storedCodes);
    } catch (e) {
      livePromoCodes = [];
    }
  }

  // Trigger permission request if notifications toggled on but not requested
  if (("Notification" in window) && Notification.permission === "default" && !state.manualMode) {
    // We request gracefully on first user interaction or when saving settings
  }
}

// Save state to localStorage
function saveLocalStorage() {
  localStorage.setItem("teyvat_chrono_state", JSON.stringify(state));
}

// Setup Header tabs navigation
function setupTabSystem() {
  const tabs = document.querySelectorAll(".tab-link");
  const panels = document.querySelectorAll(".tab-panel");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const targetPanelId = `tab-${tab.getAttribute("data-tab")}`;
      
      tabs.forEach(t => t.classList.remove("active"));
      panels.forEach(p => p.classList.remove("active"));

      tab.classList.add("active");
      document.getElementById(targetPanelId).classList.add("active");
    });
  });
}

// Bind event listeners to UI components
function setupEventListeners() {
  // Navigation actions
  document.getElementById("settings-btn").addEventListener("click", openSettingsModal);
  document.getElementById("close-modal-btn").addEventListener("click", closeSettingsModal);
  document.getElementById("refresh-btn").addEventListener("click", handleRefresh);
  
  // Sound Mute Toggle
  const soundToggle = document.getElementById("sound-toggle");
  soundToggle.addEventListener("click", () => {
    state.soundMuted = !state.soundMuted;
    document.getElementById("sound-icon-on").classList.toggle("hidden", state.soundMuted);
    document.getElementById("sound-icon-off").classList.toggle("hidden", !state.soundMuted);
    saveLocalStorage();
  });
  if (state.soundMuted) {
    document.getElementById("sound-icon-on").classList.add("hidden");
    document.getElementById("sound-icon-off").classList.remove("hidden");
  }

  // Form Submission (Credentials saving)
  document.getElementById("credentials-form").addEventListener("submit", handleCredentialsSave);
  document.getElementById("test-conn-btn").addEventListener("click", handleTestConnection);
  document.getElementById("clear-conn-btn").addEventListener("click", handleClearCredentials);

  // Resin Alerts toggles
  document.getElementById("resin-alert-160").addEventListener("change", (e) => {
    state.resin.alert160Triggered = false; // Reset trigger
    saveLocalStorage();
  });
  document.getElementById("resin-alert-200").addEventListener("change", (e) => {
    state.resin.alert200Triggered = false;
    saveLocalStorage();
  });
  document.getElementById("currency-alert").addEventListener("change", (e) => {
    state.currency.alertFullTriggered = false;
    saveLocalStorage();
  });

  // Domain Days Filters
  document.querySelectorAll("#domain-day-filters button").forEach(btn => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll("#domain-day-filters button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const dayIndex = parseInt(btn.getAttribute("data-day"));
      updateDomainSchedule(dayIndex);
    });
  });

  // Close Banner Action
  document.getElementById("banner-close-btn").addEventListener("click", () => {
    document.getElementById("info-banner").classList.add("hidden");
  });

  // Checkin manually trigger
  document.getElementById("do-checkin-btn").addEventListener("click", handleManualCheckin);
  document.getElementById("auto-checkin-toggle").addEventListener("change", (e) => {
    state.autoCheckin = e.target.checked;
    saveLocalStorage();
  });
  document.getElementById("auto-checkin-toggle").checked = state.autoCheckin;
}

// Modal open/close logic
function openSettingsModal() {
  document.getElementById("uid-input").value = state.uid;
  document.getElementById("server-input").value = state.server;
  document.getElementById("ltoken-input").value = state.ltoken;
  document.getElementById("ltuid-input").value = state.ltuid;
  document.getElementById("discord-webhook-input").value = state.discordWebhook || "";
  
  document.getElementById("settings-modal").classList.add("active");
  document.getElementById("conn-status-message").classList.add("hidden");
}

function closeSettingsModal() {
  document.getElementById("settings-modal").classList.remove("active");
}

// Request desktop notification permission gracefully
function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

// Handle settings configuration save
function handleCredentialsSave(e) {
  e.preventDefault();
  
  state.uid = document.getElementById("uid-input").value.trim();
  state.server = document.getElementById("server-input").value;
  state.ltoken = document.getElementById("ltoken-input").value.trim();
  state.ltuid = document.getElementById("ltuid-input").value.trim();
  state.discordWebhook = document.getElementById("discord-webhook-input").value.trim();
  
  saveLocalStorage();
  requestNotificationPermission();
  
  closeSettingsModal();
  showBanner("Credentials saved successfully! Fetching data...", "success");
  
  // Fetch details instantly
  handleRefresh();
}

// Handle clearing stored credentials
function handleClearCredentials() {
  if (confirm("Are you sure you want to clear your credentials and all saved local data?")) {
    state.uid = "";
    state.server = "os_euro";
    state.ltoken = "";
    state.ltuid = "";
    state.playerInfo = null;
    state.explorations = [];
    state.characters = [];
    state.abyss = null;
    state.ledger = null;
    
    saveLocalStorage();
    closeSettingsModal();
    updateUI();
    showBanner("All saved credentials and account cached data cleared.", "info");
  }
}

// Fetch proxy wrapper helper
async function fetchHoyolabAPI(action, extraParams = {}) {
  const baseUrl = "/api/hoyolab";
  const params = new URLSearchParams({
    action,
    uid: state.uid,
    server: state.server,
    ltoken: state.ltoken,
    ltuid: state.ltuid,
    ...extraParams
  });

  const response = await fetch(`${baseUrl}?${params.toString()}`);
  if (!response.ok) {
    const errorJson = await response.json();
    throw new Error(errorJson.message || "Failed to contact HoYoLAB serverless API");
  }
  return await response.json();
}

// Handle test connection in settings panel
async function handleTestConnection() {
  const uid = document.getElementById("uid-input").value.trim();
  const server = document.getElementById("server-input").value;
  const ltoken = document.getElementById("ltoken-input").value.trim();
  const ltuid = document.getElementById("ltuid-input").value.trim();

  const msgBox = document.getElementById("conn-status-message");
  msgBox.classList.remove("hidden", "success", "error");
  msgBox.innerText = "Testing connection to HoYoLAB...";

  if (!uid || !ltoken || !ltuid) {
    msgBox.classList.add("error");
    msgBox.innerText = "Error: All fields are required to test connection.";
    return;
  }

  try {
    // Make a test query to check dailyNote
    const baseUrl = "/api/hoyolab";
    const params = new URLSearchParams({
      action: "dailyNote",
      uid,
      server,
      ltoken,
      ltuid
    });
    
    const response = await fetch(`${baseUrl}?${params.toString()}`);
    const data = await response.json();

    if (data.retcode !== 0) {
      msgBox.classList.add("error");
      if (data.retcode === 10103) {
        msgBox.innerText = "Connection Fail: 'Real-Time Notes' is set to private in your HoYoLAB Privacy settings. Please make it public.";
      } else {
        msgBox.innerText = `HoYoLAB API Error: [${data.retcode}] ${data.message}`;
      }
    } else {
      msgBox.classList.add("success");
      msgBox.innerText = `Connection Successful! Logged in as server character. Found ${data.data.current_resin} Resin.`;
    }
  } catch (error) {
    msgBox.classList.add("error");
    msgBox.innerText = `Connection Failed: ${error.message}. Verify that you have deployed the /api/hoyolab serverless function proxy correctly.`;
  }
}

// Global Refresh action
async function handleRefresh() {


  if (!state.uid || !state.ltoken || !state.ltuid) {
    openSettingsModal();
    showBanner("Please configure your credentials in the Settings modal first.", "info");
    return;
  }

  const refreshBtn = document.getElementById("refresh-btn");
  refreshBtn.classList.add("disabled");
  refreshBtn.disabled = true;
  refreshBtn.querySelector("span").innerText = "Syncing...";

  showBanner("Syncing game chronicle data with HoYoLAB...", "info");

  try {
    let errorsOccurred = [];

    // 1. Fetch Daily Notes (Critical)
  try {
    const noteData = await fetchHoyolabAPI("dailyNote");
    if (noteData.retcode === 0) {
      const d = noteData.data;
      state.resin.count = d.current_resin;
      state.resin.lastUpdate = Date.now();
      state.resin.alert160Triggered = d.current_resin >= 160;
      state.resin.alert200Triggered = d.current_resin >= 200;

      state.currency.count = d.current_home_coin;
      state.currency.lastUpdate = Date.now();
      state.currency.max = d.max_home_coin || 2400;
      // Derive hourly rate from remaining coins ÷ remaining seconds
      const remainingCoins = d.max_home_coin - d.current_home_coin;
      const remainingSecs = parseInt(d.home_coin_recovery_time) || 0;
      state.currency.rate = (remainingCoins > 0 && remainingSecs > 0)
        ? Math.round((remainingCoins / remainingSecs) * 3600)
        : 30;
      state.currency.alertFullTriggered = d.current_home_coin >= d.max_home_coin;

      state.dailyCommissionsDone = d.finished_task_num;
      state.dailyCommissionsClaimed = d.is_extra_task_reward_received;
      state.katheryneClaimed = d.is_extra_task_reward_received;
      
      state.weeklyBossesDone = 3 - d.remain_resin_discount_num;

      // Parse Parametric Transformer Cooldown
      console.log('[Transformer] raw data:', JSON.stringify(d.transformer));
      if (!d.transformer) {
        state.transformerReadyAt = -1; // API returned no transformer field
      } else if (!d.transformer.obtained) {
        state.transformerReadyAt = -2; // API says not obtained/not tracked
      } else {
        const rt = d.transformer.recovery_time;
        if (rt.reached) {
          state.transformerReadyAt = 0; // already ready
        } else {
          const remainingSeconds = (rt.Day || 0) * 86400 +
                                   (rt.Hour || 0) * 3600 +
                                   (rt.Minute || 0) * 60 +
                                   (rt.Second || 0);
          state.transformerReadyAt = Date.now() + remainingSeconds * 1000;
        }
      }

      // Parse expeditions
      if (d.expeditions) {
        state.expeditions = d.expeditions.map(ex => ({
          name: parseCharacterNameFromIcon(ex.avatar_side_icon),
          avatar: ex.avatar_side_icon,
          remSec: ex.remained_time,
          status: ex.status,
          remText: ex.remained_time === 0 ? "Finished" : ""
        }));
      }
    } else {
      errorsOccurred.push(`Resin/Expeditions: ${noteData.message} (retcode ${noteData.retcode})`);
    }
  } catch (err) {
    console.error("Error fetching dailyNote:", err);
    errorsOccurred.push(`Resin/Expeditions tracker failed to load: ${err.message}`);
  }

  // 2. Fetch Check-In Status
  try {
    const checkinData = await fetchHoyolabAPI("dailyCheckIn");
    if (checkinData.retcode === 0) {
      state.checkinDaysCount = checkinData.data.total_sign_day;
      state.checkedInToday = checkinData.data.is_sign;
      
      // Auto Claim checkin rewards if enabled and not signed in today
      if (state.autoCheckin && !checkinData.data.is_sign) {
        await executeCheckinAPI();
      }
    } else {
      console.warn("Checkin status warning:", checkinData.message);
    }
  } catch (err) {
    console.error("Error checking daily check-in:", err);
  }

  // 3. Fetch Battle Chronicle Index (AR, map explorations, characters list)
  try {
    const indexData = await fetchHoyolabAPI("index");
    if (indexData.retcode === 0) {
      const idx = indexData.data;
      state.playerInfo = idx.role;
      state.playerInfo.stats = idx.stats;
      state.explorations = idx.world_explorations || [];
      state.characters  = idx.avatars || [];
      if (idx.stats) {
        const s = idx.stats;
        state.oculi = {
          anemo:   s.anemoculus_number  || 0,
          geo:     s.geoculus_number    || 0,
          electro: s.electroculus_number|| 0,
          dendro:  s.dendroculus_number || 0,
          hydro:   s.hydroculus_number  || 0,
          pyro:    s.pyroculus_number   || 0,
          cryo:    s.cryoculus_number   || 0,
        };
        state.accountStats = {
          days:       s.active_day_number     || 0,
          achievements: s.achievement_number  || 0,
          characters: s.avatar_number         || 0,
          waypoints:  s.way_point_number      || 0,
          abyss:      s.spiral_abyss          || '—',
          chests:     (s.precious_chest_number || 0) + (s.luxurious_chest_number || 0) +
                      (s.exquisite_chest_number || 0) + (s.common_chest_number || 0) +
                      (s.magic_chest_number || 0),
        };
      }
    } else {
      errorsOccurred.push(`Character catalog: ${indexData.message} (retcode ${indexData.retcode})`);
    }
  } catch (err) {
    console.error("Error fetching chronicle index:", err);
    errorsOccurred.push(`Adventure stats failed to load: ${err.message}`);
  }

  // 4. Fetch Abyss
  try {
    const abyssData = await fetchHoyolabAPI("spiralAbyss", { schedule_type: "1" });
    if (abyssData.retcode === 0) {
      state.abyss = abyssData.data;
    }
  } catch (err) {
    console.error("Error fetching spiralAbyss:", err);
  }

  // 5. Fetch Traveler's Ledger (Diary)
  try {
    const ledgerData = await fetchHoyolabAPI("ysLedger");
    if (ledgerData.retcode === 0) {
      state.ledger = ledgerData.data;
    }
  } catch (err) {
    console.error("Error fetching ysLedger:", err);
  }

  // Record sync time
  state.lastSyncTime = Date.now();
  state.nextSyncTime = Date.now() + 15 * 60 * 1000;

  // Sync all elements to UI & Storage
  saveLocalStorage();
  updateUI();
  flashCards();

  // Show status banner
  if (errorsOccurred.length > 0) {
    showBanner(`Sync partially completed. Warnings: ${errorsOccurred.join(" | ")}`, "error");
  } else {
    showBanner("Chronicle data sync completed successfully!", "success");
  }
} finally {
    refreshBtn.classList.remove("disabled");
    refreshBtn.disabled = false;
    refreshBtn.querySelector("span").innerText = "Refresh";
  }
}

// Auto Checkin trigger (on page load)
async function runAutoCheckin() {
  try {
    const checkinData = await fetchHoyolabAPI("dailyCheckIn");
    if (checkinData.retcode === 0 && !checkinData.data.is_sign) {
      console.log("Auto-Checkin triggered. Claiming rewards...");
      await executeCheckinAPI();
    }
  } catch (e) {
    console.error("Auto checkin fail:", e);
  }
}

// Claim checkin rewards via API
async function executeCheckinAPI() {
  const result = await fetchHoyolabAPI("doCheckIn");
  if (result.retcode === 0) {
    state.checkedInToday = true;
    state.checkinDaysCount += 1;
    saveLocalStorage();
    updateUI();
    playChime();
    showBanner("🎁 Daily check-in claimed automatically! Check your in-game mail.", "success");
  } else if (result.retcode === -5003) {
    // Already checked in
    state.checkedInToday = true;
    saveLocalStorage();
    updateUI();
  } else {
    throw new Error(result.message || "Failed to sign check-in");
  }
}

// Handle manual checkin click button
async function handleManualCheckin() {


  if (!state.ltoken || !state.ltuid) {
    openSettingsModal();
    return;
  }

  const btn = document.getElementById("do-checkin-btn");
  btn.disabled = true;
  btn.innerText = "Signing...";

  try {
    await executeCheckinAPI();
  } catch (error) {
    alert(`Check-in failed: ${error.message}`);
  } finally {
    btn.disabled = false;
    btn.innerText = state.checkedInToday ? "Checked In Today" : "Check-in Now";
  }
}

// Show feedback alert banner
function showBanner(text, type = "info") {
  const banner = document.getElementById("info-banner");
  const bannerText = document.getElementById("banner-text");
  
  banner.className = `info-banner ${type}`;
  bannerText.innerText = text;
  banner.classList.remove("hidden");

  // Auto-hide after 10 seconds for info/success
  if (type === "success" || type === "info") {
    setTimeout(() => {
      banner.classList.add("hidden");
    }, 10000);
  }
}

// Wake Lock — prevent screen sleeping while dashboard is open
let _wakeLock = null;
async function acquireWakeLock() {
  if (!('wakeLock' in navigator)) return;
  try {
    _wakeLock = await navigator.wakeLock.request('screen');
  } catch (e) {
    // Wake lock denied (battery saver etc.) — not critical
  }
}

// Play notification sound chime
function playChime() {
  if (state.soundMuted) return;
  const audio = document.getElementById("chime-sound");
  if (audio) {
    audio.currentTime = 0;
    audio.play().catch(e => console.log("Audio play blocked by browser policy"));
  }
}

// Trigger browser push notification
function triggerPushNotification(title, body) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  
  const options = {
    body,
    icon: "https://gi.yatta.moe/assets/UI/UI_AvatarIcon_Paimon.png",
    silent: true // We play our own chime
  };
  
  new Notification(title, options);
}

// Adjust resin in manual mode
window.adjustResin = function(val) {
  const input = document.getElementById("manual-resin-input");
  let current = parseInt(input.value) || 0;
  input.value = Math.max(0, Math.min(200, current + val));
};

window.saveManualResin = function() {
  const val = parseInt(document.getElementById("manual-resin-input").value);
  if (isNaN(val) || val < 0 || val > 200) {
    alert("Please input a valid Resin number between 0 and 200");
    return;
  }
  state.resin.count = val;
  state.resin.lastUpdate = Date.now();
  state.resin.alert160Triggered = val >= 160;
  state.resin.alert200Triggered = val >= 200;
  
  saveLocalStorage();
  updateUI();
  showBanner(`Resin manual override set to ${val}`, "success");
};

// Set currency in manual mode
window.saveManualCurrency = function() {
  const rank = parseInt(document.getElementById("manual-trust-rank").value);
  const energyVal = parseInt(document.getElementById("manual-adeptal-energy").value);
  const current = parseInt(document.getElementById("manual-currency-val").value);

  // Derive max capacity based on Trust Rank
  const capacityMap = { 1: 300, 2: 600, 3: 900, 4: 1200, 5: 1400, 6: 1600, 7: 1800, 8: 2000, 9: 2200, 10: 2400 };
  const maxCap = capacityMap[rank] || 2400;

  // Derive hourly rate based on Adeptal Energy
  const rateMap = { 0: 4, 2000: 8, 4500: 12, 8000: 16, 12000: 20, 15000: 22, 20000: 30 };
  const ratePerHour = rateMap[energyVal] || 30;

  if (isNaN(current) || current < 0 || current > maxCap) {
    alert(`Please input a valid Currency value between 0 and ${maxCap} for Trust Rank ${rank}`);
    return;
  }

  state.currency.count = current;
  state.currency.lastUpdate = Date.now();
  state.currency.rate = ratePerHour;
  state.currency.max = maxCap;
  state.currency.alertFullTriggered = current >= maxCap;

  saveLocalStorage();
  updateUI();
  showBanner("Teapot Realm currency tracker updated manually.", "success");
};

// Start a custom farm cooldown timer
function handleCreateTimer() {
  const name = document.getElementById("timer-name").value.trim() || "Farm Route";
  const hrs = parseInt(document.getElementById("timer-hours").value) || 0;
  const mins = parseInt(document.getElementById("timer-minutes").value) || 0;
  const secs = parseInt(document.getElementById("timer-seconds").value) || 0;

  const durationSeconds = (hrs * 3600) + (mins * 60) + secs;
  
  if (durationSeconds <= 0) {
    alert("Please input a valid time duration.");
    return;
  }

  const newTimer = {
    id: Date.now().toString(),
    name,
    duration: durationSeconds,
    startTime: Date.now()
  };

  state.customTimers.push(newTimer);
  saveLocalStorage();
  
  // Clear inputs
  document.getElementById("timer-name").value = "";
  document.getElementById("timer-hours").value = "0";
  document.getElementById("timer-minutes").value = "0";
  document.getElementById("timer-seconds").value = "0";

  updateUI();
  showBanner(`Timer '${name}' started!`, "success");
}

// Delete custom timer
window.deleteTimer = function(id) {
  state.customTimers = state.customTimers.filter(t => t.id !== id);
  saveLocalStorage();
  updateUI();
};

// Clear completed custom timers
function handleClearCompletedTimers() {
  const now = Date.now();
  state.customTimers = state.customTimers.filter(t => {
    const elapsed = Math.floor((now - t.startTime) / 1000);
    return elapsed < t.duration;
  });
  saveLocalStorage();
  updateUI();
}

// Redeeming promo codes helper
window.redeemPromoCode = function(codeIndex) {
  const codeObj = livePromoCodes[codeIndex];
  
  if (codeObj) {
    codeObj.redeemed = true;
    localStorage.setItem("teyvat_chrono_codes", JSON.stringify(livePromoCodes));
    
    // Open official redeem link in a new tab with prefilled parameters
    const redeemUrl = `https://genshin.hoyoverse.com/en/gift?code=${codeObj.code}`;
    window.open(redeemUrl, "_blank");

    updatePromoCodesUI();
  }
};

// Format seconds into readable duration e.g. "2h 45m"
function formatDuration(totalSeconds) {
  if (totalSeconds <= 0) return "Ready!";
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  
  let str = "";
  if (d > 0) str += `${d}d `;
  if (h > 0 || d > 0) str += `${h}h `;
  str += `${m}m `;
  if (d === 0 && h === 0) str += `${s}s`;
  
  return str.trim();
}

// Core Timer loop (Runs every 1 second)
function appTimerLoop() {
  const now = Date.now();
  const dateObj = new Date();

  // 1. Calculate & Draw Server Time
  const offset = SERVER_OFFSETS[state.server] || 1; // Default to Europe (GMT+1)
  
  // Calculate current server time
  // System time in UTC
  const utcTime = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000);
  const serverTimeObj = new Date(utcTime + (3600000 * offset));
  
  const hrStr = String(serverTimeObj.getHours()).padStart(2, '0');
  const minStr = String(serverTimeObj.getMinutes()).padStart(2, '0');
  const secStr = String(serverTimeObj.getSeconds()).padStart(2, '0');
  
  document.getElementById("server-time-display").innerText = `${hrStr}:${minStr}:${secStr}`;

  // 2. Live sync status indicator
  const syncDot = document.getElementById('sync-dot');
  const syncLabel = document.getElementById('sync-status-label');
  const nextSyncEl = document.getElementById('next-sync-countdown');

  if (state.lastSyncTime === 0) {
    syncDot.className = 'sync-dot waiting';
    syncLabel.innerText = 'No data yet';
    if (nextSyncEl) nextSyncEl.innerText = '--:--';
  } else {
    const ageSecs = Math.floor((now - state.lastSyncTime) / 1000);
    const ageMin = Math.floor(ageSecs / 60);
    const ageSec = ageSecs % 60;
    const ageStr = ageMin > 0 ? `${ageMin}m ${ageSec}s ago` : `${ageSec}s ago`;

    if (ageSecs < 60) {
      syncDot.className = 'sync-dot live';
      syncLabel.innerText = `Just synced`;
    } else if (ageSecs < 600) {
      syncDot.className = 'sync-dot live';
      syncLabel.innerText = `Synced ${ageStr}`;
    } else if (ageSecs < 900) {
      syncDot.className = 'sync-dot stale';
      syncLabel.innerText = `Synced ${ageStr}`;
    } else {
      syncDot.className = 'sync-dot old';
      syncLabel.innerText = `Last sync ${ageStr}`;
    }

    const toNext = Math.max(0, Math.floor((state.nextSyncTime - now) / 1000));
    const nm = Math.floor(toNext / 60);
    const ns = toNext % 60;
    if (nextSyncEl) nextSyncEl.innerText = toNext > 0 ? `${nm}:${String(ns).padStart(2,'0')}` : 'Now';
  }

  // 3. Countdowns for daily, weekly, and monthly boundaries (Abyss)
  // Daily Reset is at 04:00 server time
  let nextDailyReset = new Date(serverTimeObj);
  nextDailyReset.setHours(4, 0, 0, 0);
  if (serverTimeObj.getHours() >= 4) {
    nextDailyReset.setDate(nextDailyReset.getDate() + 1);
  }
  const dailyResetSeconds = Math.max(0, Math.floor((nextDailyReset - serverTimeObj) / 1000));
  document.getElementById("daily-reset-countdown").innerText = formatDuration(dailyResetSeconds);

  // Weekly Reset is on Monday 04:00 server time
  let nextWeeklyReset = new Date(serverTimeObj);
  const currentDay = serverTimeObj.getDay(); // 0 is Sunday, 1 is Monday...
  const daysToMonday = (8 - currentDay) % 7 || 7; // Monday relative
  nextWeeklyReset.setDate(nextWeeklyReset.getDate() + daysToMonday);
  nextWeeklyReset.setHours(4, 0, 0, 0);
  
  // If it's Monday morning before 4am
  if (currentDay === 1 && serverTimeObj.getHours() < 4) {
    nextWeeklyReset.setDate(nextWeeklyReset.getDate() - 7);
  }
  const weeklyResetSeconds = Math.max(0, Math.floor((nextWeeklyReset - serverTimeObj) / 1000));
  document.getElementById("weekly-reset-countdown").innerText = formatDuration(weeklyResetSeconds);

  // Abyss resets on the 1st and 16th at 04:00 server time
  let nextAbyssReset = new Date(serverTimeObj);
  const dayOfMonth = serverTimeObj.getDate();
  const serverHour = serverTimeObj.getHours();
  if (dayOfMonth < 16 || (dayOfMonth === 16 && serverHour < 4)) {
    nextAbyssReset.setDate(16);
    nextAbyssReset.setHours(4, 0, 0, 0);
  } else if (dayOfMonth === 1 && serverHour < 4) {
    nextAbyssReset.setHours(4, 0, 0, 0);
  } else {
    nextAbyssReset.setMonth(nextAbyssReset.getMonth() + 1);
    nextAbyssReset.setDate(1);
    nextAbyssReset.setHours(4, 0, 0, 0);
  }
  const abyssResetSeconds = Math.max(0, Math.floor((nextAbyssReset - serverTimeObj) / 1000));
  document.getElementById("abyss-reset-countdown").innerText = formatDuration(abyssResetSeconds);

  // 4. Real-Time Resin Math
  if (state.resin.lastUpdate === 0) {
    // No data loaded yet — leave HTML placeholders as-is, don't fire alerts
  } else if (state.resin.count < 200) {
    const elapsedSeconds = Math.floor((now - state.resin.lastUpdate) / 1000);
    const generatedResin = Math.floor(elapsedSeconds / 480); // 1 resin per 8 mins (480s)
    const currentResin = Math.min(200, state.resin.count + generatedResin);

    // Update progress ring offset
    const pct = currentResin / 200;
    const progressOffset = 339.29 - (339.29 * pct);
    document.getElementById("resin-progress-bar").style.strokeDashoffset = progressOffset;
    document.getElementById("resin-current-val").innerText = currentResin;

    // Remaining seconds to next point
    const remSecToNext = 480 - (elapsedSeconds % 480);
    document.getElementById("resin-next-time").innerText = `${Math.floor(remSecToNext / 60)}m ${remSecToNext % 60}s`;

    // Remaining seconds to 160 & 200
    const remSecondsTo160 = Math.max(0, (160 - currentResin) * 480 - (elapsedSeconds % 480));
    const remSecondsTo200 = Math.max(0, (200 - currentResin) * 480 - (elapsedSeconds % 480));
    
    document.getElementById("resin-160-time").innerText = formatDuration(remSecondsTo160);
    document.getElementById("resin-full-time").innerText = formatDuration(remSecondsTo200);

    // Estimated full clock time
    const fullClockObj = new Date(dateObj.getTime() + remSecondsTo200 * 1000);
    const fcHr = String(fullClockObj.getHours()).padStart(2, '0');
    const fcMin = String(fullClockObj.getMinutes()).padStart(2, '0');
    const fcDay = fullClockObj.getDate() !== dateObj.getDate() ? "Tomorrow" : "Today";
    document.getElementById("resin-full-clock").innerText = `${fcDay} at ${fcHr}:${fcMin}`;

    // Notification Triggers
    if (currentResin >= 160 && !state.resin.alert160Triggered && document.getElementById("resin-alert-160").checked) {
      state.resin.alert160Triggered = true;
      saveLocalStorage();
      playChime();
      triggerPushNotification("🌙 Resin Cap Approaching!", "Your Genshin Impact resin has reached 160. Time to craft or spend!");
    }
    if (currentResin >= 200 && !state.resin.alert200Triggered && document.getElementById("resin-alert-200").checked) {
      state.resin.alert200Triggered = true;
      saveLocalStorage();
      playChime();
      triggerPushNotification("🌙 Resin Cap Reached!", "Your resin is maxed out at 200/200! Go clear some domains or bosses!");
    }
  } else {
    // Resin is capped
    document.getElementById("resin-progress-bar").style.strokeDashoffset = 0;
    document.getElementById("resin-current-val").innerText = "200";
    document.getElementById("resin-next-time").innerText = "--";
    document.getElementById("resin-160-time").innerText = "Reached";
    document.getElementById("resin-full-time").innerText = "Max Capped";
    document.getElementById("resin-full-clock").innerText = "Now";
  }

  // 5. Realm Currency Math
  if (state.currency.lastUpdate === 0) {
    // No data loaded yet — leave HTML placeholders as-is, don't fire alerts
  } else if (state.currency.count < state.currency.max) {
    const elapsedSeconds = Math.floor((now - state.currency.lastUpdate) / 1000);
    const coinsGained = (elapsedSeconds * state.currency.rate) / 3600;
    const currentCoins = Math.min(state.currency.max, Math.floor(state.currency.count + coinsGained));

    // Update fill bar
    const pct = currentCoins / state.currency.max;
    document.getElementById("currency-fill-bar").style.width = `${pct * 100}%`;
    document.getElementById("currency-current-val").innerText = currentCoins;
    document.getElementById("currency-rate-text").innerText = `Rate: ${state.currency.rate}/hr`;

    // Remaining seconds to full capacity
    const remSeconds = Math.max(0, (state.currency.max - currentCoins) * 3600 / state.currency.rate);
    document.getElementById("currency-time-remaining").innerText = formatDuration(remSeconds);

    // Full clock time
    const fullClockObj = new Date(dateObj.getTime() + remSeconds * 1000);
    const fcHr = String(fullClockObj.getHours()).padStart(2, '0');
    const fcMin = String(fullClockObj.getMinutes()).padStart(2, '0');
    const fcDayStr = fullClockObj.getDate() !== dateObj.getDate() 
      ? (fullClockObj.getDate() === dateObj.getDate() + 1 ? "Tomorrow" : `${fullClockObj.getMonth() + 1}/${fullClockObj.getDate()}`)
      : "Today";
    document.getElementById("currency-full-clock").innerText = `${fcDayStr} at ${fcHr}:${fcMin}`;

    // Notification Triggers
    if (currentCoins >= state.currency.max && !state.currency.alertFullTriggered && document.getElementById("currency-alert").checked) {
      state.currency.alertFullTriggered = true;
      saveLocalStorage();
      playChime();
      triggerPushNotification("🪙 Serenitea Pot Alert!", "Your Realm Currency is fully loaded! Go collect it from Tubby.");
    }
  } else {
    // Currency is full
    document.getElementById("currency-fill-bar").style.width = "100%";
    document.getElementById("currency-current-val").innerText = state.currency.max;
    document.getElementById("currency-time-remaining").innerText = "Full Capacity";
    document.getElementById("currency-full-clock").innerText = "Now";
  }

  // 6. Parametric Transformer countdown
  const tReady = state.transformerReadyAt;
  if (tReady === -1 || tReady === -2) {
    document.getElementById("transformer-countdown").innerText = "—";
    document.getElementById("transformer-date").innerText =
      tReady === -1 ? "No data from API" : "Not tracked — use the HoYoLAB app once";
  } else if (tReady > 0 && tReady > now) {
    const remaining = Math.floor((tReady - now) / 1000);
    document.getElementById("transformer-countdown").innerText = formatDuration(remaining);
    const readyDate = new Date(tReady);
    document.getElementById("transformer-date").innerText =
      `Available: ${readyDate.toLocaleDateString()} at ${readyDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  } else {
    document.getElementById("transformer-countdown").innerText = "Ready!";
    document.getElementById("transformer-date").innerText = "Available now";
  }

  // 7. Sync dot update on refresh-btn press
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn && refreshBtn.disabled) {
    if (syncDot) syncDot.className = 'sync-dot syncing';
    if (syncLabel) syncLabel.innerText = 'Syncing...';
  }

  // 8. Dispatch Expeditions Realtime Countdowns
  updateExpeditionsRealtime();
}

// Update Custom Timers visual countdowns
function updateCustomTimersRealtime() {
  const container = document.getElementById("active-timers-list");
  if (state.customTimers.length === 0) {
    container.innerHTML = `<p class="empty-text">No active cooldown timers.</p>`;
    return;
  }

  const now = Date.now();
  let html = "";
  
  state.customTimers.forEach(t => {
    const elapsed = Math.floor((now - t.startTime) / 1000);
    const remaining = t.duration - elapsed;
    const isFinished = remaining <= 0;
    
    // If just finished, sound alarm once
    if (isFinished && !t.alertTriggered) {
      t.alertTriggered = true;
      saveLocalStorage();
      playChime();
      triggerPushNotification("⏰ Farm Timer Completed!", `Farming node '${t.name}' is now ready for collection!`);
    }

    const timerClass = isFinished ? "timer-card finished" : "timer-card";
    const displayTime = isFinished ? "READY" : formatDuration(remaining);
    const desc = isFinished ? "Completed" : `Started: ${new Date(t.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;

    html += `
      <div class="${timerClass}">
        <div class="timer-info">
          <span class="timer-title">${t.name}</span>
          <span class="timer-desc">${desc}</span>
        </div>
        <div class="timer-countdown ${isFinished ? 'text-green' : 'text-cyan'}">${displayTime}</div>
        <button class="timer-btn-delete" onclick="deleteTimer('${t.id}')">&times;</button>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Update Dispatch Expeditions countdowns
function updateExpeditionsRealtime() {
  const container = document.getElementById("expeditions-list");
  if (!state.expeditions || state.expeditions.length === 0) {
    container.innerHTML = `<p class="empty-text">No active expeditions</p>`;
    return;
  }

  let html = "";
  const now = Date.now();
  
  state.expeditions.forEach(ex => {
    // If dailyNote has last update, adjust seconds in real-time
    const elapsedSeconds = Math.floor((now - state.resin.lastUpdate) / 1000);
    const remaining = Math.max(0, ex.remSec - elapsedSeconds);
    const isFinished = remaining === 0;

    const fillPct = isFinished ? 100 : Math.min(100, Math.floor((1 - remaining / 72000) * 100)); // standard 20h expedition is 72000s

    const imgUrl = (ex.avatar && ex.avatar.startsWith('http')) ? ex.avatar : 'https://gi.yatta.moe/assets/UI/UI_AvatarIcon_Paimon.png';

    html += `
      <div class="expedition-row">
        <div class="exp-avatar-name">
          <div class="exp-avatar">
            <img src="${imgUrl}" alt="${ex.name}">
          </div>
          <span class="exp-name">${ex.name}</span>
        </div>
        <div class="exp-timer-bar">
          ${isFinished 
            ? '<span class="exp-status-finished">Finished</span>' 
            : `<span class="exp-time text-cyan">${formatDuration(remaining)}</span>`
          }
          <div class="exp-progress-line">
            <div class="exp-fill-line" style="width: ${fillPct}%;"></div>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Update major parts of static UI on changes
function updateUI() {
  // Update Resets Status in dashboard
  const commStatus = document.getElementById("commissions-status");
  commStatus.innerText = `${state.dailyCommissionsDone || 0} / 4 Completed`;
  if (state.dailyCommissionsDone === 4) {
    commStatus.className = "val text-green";
  } else {
    commStatus.className = "val text-cyan";
  }

  const kathStatus = document.getElementById("katheryne-status");
  if (state.katheryneClaimed) {
    kathStatus.innerText = "Claimed";
    kathStatus.className = "val text-green";
  } else {
    kathStatus.innerText = "Not Claimed";
    kathStatus.className = "val text-red";
  }

  const bossStatus = document.getElementById("bosses-status");
  const bossRemaining = 3 - (state.weeklyBossesDone || 0);
  bossStatus.innerText = `${bossRemaining} Remaining`;
  if (bossRemaining === 0) {
    bossStatus.className = "val text-muted";
  } else {
    bossStatus.className = "val text-gold";
  }

  // Account Badge UI
  const accCard = document.getElementById("account-card");
  if (state.playerInfo) {
    accCard.classList.remove("locked");
    const avatarUrl = (state.playerInfo.avatar && state.playerInfo.avatar.startsWith('http')) ? state.playerInfo.avatar : "https://gi.yatta.moe/assets/UI/UI_AvatarIcon_Paimon.png";
    document.getElementById("player-avatar").src = avatarUrl;
    document.getElementById("player-nickname").innerText = state.playerInfo.nickname || "Traveler";
    document.getElementById("player-level").innerText = `AR ${state.playerInfo.level || '--'}`;
    
    const a = state.accountStats || {};
    document.getElementById("stat-days").innerText        = a.days         || "--";
    document.getElementById("stat-achievements").innerText= a.achievements  || "--";
    document.getElementById("stat-characters").innerText  = a.characters    || "--";
    document.getElementById("stat-abyss").innerText       = a.abyss         || "--";
    document.getElementById("stat-waypoints").innerText   = a.waypoints     || "--";
    document.getElementById("stat-chests").innerText      = a.chests        || "--";
  } else {
    accCard.classList.add("locked");
    document.getElementById("player-avatar").src = "https://gi.yatta.moe/assets/UI/UI_AvatarIcon_Paimon.png";
    document.getElementById("player-nickname").innerText  = "Traveler (Locked)";
    document.getElementById("player-level").innerText     = "AR --";
    ["stat-days","stat-achievements","stat-characters","stat-abyss","stat-waypoints","stat-chests"]
      .forEach(id => document.getElementById(id).innerText = "--");
  }

  // Daily checkin widget
  document.getElementById("checkin-days").innerText = state.checkinDaysCount;
  const chkBadge = document.getElementById("checkin-status-badge");
  const chkBtn = document.getElementById("do-checkin-btn");
  if (state.checkedInToday) {
    chkBadge.className = "badge badge-success";
    chkBadge.innerText = "Claimed Today";
    chkBtn.innerText = "Checked In Today";
    chkBtn.disabled = true;
  } else {
    chkBadge.className = "badge badge-error";
    chkBadge.innerText = "Not Claimed Today";
    chkBtn.innerText = "Check-in Now";
    chkBtn.disabled = false;
  }

  // Promo Codes Widget
  updatePromoCodesUI();

  // Characters Catalog UI
  updateCharactersCatalogUI();

  // Exploration Map UI
  updateOculiTracker();
  updateExplorationsUI();

  // Spiral Abyss UI
  updateAbyssUI();

  // Travelers Ledger UI
  updateLedgerUI();
}

// Flash all cards briefly to signal fresh data
function flashCards() {
  document.querySelectorAll('.glass-card').forEach(card => {
    card.classList.remove('data-flash');
    void card.offsetWidth; // force reflow
    card.classList.add('data-flash');
  });
}

// Real game art icons for Primogems and Mora (from Genshin Impact Wiki)
const PRIMO_IMG_URL = 'https://gi.yatta.moe/assets/UI/UI_ItemIcon_201.png';
const MORA_IMG_URL  = 'https://gi.yatta.moe/assets/UI/UI_ItemIcon_202.png';
const PRIMO_SVG = `<img src="${PRIMO_IMG_URL}" alt="Primogem" style="width:16px;height:16px;vertical-align:middle;margin-right:2px">`;
const MORA_SVG  = `<img src="${MORA_IMG_URL}" alt="Mora" style="width:16px;height:16px;vertical-align:middle;margin-right:2px">`;

function formatReward(reward) {
  return reward
    .replace(/(\d[\d,]* Primogems?)/g, `${PRIMO_SVG} <span style="color:#b08de0">$1</span>`)
    .replace(/(\d[\d,]* Mora)/g,       `${MORA_SVG} <span style="color:#c8a040">$1</span>`);
}

// Draw promo codes list
function updatePromoCodesUI() {
  const container = document.getElementById("promo-codes-list");

  if (livePromoCodes.length === 0) {
    container.innerHTML = `<p class="empty-text">No active codes available — checking for updates...</p>`;
    return;
  }

  let html = "";
  livePromoCodes.forEach((c, idx) => {
    const claimedClass = c.redeemed ? ' code-row--claimed' : '';
    html += `
      <div class="code-row${claimedClass}">
        <div class="code-inner">
          <div class="code-left">
            <span class="code-key">${c.code}</span>
            <span class="code-reward-line">${formatReward(c.reward)}</span>
          </div>
          <div class="code-action-col">
            ${c.redeemed
              ? `<span class="code-claimed-badge"><svg viewBox="0 0 12 12" width="10" height="10"><polyline points="2,6 5,9 10,3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Obtained</span>`
              : `<button class="btn btn-sm btn-gold code-redeem-btn" onclick="redeemPromoCode(${idx})">
                  <svg viewBox="0 0 14 14" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 1v6M4 4l3-3 3 3"/><rect x="2" y="8" width="10" height="4" rx="1"/></svg>
                  Redeem
                </button>`
            }
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Fetch live active promo codes from /api/codes endpoint
async function fetchActiveCodes() {
  try {
    const response = await fetch('/api/codes');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    const fetchedCodes = data.codes || [];
    
    if (fetchedCodes.length === 0) {
      // Keep cached codes if API returns empty
      if (livePromoCodes.length === 0) {
        updatePromoCodesUI();
      }
      return;
    }
    
    // Load previously redeemed codes from localStorage to preserve redeemed state
    const cachedCodes = JSON.parse(localStorage.getItem('teyvat_chrono_codes') || '[]');
    const redeemedSet = new Set(cachedCodes.filter(c => c.redeemed).map(c => c.code));
    
    // Merge: mark codes as redeemed if user already claimed them
    livePromoCodes = fetchedCodes.map(c => ({
      ...c,
      redeemed: redeemedSet.has(c.code)
    }));
    
    // Cache the fresh codes
    localStorage.setItem('teyvat_chrono_codes', JSON.stringify(livePromoCodes));
    
    // Re-render
    updatePromoCodesUI();
    console.log(`Fetched ${livePromoCodes.length} active promo codes`);
  } catch (err) {
    console.warn('Failed to fetch live codes, using cached:', err.message);
    // On failure, keep whatever is in livePromoCodes (loaded from cache)
    updatePromoCodesUI();
  }
}

// ── Character detail panel ───────────────────────────────────────────────
let _detailChars = []; // sorted char list kept in sync with the grid

// Extract raw char key (e.g. "HuTao") from avatar icon URL for splash art
function getCharKey(char) {
  const url = char.image || char.icon || '';
  const filename = url.split('/').pop().split('?')[0];
  return filename.replace(/\.[^.]+$/, '')
    .replace(/^UI_AvatarIcon_Side_/, '')
    .replace(/^UI_AvatarIcon_Costume_/, '')
    .replace(/^UI_AvatarIcon_/, '')
    .replace(/^AvatarIcon_Side_/, '')
    .replace(/^AvatarIcon_/, '');
}

// Use parsed name when the API returns non-Latin chars (Chinese etc.)
function getCharDisplayName(char) {
  if (/[^ -]/.test(char.name)) {
    return parseCharacterNameFromIcon(char.image || '');
  }
  return char.name;
}

// Render ★ stars for a rarity level
function rarityStars(n, color) {
  return `<span style="color:${color || '#d4a017'};letter-spacing:1px;font-size:.85rem">${'★'.repeat(n)}</span>`;
}

// Render ♥ hearts for friendship level (fetter 1-10)
function friendshipHearts(n) {
  const filled = Math.min(10, n || 0);
  let h = '';
  for (let i = 0; i < 10; i++) {
    h += `<span style="color:${i < filled ? '#e84a5f' : 'rgba(255,255,255,.15)'};font-size:.72rem">${i < filled ? '♥' : '♡'}</span>`;
  }
  return h;
}

// Open character detail panel
window.showCharDetail = function(idx) {
  const char = _detailChars[idx];
  if (!char) return;

  const el     = ELEMENT_ICONS[char.element] || {};
  const elCol  = el.color || 'var(--gold-primary)';
  const name   = getCharDisplayName(char);
  const key    = getCharKey(char);
  const splash = `https://gi.yatta.moe/assets/UI/UI_Gacha_AvatarImg_${key}.png`;
  const stars5 = char.rarity >= 5;

  // Portrait
  const portrait = document.getElementById('char-detail-portrait');
  portrait.src = splash;
  portrait.onerror = () => { portrait.src = char.image || ''; };

  // Left panel accent colour
  document.getElementById('char-detail-left').style.background =
    `linear-gradient(160deg, ${elCol}22 0%, rgba(6,10,18,.9) 70%)`;

  // Stars
  document.getElementById('char-detail-stars').innerHTML =
    rarityStars(char.rarity, stars5 ? '#d4a017' : '#9b59b6');

  // Element badge + label
  document.getElementById('char-detail-el-badge').innerHTML = getElementSVG(char.element);
  document.getElementById('char-detail-el-badge').style.cssText =
    `background:${elCol}22;border:1px solid ${elCol}55;border-radius:50%;padding:5px;display:flex`;
  document.getElementById('char-detail-el-label').innerHTML =
    `<span style="color:${elCol};font-size:.75rem;text-transform:uppercase;letter-spacing:1px">${char.element || ''}</span>`;

  // Name + modal top border
  document.getElementById('char-detail-name').innerText = name;
  document.getElementById('char-detail-modal').style.borderTopColor = elCol;

  // Stat pills
  document.getElementById('char-detail-level').innerText = `Lv. ${char.level}`;
  document.getElementById('char-detail-const').innerHTML =
    `<span style="color:${elCol}">C${char.actived_constellation_num || 0}</span>`;
  document.getElementById('char-detail-fetter').innerHTML =
    `<span title="Friendship ${char.fetter}/10">${friendshipHearts(char.fetter)}</span>`;

  // Show loading state for weapon/artifacts, then fetch
  const wpnRow   = document.getElementById('char-detail-weapon-row');
  const slots    = document.getElementById('char-detail-artifact-slots');
  const setBonuses = document.getElementById('char-detail-set-bonuses');
  wpnRow.innerHTML   = `<p class="empty-text" style="opacity:.5">Loading…</p>`;
  slots.innerHTML    = `<p class="empty-text" style="opacity:.5">Loading…</p>`;
  setBonuses.innerHTML = '';

  // Show overlay immediately with base info
  document.getElementById('char-detail-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Fetch detailed weapon + artifact data
  if (state.uid && state.server && state.ltoken && state.ltuid) {
    const qs = new URLSearchParams({
      action: 'characterDetail',
      uid: state.uid, server: state.server,
      ltoken: state.ltoken, ltuid: state.ltuid,
      character_id: char.id
    });
    fetch(`/api/hoyolab?${qs}`)
      .then(r => r.json())
      .then(resp => {
        const detail = (resp.data?.list || [])[0];
        if (!detail) return;
        renderCharWeapon(wpnRow, detail.weapon);
        renderCharArtifacts(slots, setBonuses, detail.relics || []);
      })
      .catch(() => {
        wpnRow.innerHTML   = `<p class="empty-text">Failed to load</p>`;
        slots.innerHTML    = `<p class="empty-text">Failed to load</p>`;
      });
  } else {
    wpnRow.innerHTML = `<p class="empty-text">Connect credentials to see weapon data</p>`;
    slots.innerHTML  = `<p class="empty-text">Connect credentials to see artifact data</p>`;
  }
};

function renderCharWeapon(wpnRow, w) {
  if (!w || !w.name) { wpnRow.innerHTML = `<p class="empty-text">No weapon data</p>`; return; }
  const wpnStars = rarityStars(w.rarity, w.rarity >= 5 ? '#d4a017' : '#9b59b6');
  const wpnIcon  = w.icon
    ? `<img src="${w.icon}" class="char-detail-wpn-icon" alt="${w.name}" onerror="this.style.display='none'">`
    : '';
  wpnRow.innerHTML = `
    <div class="char-wpn-card">
      ${wpnIcon}
      <div class="char-wpn-info">
        <span class="char-wpn-name">${w.name}</span>
        <span class="char-wpn-sub">${w.type_name || ''} · Lv.${w.level} · R${w.affix_level || 1}</span>
        <span>${wpnStars}</span>
      </div>
    </div>`;
}

function renderCharArtifacts(slots, setBonuses, relics) {
  const POS_NAMES = ['', 'Flower', 'Plume', 'Sands', 'Goblet', 'Circlet'];
  if (!relics.length) {
    slots.innerHTML = `<p class="empty-text">No artifacts equipped</p>`;
    setBonuses.innerHTML = '';
    return;
  }
  const slotMap = {};
  relics.forEach(r => { slotMap[r.pos] = r; });

  let slotsHtml = '';
  for (let pos = 1; pos <= 5; pos++) {
    const r = slotMap[pos];
    if (r) {
      slotsHtml += `
        <div class="char-artifact-slot filled" title="${r.name || ''} — ${r.set?.name || ''}" style="border-color:${r.rarity >= 5 ? '#d4a01755' : '#9b59b655'}">
          ${r.icon ? `<img src="${r.icon}" alt="${POS_NAMES[pos]}" onerror="this.style.display='none'">` : `<span class="slot-label">${POS_NAMES[pos]}</span>`}
          <span class="artifact-slot-level">+${r.level}</span>
        </div>`;
    } else {
      slotsHtml += `<div class="char-artifact-slot empty"><span class="slot-label">${POS_NAMES[pos]}</span></div>`;
    }
  }
  slots.innerHTML = slotsHtml;

  const setCounts = {};
  relics.forEach(r => {
    const sn = r.set?.name;
    if (sn) setCounts[sn] = (setCounts[sn] || 0) + 1;
  });
  let bonusHtml = '';
  Object.entries(setCounts).forEach(([setName, cnt]) => {
    const pc = cnt >= 4 ? '4pc' : cnt >= 2 ? '2pc' : `${cnt}pc`;
    bonusHtml += `<span class="set-bonus-chip"><span class="set-pc">${pc}</span> ${setName}</span>`;
  });
  setBonuses.innerHTML = bonusHtml;
}

window.closeCharDetail = function() {
  document.getElementById('char-detail-overlay').classList.add('hidden');
  document.body.style.overflow = '';
};

// Draw characters list catalog
function updateCharactersCatalogUI() {
  const container = document.getElementById("characters-grid");
  const countSpan = document.getElementById("character-total-count");

  if (state.characters.length === 0) {
    container.innerHTML = `<p class="empty-text col-span-full text-center">No character data. Connect credentials in Settings to sync.</p>`;
    countSpan.innerText = "0";
    return;
  }

  countSpan.innerText = state.characters.length;

  // Keep sorted list for showCharDetail index lookup
  _detailChars = [...state.characters].sort((a,b) => b.level - a.level || b.rarity - a.rarity);

  let html = "";
  _detailChars.forEach((char, idx) => {
    const constellationText = `C${char.actived_constellation_num || 0}`;
    const displayName = getCharDisplayName(char);

    html += `
      <div class="char-card rarity-${char.rarity}" data-element="${char.element}" onclick="showCharDetail(${idx})" title="${displayName}">
        <div class="char-element-badge">${getElementSVG(char.element)}</div>
        <div class="char-thumb">
          <img src="${char.image}" alt="${displayName}" onerror="this.src='https://gi.yatta.moe/assets/UI/UI_AvatarIcon_Paimon.png'">
        </div>
        <span class="char-name">${displayName}</span>
        <div class="char-meta">
          <span class="char-level">Lv. ${char.level}</span>
          <span class="char-const">${constellationText}</span>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Oculi max values (updated through Natlan 5.x)
const OCULI_MAX = { anemo: 65, geo: 131, electro: 181, dendro: 271, hydro: 131, pyro: 60, cryo: 0 };
const OCULI_LABELS = { anemo: 'Anemoculi', geo: 'Geoculi', electro: 'Electroculi', dendro: 'Dendroculi', hydro: 'Hydroculi', pyro: 'Pyroculi', cryo: 'Cryoculi' };

function updateOculiTracker() {
  const el = document.getElementById('oculi-tracker');
  if (!el) return;
  const o = state.oculi;
  if (!o) { el.innerHTML = ''; return; }

  const entries = Object.entries(o).filter(([k, v]) => v > 0 || OCULI_MAX[k] > 0);
  if (!entries.length) { el.innerHTML = ''; return; }

  const chips = entries.map(([key, count]) => {
    const max   = OCULI_MAX[key];
    const icon  = ELEMENT_ICONS[key.charAt(0).toUpperCase() + key.slice(1)];
    const col   = icon ? icon.color : '#aaa';
    const pct   = max ? Math.round(count / max * 100) : null;
    const badge = max ? `<span class="oculus-pct" style="color:${col}">${pct}%</span>` : '';
    const img   = icon && icon.path
      ? `<img src="${icon.path}" alt="${key}" style="width:18px;height:18px;vertical-align:middle;margin-right:4px">`
      : '';
    return `
      <div class="oculus-chip" title="${OCULI_LABELS[key]}: ${count}${max ? ' / ' + max : ''}">
        ${img}<span class="oculus-count" style="color:${col}">${count}</span>
        ${max ? `<span class="oculus-max">/ ${max}</span>` : ''}
        ${badge}
        <span class="oculus-label">${OCULI_LABELS[key]}</span>
      </div>`;
  }).join('');

  el.innerHTML = `<div class="oculi-row">${chips}</div>`;
}

// Draw Explorations World Map
function updateExplorationsUI() {
  const container = document.getElementById("explorations-grid");
  if (state.explorations.length === 0) {
    container.innerHTML = `<p class="empty-text col-span-full text-center">No exploration data. Connect credentials in Settings to sync.</p>`;
    return;
  }

  const sorted = [...state.explorations].sort((a, b) => b.exploration_percentage - a.exploration_percentage);
  let html = "";
  sorted.forEach(exp => {
    const pct = exp.exploration_percentage / 10;
    const mapIconUrl = (exp.icon && exp.icon.startsWith('http'))
      ? exp.icon : 'https://gi.yatta.moe/assets/UI/UI_AvatarIcon_Paimon.png';
    const pctColor = pct >= 100 ? '#c8a05a' : pct >= 80 ? '#74c2a0' : pct >= 50 ? '#47bfe0' : 'rgba(255,255,255,.6)';

    const offeringBadges = (exp.offerings || []).map(o =>
      `<span class="offering-badge">${o.name} <strong>Lv.${o.level}</strong></span>`
    ).join('');

    html += `
      <div class="explore-card${pct >= 100 ? ' explore-complete' : ''}">
        <div class="explore-header">
          <img src="${mapIconUrl}" class="explore-icon" alt="${exp.name}" onerror="this.src='https://gi.yatta.moe/assets/UI/UI_AvatarIcon_Paimon.png'">
          <div class="explore-title-col">
            <span class="explore-name">${exp.name}</span>
            ${offeringBadges ? `<div class="explore-offerings">${offeringBadges}</div>` : ''}
          </div>
          <span class="explore-pct-badge" style="color:${pctColor}">${pct.toFixed(1)}%</span>
        </div>
        <div class="explore-bar">
          <div class="explore-fill" style="width:${Math.min(pct,100)}%;background:${pctColor}"></div>
        </div>
      </div>`;
  });

  container.innerHTML = html;
}

// Draw Spiral Abyss Status
function updateAbyssUI() {
  const container = document.getElementById("abyss-combat-summary");
  if (!state.abyss) {
    container.innerHTML = `<p class="empty-text">No Abyss stats synced. Please check connection.</p>`;
    return;
  }

  const d = state.abyss;
  document.getElementById("abyss-floor").innerText = d.max_floor || "Not Entered";
  document.getElementById("abyss-stars").innerText = d.total_star || "0";

  let html = `<div class="abyss-overview-info">`;

  // Display floors list breakdown if available
  if (d.floors && d.floors.length > 0) {
    html += `<p class="section-subtitle" style="margin-top: 5px; margin-bottom: 8px; color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">Floor Clear Status:</p>`;
    html += `<div class="abyss-floors-grid" style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">`;
    d.floors.forEach(fl => {
      html += `
        <div class="abyss-floor-row" style="display: flex; justify-content: space-between; font-size: 0.85rem; padding: 6px 10px; background: rgba(255,255,255,0.02); border-radius: 6px; border: 1px solid rgba(255,255,255,0.02);">
          <span class="floor-name">Floor ${fl.index}</span>
          <span class="floor-stars text-gold">✦ ${fl.star} / ${fl.max_star}</span>
        </div>
      `;
    });
    html += `</div>`;
  }

  // Display combat rankings details if available
  const hasStats = d.total_battle_num || d.total_win_num || (d.reveal_rank && d.reveal_rank.length > 0) || (d.defeat_rank && d.defeat_rank.length > 0) || (d.damage_rank && d.damage_rank.length > 0);
  
  if (hasStats) {
    html += `<p class="section-subtitle" style="margin-bottom: 8px; color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">Combat Records:</p>`;
    html += `<div style="display: flex; flex-direction: column; gap: 6px;">`;
    if (d.total_battle_num) {
      html += `<div class="abyss-rank-item" style="display: flex; justify-content: space-between; font-size: 0.85rem; padding: 4px 0;"><span>Total Battles:</span><span class="text-cyan">${d.total_battle_num}</span></div>`;
    }
    if (d.total_win_num) {
      html += `<div class="abyss-rank-item" style="display: flex; justify-content: space-between; font-size: 0.85rem; padding: 4px 0;"><span>Total Wins:</span><span class="text-cyan">${d.total_win_num}</span></div>`;
    }
    if (d.reveal_rank && d.reveal_rank.length > 0) {
      html += `<div class="abyss-rank-item" style="display: flex; justify-content: space-between; font-size: 0.85rem; padding: 4px 0;"><span>Most Revealed:</span><span class="text-gold">${d.reveal_rank[0].avatar_name || "Unknown"} (${d.reveal_rank[0].value} times)</span></div>`;
    }
    if (d.defeat_rank && d.defeat_rank.length > 0) {
      html += `<div class="abyss-rank-item" style="display: flex; justify-content: space-between; font-size: 0.85rem; padding: 4px 0;"><span>Most Defeats:</span><span class="text-red">${d.defeat_rank[0].avatar_name || "Unknown"} (${d.defeat_rank[0].value} kills)</span></div>`;
    }
    if (d.damage_rank && d.damage_rank.length > 0) {
      html += `<div class="abyss-rank-item" style="display: flex; justify-content: space-between; font-size: 0.85rem; padding: 4px 0;"><span>Strongest Strike:</span><span class="text-purple">${d.damage_rank[0].avatar_name || "Unknown"} (${d.damage_rank[0].value.toLocaleString()} DMG)</span></div>`;
    }
    html += `</div>`;
  } else if (!d.floors || d.floors.length === 0) {
    html += `<p class="empty-text">No combat history recorded for the current Spiral Abyss period.</p>`;
  }

  html += `</div>`;
  container.innerHTML = html;
}

// Draw Traveler's Ledger
function updateLedgerUI() {
  const container = document.getElementById("ledger-breakdown-list");
  if (!state.ledger) {
    container.innerHTML = `
      <p class="empty-text text-muted" style="margin-top: 15px; text-align: center; font-size: 0.85rem;">
        ⚠️ No Ledger data available.<br><br>
        <span style="font-size: 0.75rem; display: block; line-height: 1.4; color: var(--text-muted); padding: 0 10px;">
          Note: HoYoverse's API server often blocks or times out requests originating from cloud hosting IP ranges (like Vercel serverless functions) for the Traveler's Diary API.
        </span>
      </p>
    `;
    return;
  }

  const d = state.ledger;
  document.getElementById("ledger-primos").innerText = d.month_data?.current_primogems || "0";
  document.getElementById("ledger-mora").innerText = d.month_data?.current_mora?.toLocaleString() || "0";

  const groupArr = d.month_data?.primogems_groupby || [];
  if (groupArr.length === 0) {
    container.innerHTML = `<p class="empty-text">No ledger breakdown recorded.</p>`;
    return;
  }

  // Find max value to normalize percentages
  const maxVal = Math.max(...groupArr.map(g => g.num));
  let html = "";
  
  groupArr.forEach(g => {
    const pct = maxVal > 0 ? (g.num / maxVal) * 100 : 0;
    html += `
      <div class="ledger-breakdown-row">
        <div class="ledger-breakdown-info">
          <span>${g.action}</span>
          <span class="text-purple">${g.num} (${g.percent}%)</span>
        </div>
        <div class="ledger-breakdown-bar">
          <div class="ledger-breakdown-fill" style="width: ${pct}%;"></div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Draw domain schedule panel based on selected day (0=Sunday, 1=Monday...)
function updateDomainSchedule(dayIndex) {
  const container = document.getElementById("domains-materials-grid");
  const alertsBox = document.getElementById("domains-alerts-box");
  const alertsList = document.getElementById("domains-alerts-list");

  // Sync the active button to the day being displayed
  document.querySelectorAll("#domain-day-filters button").forEach(btn => {
    btn.classList.toggle("active", parseInt(btn.getAttribute("data-day")) === dayIndex);
  });

  let talentHTML = "";
  let weaponHTML = "";
  
  // Filter farmable talent books & weapon materials for dayIndex
  const todaysTalents = DOMAIN_MATERIALS.talents.filter(t => t.days.includes(dayIndex));
  const todaysWeapons = DOMAIN_MATERIALS.weapons.filter(w => w.days.includes(dayIndex));

  // Build Talent Books column
  let talentCards = "";
  todaysTalents.forEach(t => {
    talentCards += `
      <div class="material-item">
        <span class="mat-icon">${bookIcon(t)}</span>
        <div class="mat-details">
          <span class="mat-name" style="color:${t.color}">${t.name}</span>
          <span class="mat-usage">Characters: ${t.characters.slice(0, 5).join(", ")}...</span>
        </div>
      </div>
    `;
  });

  // Build Weapon Materials column
  let weaponCards = "";
  todaysWeapons.forEach(w => {
    weaponCards += `
      <div class="material-item">
        <span class="mat-icon">${bookIcon(w)}</span>
        <div class="mat-details">
          <span class="mat-name" style="color:${w.color}">${w.name}</span>
          <span class="mat-usage">${w.usage}</span>
        </div>
      </div>
    `;
  });

  container.innerHTML = `
    <div class="domain-card">
      <div class="domain-info">
        <h3>Talent Level-Up books</h3>
        <span class="location">Domain of Mastery</span>
      </div>
      <div class="domain-materials-list">
        ${talentCards || '<p class="empty-text">No materials today</p>'}
      </div>
    </div>
    
    <div class="domain-card">
      <div class="domain-info">
        <h3>Weapon Ascension Materials</h3>
        <span class="location">Domain of Forgery</span>
      </div>
      <div class="domain-materials-list">
        ${weaponCards || '<p class="empty-text">No materials today</p>'}
      </div>
    </div>
  `;

  // Build Personalized alerts based on owned characters
  let alertItemsHTML = "";
  
  if (state.characters && state.characters.length > 0) {
    const ownedCharacterNames = state.characters.map(c => c.name);

    todaysTalents.forEach(t => {
      // Find overlap of characters owned by player and characters using this material
      const matchingOwned = t.characters.filter(name => ownedCharacterNames.includes(name));
      
      if (matchingOwned.length > 0) {
        alertItemsHTML += `
          <div class="alert-item">
            <span>💡 <strong>${t.name} Books</strong> are farmable today for your character${matchingOwned.length > 1 ? 's' : ''}: 
            <strong class="text-gold">${matchingOwned.join(", ")}</strong>.</span>
          </div>
        `;
      }
    });
  }

  if (alertItemsHTML) {
    alertsList.innerHTML = alertItemsHTML;
    alertsBox.classList.remove("hidden");
  } else {
    alertsBox.classList.add("hidden");
  }
}
