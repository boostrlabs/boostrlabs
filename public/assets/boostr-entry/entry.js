(() => {
  const T = {
    es: {
      status:'BOOSTR ONLINE',routeLabel:'ENCONTRANDO TU RUTA',back:'Volver',install:'Instalar',footer:'Custom Operating Systems · Miami',memoryEmpty:'Dos opciones. Una ruta correcta.',languageLabel:'Idioma',closeLabel:'Cerrar',
      installEyebrow:'BOOSTR PWA',installTitle:'Instala BOOSTR en tu iPhone.',installBody:'Abre esta página en Safari, toca Compartir y selecciona “Agregar a pantalla de inicio”.',installDone:'Entendido',routeFound:'Ruta encontrada.',opening:'Abriendo BOOSTR…',
      sessionKicker:'SESIÓN ACTIVA',sessionQuestion:'¿Qué quieres hacer?',sessionDescription:'BOOSTR ya reconoció tu cuenta y contexto autorizado.',continueTitle:'Continuar',continueBody:'Abrir mi acceso autorizado.',auditAccountTitle:'Hacer un Audit',auditAccountBody:'Evaluar otra operación o proyecto.',memoryAccess:'Acceso',memoryKnowledge:'Conocimiento',memoryGoal:'Objetivo',
      nodes:{
        start:{kicker:'BOOSTR ENTRY',question:'¿Ya tienes acceso a BOOSTR?',description:'Cuenta activa o invitación privada.',a:['Sí','Tengo una cuenta o invitación.'],b:['No','Todavía no pertenezco a BOOSTR.']},
        accessType:{kicker:'ACCESO',question:'¿Qué tipo de acceso tienes?',description:'Esto define la puerta correcta.',a:['Una cuenta activa','Ya tengo usuario y clave.'],b:['Una invitación','Me invitaron a un workspace o proyecto.']},
        auditStarted:{kicker:'AUDIT',question:'¿Ya comenzaste un BOOSTR Audit?',description:'Puedes continuar exactamente por esa ruta.',a:['Sí, continuarlo','Ya empecé el diagnóstico.'],b:['No, es mi primera vez','Todavía no he comenzado.']},
        knowledge:{kicker:'CONOCIMIENTO',question:'¿Ya sabes qué hace BOOSTR?',description:'No necesitas conocer términos técnicos.',a:['Sí, ya lo conozco','Sé qué tipo de ayuda estoy buscando.'],b:['No, guíame','Quiero entenderlo paso a paso.']},
        knownIntent:{kicker:'OBJETIVO',question:'¿A dónde quieres ir?',description:'Elige lo que quieres hacer ahora.',a:['Evaluar mi operación','Comenzar el BOOSTR Audit.'],b:['Ver lo que construyen','Explorar sistemas y trabajos reales.']},
        operation:{kicker:'CONTEXTO',question:'¿Tienes algo activo hoy?',description:'Negocio, marca, carrera, equipo o proyecto.',a:['Sí, está activo','Ya opero, vendo, creo o atiendo clientes.'],b:['Todavía no','Estoy explorando o comenzando.']},
        clarity:{kicker:'CLARIDAD',question:'¿Sabes qué necesitas mejorar?',description:'BOOSTR puede validar tu idea o descubrir el problema.',a:['Sí, lo tengo claro','Quiero evaluar una necesidad específica.'],b:['No, quiero descubrirlo','Necesito que BOOSTR detecte qué falta.']},
        explorePreference:{kicker:'DESCUBRIMIENTO',question:'¿Qué quieres ver primero?',description:'Te llevamos al contenido correcto, sin obligarte a hacer un Audit.',a:['Cómo funciona BOOSTR','Entender el ecosistema y la lógica.'],b:['Ejemplos reales','Ver proyectos, sistemas y resultados.']}
      }
    },
    en: {
      status:'BOOSTR ONLINE',routeLabel:'FINDING YOUR ROUTE',back:'Back',install:'Install',footer:'Custom Operating Systems · Miami',memoryEmpty:'Two options. One correct route.',languageLabel:'Language',closeLabel:'Close',
      installEyebrow:'BOOSTR PWA',installTitle:'Install BOOSTR on your iPhone.',installBody:'Open this page in Safari, tap Share, then choose “Add to Home Screen”.',installDone:'Got it',routeFound:'Route found.',opening:'Opening BOOSTR…',
      sessionKicker:'ACTIVE SESSION',sessionQuestion:'What do you want to do?',sessionDescription:'BOOSTR already recognized your account and authorized context.',continueTitle:'Continue',continueBody:'Open my authorized access.',auditAccountTitle:'Run an Audit',auditAccountBody:'Evaluate another operation or project.',memoryAccess:'Access',memoryKnowledge:'Knowledge',memoryGoal:'Goal',
      nodes:{
        start:{kicker:'BOOSTR ENTRY',question:'Do you already have BOOSTR access?',description:'Active account or private invitation.',a:['Yes','I have an account or invitation.'],b:['No','I do not belong to BOOSTR yet.']},
        accessType:{kicker:'ACCESS',question:'What kind of access do you have?',description:'This defines the correct door.',a:['An active account','I already have a username and password.'],b:['An invitation','I was invited to a workspace or project.']},
        auditStarted:{kicker:'AUDIT',question:'Have you already started a BOOSTR Audit?',description:'You can continue through that exact route.',a:['Yes, continue it','I already started the diagnosis.'],b:['No, first time','I have not started yet.']},
        knowledge:{kicker:'KNOWLEDGE',question:'Do you already know what BOOSTR does?',description:'You do not need to know technical terms.',a:['Yes, I know it','I know the kind of help I am looking for.'],b:['No, guide me','I want to understand it step by step.']},
        knownIntent:{kicker:'GOAL',question:'Where do you want to go?',description:'Choose what you want to do now.',a:['Evaluate my operation','Start the BOOSTR Audit.'],b:['See what BOOSTR builds','Explore real systems and work.']},
        operation:{kicker:'CONTEXT',question:'Do you have something active today?',description:'Business, brand, career, team or project.',a:['Yes, it is active','I already operate, sell, create or serve clients.'],b:['Not yet','I am exploring or just starting.']},
        clarity:{kicker:'CLARITY',question:'Do you know what needs improvement?',description:'BOOSTR can validate your idea or discover the problem.',a:['Yes, it is clear','I want to evaluate a specific need.'],b:['No, help me discover it','I need BOOSTR to detect what is missing.']},
        explorePreference:{kicker:'DISCOVERY',question:'What do you want to see first?',description:'We will take you to the right content without forcing an Audit.',a:['How BOOSTR works','Understand the ecosystem and logic.'],b:['Real examples','See projects, systems and results.']}
      }
    }
  };

  const N = {
    start:{depth:1,a:{next:'accessType',set:{access:'yes'}},b:{next:'auditStarted',set:{access:'no'}}},
    accessType:{depth:2,a:{route:'/login/?source=official-entry',set:{accessType:'account',intent:'login'}},b:{route:'/accept-invite/?source=official-entry',set:{accessType:'invitation',intent:'invite'}}},
    auditStarted:{depth:2,a:{route:'/audit/?source=official-entry&mode=resume',set:{auditStarted:true,intent:'audit_resume'}},b:{next:'knowledge',set:{auditStarted:false}}},
    knowledge:{depth:3,a:{next:'knownIntent',set:{knowledge:'familiar'}},b:{next:'operation',set:{knowledge:'new'}}},
    knownIntent:{depth:4,a:{route:'/audit/?source=official-entry&knowledge=familiar',set:{intent:'audit'}},b:{route:'/portfolio/?source=official-entry&knowledge=familiar',set:{intent:'portfolio'}}},
    operation:{depth:4,a:{next:'clarity',set:{operation:'active'}},b:{next:'explorePreference',set:{operation:'exploring'}}},
    clarity:{depth:5,a:{route:'/audit/?source=official-entry&knowledge=new&operation=active&clarity=clear',set:{clarity:'clear',intent:'audit'}},b:{route:'/audit/?source=official-entry&knowledge=new&operation=active&clarity=unknown',set:{clarity:'unknown',intent:'audit'}}},
    explorePreference:{depth:5,a:{route:'/ecosystem/?source=official-entry&knowledge=new',set:{intent:'ecosystem'}},b:{route:'/portfolio/?source=official-entry&knowledge=new',set:{intent:'portfolio'}}}
  };

  const $ = id => document.getElementById(id);
  const root=document.documentElement,params=new URLSearchParams(location.search);
  const isStandalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  const launchedAsPwa=isStandalone;
  const el={stage:$('questionStage'),kicker:$('questionKicker'),question:$('entryQuestion'),description:$('entryDescription'),a:$('choiceA'),b:$('choiceB'),aTitle:$('choiceATitle'),aBody:$('choiceABody'),bTitle:$('choiceBTitle'),bBody:$('choiceBBody'),back:$('backButton'),step:$('stepCounter'),bar:$('progressBar'),memory:$('routeMemory'),transition:$('routeTransition'),transitionTitle:$('routeTransitionTitle'),transitionBody:$('routeTransitionBody'),install:$('installButton'),dialog:$('installDialog')};
  let lang=resolveLanguage(),node='start',history=[],profile={},session=null,deferredInstallPrompt=null;

  function resolveLanguage(){const saved=localStorage.getItem('boostr_language');if(saved==='es'||saved==='en')return saved;return(navigator.language||'').toLowerCase().startsWith('es')?'es':'en'}
  function copy(){return T[lang]||T.es}
  function text(target,value){if(target)target.textContent=value||''}
  function applyLanguage(next){if(!T[next])return;lang=next;localStorage.setItem('boostr_language',next);root.lang=next;document.querySelectorAll('[data-language]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.language===next)));document.querySelectorAll('[data-i18n]').forEach(element=>{const value=copy()[element.dataset.i18n];if(value)element.textContent=value});document.querySelectorAll('[data-i18n-aria-label]').forEach(element=>{const value=copy()[element.dataset.i18nAriaLabel];if(value)element.setAttribute('aria-label',value)});document.title=next==='es'?'BOOSTR Labs — Encuentra tu entrada':'BOOSTR Labs — Find your entry';const meta=document.querySelector('meta[name="description"]');if(meta)meta.content=next==='es'?'Responde opciones A o B para encontrar la entrada correcta a BOOSTR Labs.':'Answer A or B to find the correct entry into BOOSTR Labs.';render()}
  function safeRoute(value){if(!value||typeof value!=='string'||!value.startsWith('/')||value.startsWith('//')||value.includes('\\'))return'/app/';try{const parsed=new URL(value,location.origin);return parsed.origin===location.origin?`${parsed.pathname}${parsed.search}${parsed.hash}`:'/app/'}catch{return'/app/'}}
  function sessionContext(data){return[data?.active_workspace?.name,data?.role].filter(Boolean).join(' · ')}
  function animate(update){el.stage.classList.add('leaving');setTimeout(()=>{update();el.stage.classList.remove('leaving');el.stage.classList.add('entering');requestAnimationFrame(()=>el.stage.classList.remove('entering'))},140)}
  function renderMemory(){const labels=[];if(profile.access)labels.push(`${copy().memoryAccess}: ${profile.access==='yes'?'✓':'—'}`);if(profile.knowledge)labels.push(`${copy().memoryKnowledge}: ${profile.knowledge==='familiar'?(lang==='es'?'conoce':'familiar'):(lang==='es'?'nuevo':'new')}`);if(profile.intent)labels.push(`${copy().memoryGoal}: ${profile.intent.replace('_',' ')}`);el.memory.textContent=labels.length?labels.join(' · '):copy().memoryEmpty}
  function renderGuest(){const c=copy().nodes[node],config=N[node];root.dataset.session='guest';text(el.kicker,c.kicker);text(el.question,c.question);text(el.description,c.description);text(el.aTitle,c.a[0]);text(el.aBody,c.a[1]);text(el.bTitle,c.b[0]);text(el.bBody,c.b[1]);el.step.textContent=String(config.depth).padStart(2,'0');el.bar.style.width=`${Math.min(100,18+(config.depth-1)*20)}%`;el.back.hidden=history.length===0;renderMemory()}
  function renderSession(){const dashboard=safeRoute(window.BOOSTR_DASHBOARD||session?.redirect||'/app/');root.dataset.session='active';text(el.kicker,copy().sessionKicker);text(el.question,copy().sessionQuestion);text(el.description,sessionContext(session)||copy().sessionDescription);text(el.aTitle,copy().continueTitle);text(el.aBody,copy().continueBody);text(el.bTitle,copy().auditAccountTitle);text(el.bBody,copy().auditAccountBody);el.step.textContent='✓';el.bar.style.width='100%';el.back.hidden=true;el.memory.textContent=sessionContext(session)||copy().sessionDescription;el.a.dataset.route=dashboard;el.b.dataset.route='/audit/?source=official-entry&account=active'}
  function render(){session?renderSession():renderGuest()}
  function persist(route){const payload={...profile,route,source:'official-entry',completedAt:new Date().toISOString(),version:1};localStorage.setItem('boostr_entry_profile',JSON.stringify(payload));sessionStorage.setItem('boostr_entry_profile',JSON.stringify(payload))}
  function openRoute(route){const target=safeRoute(route);persist(target);text(el.transitionTitle,copy().routeFound);text(el.transitionBody,copy().opening);el.transition.hidden=false;setTimeout(()=>location.assign(target),320)}
  function choose(side){if(session){openRoute(side==='a'?el.a.dataset.route:el.b.dataset.route);return}const action=N[node]?.[side];if(!action)return;history.push({node,profile:{...profile}});profile={...profile,...(action.set||{})};if(action.route){openRoute(action.route);return}animate(()=>{node=action.next;render()})}

  el.a.addEventListener('click',()=>choose('a'));el.b.addEventListener('click',()=>choose('b'));el.back.addEventListener('click',()=>{const previous=history.pop();if(!previous)return;animate(()=>{node=previous.node;profile=previous.profile;render()})});
  document.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',()=>applyLanguage(button.dataset.language)));
  function configureInstall(){const isiOS=/iphone|ipad|ipod/i.test(navigator.userAgent);if(!isStandalone&&(isiOS||deferredInstallPrompt))el.install.hidden=false}
  addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstallPrompt=event;configureInstall()});addEventListener('appinstalled',()=>{deferredInstallPrompt=null;el.install.hidden=true});
  el.install.addEventListener('click',async()=>{if(deferredInstallPrompt){deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice.catch(()=>null);deferredInstallPrompt=null;el.install.hidden=true;return}el.dialog.showModal()});
  $('installClose').addEventListener('click',()=>el.dialog.close());$('installDone').addEventListener('click',()=>el.dialog.close());el.dialog.addEventListener('click',event=>{if(event.target===el.dialog)el.dialog.close()});
  document.addEventListener('boostrSessionReady',event=>{session=event.detail;render();if(launchedAsPwa&&params.get('stay')!=='1'){const dashboard=safeRoute(window.BOOSTR_DASHBOARD||session?.redirect||'/app/');text(el.transitionTitle,copy().routeFound);text(el.transitionBody,copy().opening);el.transition.hidden=false;setTimeout(()=>location.replace(dashboard),320)}});
  document.addEventListener('boostrSessionMissing',()=>{session=null;render()});
  $('year').textContent=new Date().getFullYear();root.classList.toggle('boostr-standalone',isStandalone);applyLanguage(lang);configureInstall();
})();
