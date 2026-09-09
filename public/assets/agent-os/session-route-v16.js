(()=>{
  let checking=false;
  let lastKey='';

  const currentRoute=()=>location.hash.replace(/^#/,'')||'/';
  const isProtected=r=>r.startsWith('/admin')||r.startsWith('/agent/dashboard');

  async function session(){
    try{
      const response=await fetch('/api/agent-os/auth/me',{
        credentials:'include',
        cache:'no-store',
        headers:{'accept':'application/json'}
      });
      if(!response.ok)return null;
      const data=await response.json().catch(()=>({}));
      return data?.user||null;
    }catch{
      return null;
    }
  }

  async function reconcile(){
    if(checking)return;
    const r=currentRoute();
    if(!r.startsWith('/agent/login')&&!isProtected(r))return;

    checking=true;
    try{
      const user=await session();
      const key=`${r}|${user?.role||'guest'}|${user?.id||user?.email||''}`;
      if(key===lastKey)return;
      lastKey=key;

      if(r.startsWith('/agent/login')){
        if(user){
          const target=user.role==='ADMIN'?'#/admin':'#/agent/dashboard';
          if(location.hash!==target)location.hash=target;
        }
        return;
      }

      if(!user){
        if(location.hash!=='#/agent/login')location.hash='#/agent/login';
        return;
      }

      if(r.startsWith('/admin')&&user.role!=='ADMIN'){
        if(location.hash!=='#/agent/dashboard')location.hash='#/agent/dashboard';
        return;
      }

      if(r.startsWith('/agent/dashboard')&&user.role==='ADMIN'){
        if(location.hash!=='#/admin')location.hash='#/admin';
      }
    }finally{
      checking=false;
    }
  }

  addEventListener('hashchange',()=>queueMicrotask(reconcile));
  addEventListener('pageshow',reconcile);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',reconcile,{once:true});
  else reconcile();
})();
