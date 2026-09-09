(function(){
  const isWork=()=>location.hash.replace(/^#/,'')==='/work';
  let pending=false;

  function render(){
    if(!isWork()||pending)return;
    const host=document.querySelector('#work');
    if(!host||host.querySelector('.work-v9-shell'))return;
    pending=true;
    requestAnimationFrame(()=>{
      pending=false;
      if(isWork()&&typeof window.__renderBoostrWork==='function') window.__renderBoostrWork();
    });
  }

  window.addEventListener('hashchange',render);
  window.addEventListener('pageshow',render);

  document.addEventListener('click',e=>{
    const a=e.target.closest('a[href="#/work"]');
    if(!a)return;
    if(isWork()){
      e.preventDefault();
      render();
    }
  },true);

  setTimeout(render,80);
})();
