(() => {
  const path = location.pathname.replace(/\/+$/, '');
  if (!['/app/janko','/app/johanka','/app/johanka/cloud'].includes(path)) return;
  function clean(){
    document.querySelectorAll('.boostr-production-context,.boostr-workspace-modal').forEach(node=>node.remove());
  }
  clean();
  new MutationObserver(clean).observe(document.body,{childList:true,subtree:true});
})();
