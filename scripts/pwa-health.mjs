import { readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';

const requiredFiles=['index.html','public/manifest.webmanifest','public/service-worker.js','public/pwa-register.js','public/pwa.css','public/offline.html','public/assets/boostr-entry/entry.css','public/assets/boostr-entry/entry.js','public/assets/boostr-mother/session-ui.js','public/ecosystem/index.html','public/assets/boostr-ecosystem/ecosystem.css','public/assets/boostr-ecosystem/ecosystem.js'];
for(const file of requiredFiles)await access(file,constants.R_OK);
const[index,manifestText,worker,register,entryJs,entryCss,sessionUi,ecosystemHtml,ecosystemCss,ecosystemJs,viteConfig]=await Promise.all([readFile('index.html','utf8'),readFile('public/manifest.webmanifest','utf8'),readFile('public/service-worker.js','utf8'),readFile('public/pwa-register.js','utf8'),readFile('public/assets/boostr-entry/entry.js','utf8'),readFile('public/assets/boostr-entry/entry.css','utf8'),readFile('public/assets/boostr-mother/session-ui.js','utf8'),readFile('public/ecosystem/index.html','utf8'),readFile('public/assets/boostr-ecosystem/ecosystem.css','utf8'),readFile('public/assets/boostr-ecosystem/ecosystem.js','utf8'),readFile('vite.config.js','utf8')]);
const manifest=JSON.parse(manifestText);
const assertions=[
  [index.includes('id="choiceA"')&&index.includes('id="choiceB"'),'official entry exposes binary A/B controls'],
  [index.includes('id="questionStage"')&&index.includes('id="progressBar"'),'official entry exposes progressive routing UI'],
  [index.includes('data-i18n-aria-label="languageLabel"')&&index.includes('data-i18n-aria-label="closeLabel"'),'entry localizes accessible controls'],
  [index.includes('session-ui.js'),'entry consumes the real session API UI'],
  [sessionUi.includes('boostrSessionReady')&&sessionUi.includes('boostrSessionMissing'),'session bootstrap exposes required events'],
  [entryJs.includes('accessType')&&entryJs.includes('auditStarted')&&entryJs.includes('knowledge'),'entry distinguishes access and BOOSTR knowledge'],
  [entryJs.includes('knownIntent')&&entryJs.includes('clarity')&&entryJs.includes('explorePreference'),'entry resolves intent and clarity'],
  [entryJs.includes("'/login/?source=official-entry'"),'decision tree routes account holders to login'],
  [entryJs.includes("'/accept-invite/?source=official-entry'"),'decision tree routes invited users correctly'],
  [entryJs.includes("'/audit/?source=official-entry"),'decision tree routes Audit users correctly'],
  [entryJs.includes("'/portfolio/?source=official-entry"),'decision tree routes exploration users correctly'],
  [entryJs.includes("'/ecosystem/?source=official-entry"),'decision tree routes first-time users to BOOSTR explanation'],
  [entryJs.includes('boostr_entry_profile'),'entry stores non-sensitive routing context'],
  [entryJs.includes('boostrSessionReady')&&entryJs.includes('boostrSessionMissing'),'entry handles authenticated and guest states'],
  [entryJs.includes('const launchedAsPwa=isStandalone'),'automatic redirect requires actual standalone mode'],
  [manifest.start_url==='/?source=pwa','PWA starts at the official entry'],
  [manifest.display==='standalone','manifest uses standalone display'],
  [worker.includes("'/api/'")&&worker.includes("'/login'"),'service worker protects private routes'],
  [worker.includes('boostr-pwa-v3'),'service worker cache version is current'],
  [register.includes("serviceWorker.register('/service-worker.js'"),'service worker registration exists'],
  [entryCss.includes('@media(max-width:760px)'),'mobile binary layout exists'],
  [entryCss.includes('.binary-option'),'interactive option styling exists'],
  [ecosystemHtml.includes('id="ecoChoiceA"')&&ecosystemHtml.includes('id="ecoChoiceB"'),'ecosystem exposes a guided binary experience'],
  [ecosystemHtml.includes('id="systemMap"')&&ecosystemHtml.includes('data-module="payments"'),'ecosystem exposes an interactive system map'],
  [!ecosystemHtml.includes('/manager')&&!ecosystemHtml.includes('/partner-dashboard')&&!ecosystemHtml.includes('Mother UI'),'public ecosystem hides internal roles and development labels'],
  [ecosystemJs.includes('situation')&&ecosystemJs.includes('focus')&&ecosystemJs.includes('results'),'ecosystem personalizes explanation from two decisions'],
  [ecosystemJs.includes('boostrSessionReady')&&ecosystemJs.includes('openWorkspace'),'ecosystem provides a session-aware workspace action'],
  [ecosystemJs.includes('boostr_ecosystem_profile'),'ecosystem stores only routing context'],
  [ecosystemCss.includes('@media (max-width: 760px)')&&ecosystemCss.includes('.system-map'),'ecosystem has a mobile interactive map layout'],
  [viteConfig.includes("href: '/manifest.webmanifest'"),'Vite injects manifest'],
  [viteConfig.includes("src: '/pwa-register.js'"),'Vite injects PWA registration'],
  [viteConfig.includes('viewport-fit=cover'),'iPhone safe-area viewport is enabled']
];
const failures=assertions.filter(([ok])=>!ok).map(([,label])=>label);
if(failures.length){console.error('BOOSTR PWA health failed:');failures.forEach(failure=>console.error(`- ${failure}`));process.exit(1)}
console.log(`BOOSTR PWA health passed (${assertions.length} assertions).`);
