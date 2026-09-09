(function(){
  const isWork=()=>location.hash.replace(/^#/,'')==='/work';
  const render=()=>{
    if(!isWork())return;
    const host=document.querySelector('#work');
    if(!host)return;
    if(host.querySelector('.work-v9-shell'))return;
    if(typeof window.__renderBoostrWork==='function'){
      window.__renderBoostrWork();
      return;
    }
    // work-rescue-v9 owns the full markup; retrigger its hash listener without changing route.
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  };

  // SPA navigation can let the base router clear #work after another listener rendered it.
  // Re-check after the navigation stack and after the next paint.
  window.addEventListener('hashchange',()=>{
    if(!isWork())return;
    setTimeout(render,0);
    setTimeout(render,60);
    requestAnimationFrame(()=>requestAnimationFrame(render));
  });

  // Handle internal links explicitly so navigating from the landing behaves like opening /#/work directly.
  document.addEventListener('click',e=>{
    const a=e.target.closest('a[href="#/work"]');
    if(!a)return;
    e.preventDefault();
    if(isWork()) render();
    else location.hash='#/work';
  },true);

  // Last-resort guard: if another legacy module empties the route while /work is active, restore it.
  const obs=new MutationObserver(()=>{
    if(!isWork())return;
    const host=document.querySelector('#work');
    if(host && !host.querySelector('.work-v9-shell')) setTimeout(render,0);
  });
  obs.observe(document.documentElement,{childList:true,subtree:true});

  window.addEventListener('pageshow',render);
  setTimeout(render,100);
})();
