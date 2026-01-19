(function () {
  const startedAt = Date.now();

  window.trackEvent = function (name, params = {}) {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", name, params);
  };

  function sendPageTime() {
    const ms = Date.now() - startedAt;
    const seconds = Math.max(0, Math.round(ms / 1000));
    if (seconds < 2) return;

    const payload = {
      page_type: document.body.dataset.pageType || "unknown",
      page_path: location.pathname,
      seconds
    };

    const pid = document.body.dataset.projectId;
    const slug = document.body.dataset.projectSlug;
    if (pid) payload.project_id = pid;
    if (slug) payload.slug = slug;

    window.trackEvent("page_time", payload);
  }

  window.addEventListener("pagehide", sendPageTime);
})();
