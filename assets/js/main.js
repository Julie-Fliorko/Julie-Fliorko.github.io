document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("projectGrid");
  const toolFiltersEl = document.getElementById("toolFilters");
  const skillFiltersEl = document.getElementById("skillFilters");

  // Fail loud if HTML ids don't match what we agreed
  if (!grid || !toolFiltersEl || !skillFiltersEl) {
    console.error("Missing required DOM elements:", {
      projectGrid: grid,
      toolFilters: toolFiltersEl,
      skillFilters: skillFiltersEl,
    });
    return;
  }

  let projects = [];
  let activeTool = "All";
  let activeSkill = "All";

  const uniqSorted = (arr) =>
    Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b));

  const chip = ({ label, type }) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.textContent = label;
    btn.dataset.filterType = type; // "tool" | "skill"
    btn.dataset.filterValue = label;
    btn.setAttribute("aria-pressed", "false");
    return btn;
  };

  const setActiveChipUI = () => {
    document.querySelectorAll("#toolFilters .chip").forEach((b) => {
      const isActive = b.dataset.filterValue === activeTool;
      b.classList.toggle("is-active", isActive);
      b.setAttribute("aria-pressed", String(isActive));
    });

    document.querySelectorAll("#skillFilters .chip").forEach((b) => {
      const isActive = b.dataset.filterValue === activeSkill;
      b.classList.toggle("is-active", isActive);
      b.setAttribute("aria-pressed", String(isActive));
    });
  };

  const matchesFilters = (p) => {
    const toolOk =
      activeTool === "All" || (p.filter_tools || []).includes(activeTool);
    const skillOk =
      activeSkill === "All" || (p.filter_skills || []).includes(activeSkill);
    return toolOk && skillOk;
  };

  const renderProjects = () => {
    grid.innerHTML = "";

    const visible = projects
      .slice()
      .sort((a, b) => a.order - b.order) // curated default order
      .filter(matchesFilters);

    if (visible.length === 0) {
      grid.innerHTML = `<p>No projects match the selected filters.</p>`;
      return;
    }

    visible.forEach((p) => {
      const a = document.createElement("a");
      a.className = "project-card";
      a.href = `projects/${p.slug}.html`;
      a.dataset.toolsSummary = (p.tools || []).join(", ");

      // data attrs (later used for GA4 events)
      a.dataset.projectId = p.project_id;
      a.dataset.projectName = p.project_name;
      a.dataset.primaryFocus = p.primary_focus;
      a.dataset.projectType = p.project_type;

      const toolChips = (p.tools || [])
        .map((t) => `<span class="mini-chip">${t}</span>`)
        .join("");

      const skillChips = (p.skills || [])
        .map((s) => `<span class="mini-chip">${s}</span>`)
        .join("");

      a.innerHTML = `
        <div class="project-image">
          <img src="${p.card_image}" alt="${p.project_name}" loading="lazy" />
        </div>

        <h3>${p.project_name}</h3>
        <p>${p.short_problem}</p>

        <div class="mini-chip-row">${toolChips}</div>
        <div class="mini-chip-row">${skillChips}</div>
      `;
      a.addEventListener("click", () => {
        if (typeof window.trackEvent !== "function") return;

        window.trackEvent("project_open", {
          project_id: p.project_id,
          project_name: p.project_name,
          slug: p.slug,
          primary_focus: p.primary_focus,
          project_type: p.project_type,
        });
      });

      grid.appendChild(a);
    });
  };

  const renderFilters = () => {
    const allFilterTools = uniqSorted(
      projects.flatMap((p) => p.filter_tools || [])
    );
    const allFilterSkills = uniqSorted(
      projects.flatMap((p) => p.filter_skills || [])
    );

    toolFiltersEl.innerHTML = "";
    skillFiltersEl.innerHTML = "";

    // "All" must exist for both
    toolFiltersEl.appendChild(chip({ label: "All", type: "tool" }));
    allFilterTools.forEach((t) =>
      toolFiltersEl.appendChild(chip({ label: t, type: "tool" }))
    );

    skillFiltersEl.appendChild(chip({ label: "All", type: "skill" }));
    allFilterSkills.forEach((s) =>
      skillFiltersEl.appendChild(chip({ label: s, type: "skill" }))
    );

    setActiveChipUI();
  };

  const onFilterClick = (e) => {
    const btn = e.target.closest("button.chip");
    if (!btn) return;

    const type = btn.dataset.filterType;
    const value = btn.dataset.filterValue;

    if (type === "tool") activeTool = value;
    if (type === "skill") activeSkill = value;

    setActiveChipUI();
    renderProjects();

    if (typeof window.trackEvent === "function") {
      window.trackEvent("filter_click", {
        filter_type: type,
        filter_value: value,
        active_skill: activeSkill,
      });
    }
  };

  toolFiltersEl.addEventListener("click", onFilterClick);
  skillFiltersEl.addEventListener("click", onFilterClick);

  // Load projects.json (must be a JSON array)
  try {
    const res = await fetch("./data/projects.json");

    if (!res.ok) {
      console.error("projects.json fetch failed:", res.status, res.statusText);
      grid.innerHTML = `<p>Could not load projects.json (${res.status}).</p>`;
      return;
    }

    projects = await res.json();

    if (!Array.isArray(projects)) {
      console.error("projects.json must be an array. Got:", projects);
      grid.innerHTML = `<p>projects.json must be a JSON array.</p>`;
      return;
    }

    renderFilters();
    renderProjects();
  } catch (err) {
    console.error("Failed to load projects:", err);
    grid.innerHTML = `<p>Failed to load projects.json. Check console.</p>`;
  }

  document.addEventListener("click", (e) => {
  const link = e.target.closest("a[data-contact]");
  if (!link) return;

  if (typeof window.trackEvent === "function") {
    window.trackEvent("contact_click", {
      contact_type: link.dataset.contact,
      page_type: document.body.dataset.pageType || "unknown",
    });
  }
});
});
