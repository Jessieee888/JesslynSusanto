(function () {
  "use strict";

  /* ==========================================================
     SMALL HELPERS
     ========================================================== */

  const $  = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  const prefersReducedMotion = () =>
    matchMedia("(prefers-reduced-motion: reduce)").matches;


  /* ==========================================================
     LIGHT / DARK MODE
     ========================================================== */

  const root = document.documentElement;
  const themeButton = $("#theme");

  // Use the saved choice if there is one
  try {
    const saved = localStorage.getItem("theme");
    if (saved) root.dataset.theme = saved;
  } catch (e) {}

  // Which mode is showing right now? (falls back to the device setting)
  function currentMode() {
    if (root.dataset.theme) return root.dataset.theme;
    return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  // The button names the mode you'll switch TO
  function updateThemeLabel() {
    themeButton.textContent = currentMode() === "dark" ? "Light mode" : "Dark mode";
  }

  themeButton.onclick = () => {
    const next = currentMode() === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (e) {}
    updateThemeLabel();
  };

  updateThemeLabel();


  /* ==========================================================
     "COPIED" MESSAGE + FLOWER BURST
     ========================================================== */

  const toastBox = $("#toast");
  let toastTimer;

  function showToast(message) {
    toastBox.textContent = message;
    toastBox.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastBox.classList.remove("show"), 1800);
  }

  // The flower images used in the burst
  const FLOWERS = [
    "images/flower-pink.svg",
    "images/flower-white.svg",
    "images/flower-yellow.svg",
  ];

  // Shoots a few flowers up from the point (x, y)
  function flowerBurst(x, y) {
    if (prefersReducedMotion()) return;

    for (let i = 0; i < 7; i++) {
      const flower = document.createElement("img");
      flower.className = "spark";
      flower.alt = "";
      flower.src = FLOWERS[i % FLOWERS.length];
      flower.style.left = x + "px";
      flower.style.top = y + "px";
      document.body.appendChild(flower);

      // Next frame: fly off in a random direction and fade out
      requestAnimationFrame(() => {
        const sideways = (Math.random() - 0.5) * 120;
        const upwards = -30 - Math.random() * 90;
        flower.style.transform = `translate(${sideways}px, ${upwards}px)`;
        flower.style.opacity = 0;
      });

      setTimeout(() => flower.remove(), 900);
    }
  }

  // Any button with data-copy="..." copies that text when clicked
  $$("[data-copy]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      const text = button.dataset.copy;

      try {
        await navigator.clipboard.writeText(text);
        showToast("Copied " + text);
      } catch (e) {
        showToast(text);   // clipboard blocked: just show the text
      }

      const box = button.getBoundingClientRect();
      flowerBurst(event.clientX || box.left + 20, event.clientY || box.top);
    });
  });


  /* ==========================================================
     SIDEBAR MENU (built from the page headings)
     ========================================================== */

  const sections = $$("main section");

  $("#nav").innerHTML = sections
    .map((section) => {
      const title = section.querySelector("h2").textContent;
      return `<li><a href="#${section.id}" data-id="${section.id}">${title}</a></li>`;
    })
    .join("");

  const navLinks = $$("#nav a");

  // Highlight the menu link for whichever section is on screen
  const sectionWatcher = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        navLinks.forEach((link) => {
          const isCurrent = link.dataset.id === entry.target.id;
          link.classList.toggle("on", isCurrent);

          if (isCurrent) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        });
      });
    },
    { rootMargin: "-30% 0px -60% 0px" }
  );

  sections.forEach((section) => sectionWatcher.observe(section));


  /* ==========================================================
     COUNTING NUMBERS ("At a glance")
     Numbers count up when they scroll into view.
     ========================================================== */

  function formatNumber(value, decimals) {
    return value.toLocaleString("en-AU", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  function countUp(element) {
    const target   = Number(element.dataset.n);   // number to reach
    const decimals = Number(element.dataset.d);   // decimal places
    const suffix   = element.dataset.plus ? "+" : "";

    // No animation if the visitor prefers reduced motion
    if (prefersReducedMotion()) {
      element.textContent = formatNumber(target, decimals) + suffix;
      return;
    }

    const duration = 1100;   // milliseconds
    const start = performance.now();

    function frame(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);   // starts fast, slows down
      const done = progress === 1;

      element.textContent =
        formatNumber(target * eased, decimals) + (done ? suffix : "");

      if (!done) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  const counterWatcher = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      counterWatcher.unobserve(entry.target);   // only count once
      countUp(entry.target);
    });
  });

  $$("[data-n]").forEach((element) => counterWatcher.observe(element));


  /* ==========================================================
     SKILLS (tabs + skill bubbles + project filter)
     ========================================================== */

  // Skills shown in each tab. Edit these lists to add or remove skills.
  const SKILLS = {
    "Languages":      ["Python", "JavaScript", "SQL", "R", "HTML", "CSS", "C"],
    "Development":    ["Git/GitHub", "Godot (GDScript)", "Responsive web", "DOM manipulation", "REST APIs"],
    "Data and cloud": ["Google Cloud", "BigQuery", "Tableau"],
    "3D and game":    ["Unity", "Maya", "Blender", "Substance Painter"],
  };

  // Skills whose project tag (data-s in the HTML) differs from their name
  const SKILL_TAGS = {
    "Git/GitHub": "git",
    "Godot (GDScript)": "godot",
    "Substance Painter": "substance",
  };

  const tagFor = (skillName) => SKILL_TAGS[skillName] || skillName.toLowerCase();

  const projects = $$(".proj");
  let activeTab = Object.keys(SKILLS)[0];   // tab being shown
  const selectedSkills = new Map();         // tag -> display name

  function drawTabs() {
    $("#tabs").innerHTML = Object.keys(SKILLS)
      .map((name) => `
        <button class="tab" role="tab"
                aria-selected="${name === activeTab}"
                data-name="${name}">${name}</button>`)
      .join("");

    $$(".tab").forEach((tab) => {
      tab.onclick = () => {
        activeTab = tab.dataset.name;
        drawTabs();
        drawSkillBubbles();
      };
    });
  }

  function drawSkillBubbles() {
    $("#chips").innerHTML = SKILLS[activeTab]
      .map((name) => {
        const tag = tagFor(name);
        return `
          <button class="chip" aria-pressed="${selectedSkills.has(tag)}"
                  data-tag="${tag}" data-name="${name}">${name}</button>`;
      })
      .join("");

    // Click a skill to select it, click again to unselect it.
    // You can select as many as you like.
    $$(".chip").forEach((chip) => {
      chip.onclick = () => {
        const tag = chip.dataset.tag;

        if (selectedSkills.has(tag)) selectedSkills.delete(tag);
        else selectedSkills.set(tag, chip.dataset.name);

        drawSkillBubbles();
        filterProjects();
      };
    });
  }

  // Fade projects that don't use ALL of the selected skills
  function filterProjects() {
    const tags = [...selectedSkills.keys()];
    let matches = 0;

    projects.forEach((project) => {
      const projectTags = project.dataset.s.split(",");
      const usesAll = tags.every((tag) => projectTags.includes(tag));

      project.classList.toggle("dim", !usesAll);
      project.classList.toggle("hit", tags.length > 0 && usesAll);
      if (usesAll) matches++;
    });

    updateHint(matches);
  }

  function updateHint(matches) {
    const hint = $("#hint");

    if (selectedSkills.size === 0) {
      hint.textContent = "Select one or more skills to see which projects use them.";
      return;
    }

    const names = [...selectedSkills.values()].join(" + ");
    const together = selectedSkills.size > 1 ? " together" : "";

    const message = matches
      ? `${matches} project${matches > 1 ? "s" : ""} use${matches > 1 ? "" : "s"} ${names}${together}. `
      : `No listed project uses ${names}${together}. `;

    hint.innerHTML = message + '<button id="clear-skill">Clear all</button>';

    $("#clear-skill").onclick = () => {
      selectedSkills.clear();
      drawSkillBubbles();
      filterProjects();
    };
  }

  drawTabs();
  drawSkillBubbles();


  /* ==========================================================
     EXPAND / COLLAPSE (projects + experience + education)
     ========================================================== */

  function makeExpandable(buttonSelector, containerSelector) {
    $$(buttonSelector).forEach((button) => {
      button.addEventListener("click", () => {
        const container = button.closest(containerSelector);
        const isOpen = !container.classList.contains("open");

        container.classList.toggle("open", isOpen);
        button.setAttribute("aria-expanded", isOpen);
      });
    });
  }

  makeExpandable(".proj .head", ".proj");
  makeExpandable(".item button", ".item");


  /* ==========================================================
     ROLE LINE (text changes every few seconds, click to skip)
     ========================================================== */

  const ROLES = [
    "Data Science and AI student",
    "Game developer",
    "3D artist",
    "Piano player",
  ];

  const roleText = $("#roleTxt");
  const waveFlower = $("#wave");
  let roleIndex = 0;

  function showNextRole() {
    roleText.classList.add("out");   // fade out

    setTimeout(() => {
      roleIndex = (roleIndex + 1) % ROLES.length;
      roleText.textContent = ROLES[roleIndex];
      roleText.classList.remove("out");   // fade back in
    }, 250);
  }

  // Click: next role + wiggle the flower
  $("#role").onclick = () => {
    showNextRole();
    waveFlower.classList.remove("go");
    void waveFlower.offsetWidth;   // restarts the animation
    waveFlower.classList.add("go");
  };

  if (!prefersReducedMotion()) setInterval(showNextRole, 3500);
})();