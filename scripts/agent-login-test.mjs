import vm from 'node:vm';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const source=fs.readFileSync('public/assets/agent-os/app.js','utf8');
const login=source.slice(source.indexOf('function login(){'),source.indexOf('function register(){'));
for(const role of ['ADMIN','AGENT','ERROR']){
  const nodes=new Map(),button={disabled:false,textContent:'Entrar'};
  const context={show(){},$:s=>{if(!nodes.has(s))nodes.set(s,{});return nodes.get(s)},esc:s=>s,FormData:class{*[Symbol.iterator](){yield ['email','test@example.test'];yield ['secret','test']}},api:async()=>{if(role==='ERROR')throw Error('Credenciales incorrectas');return {role}},location:{hash:'#/agent/login'}};
  vm.runInNewContext(login+';login();',context);
  await nodes.get('#loginForm').onsubmit({preventDefault(){},target:{querySelector:()=>button}});
  assert.equal(context.location.hash,role==='ADMIN'?'#/admin':role==='AGENT'?'#/agent/dashboard':'#/agent/login');
  assert.equal(button.disabled,false);
  if(role==='ERROR')assert.match(nodes.get('#loginMsg').innerHTML,/Credenciales incorrectas/);
}
console.log('PASS: admin and agent login destinations, visible error, restored submit button.');
