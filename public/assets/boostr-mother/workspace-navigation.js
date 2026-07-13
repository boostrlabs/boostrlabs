(() => {
  if (window.__BOOSTR_WORKSPACE_NAV__) return;
  window.__BOOSTR_WORKSPACE_NAV__ = true;
  // Custom OS dashboards own their module routing. This runtime stays present
  // for backwards compatibility but no longer injects partner/workspace cards.
})();
