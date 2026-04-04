/**
 * script.js
 * Part 1 – Theme system & settings panel (runs on every page)
 * Part 2 – Subject page logic (subject.html only)
 * Part 3 – Home page bulk-open (index.html only)
 */

/* ============================================================
   Shared — Bulk Open utilities (used by Parts 2 & 3)
   ============================================================ */
var BULK_OPEN = (function () {
  var DELAY_MS = 300;
  var MAX_TABS = 15;

  function getUrlsForSubject(subject, sectionId) {
    var urls = [];
    if (Array.isArray(subject.sections)) {
      subject.sections.forEach(function (sec) {
        if (!sectionId || sec.id === sectionId) {
          sec.files.forEach(function (f) {
            urls.push(sec.folder + "/" + encodeURIComponent(f));
          });
        }
      });
    } else if (Array.isArray(subject.files)) {
      subject.files.forEach(function (f) {
        urls.push(subject.folder + "/" + encodeURIComponent(f));
      });
    }
    return urls;
  }

  function openWithDelay(urls, statusEl) {
    if (urls.length === 0) {
      alert("No PDFs found for the selected scope.");
      return;
    }
    var toOpen = urls;
    if (urls.length > MAX_TABS) {
      var proceed = window.confirm(
        urls.length + " PDFs are in scope, but the safety limit is " + MAX_TABS + ".\n" +
        "Only the first " + MAX_TABS + " will be opened. Continue?"
      );
      if (!proceed) return;
      toOpen = urls.slice(0, MAX_TABS);
    }
    if (statusEl) {
      statusEl.textContent = "Opening PDFs\u2026 (0\u202f/\u202f" + toOpen.length + ")";
      statusEl.removeAttribute("hidden");
    }
    toOpen.forEach(function (url, i) {
      setTimeout(function () {
        window.open(url, "_blank", "noopener,noreferrer");
        if (statusEl) {
          var done = i + 1;
          if (done < toOpen.length) {
            statusEl.textContent = "Opening PDFs\u2026 (" + done + "\u202f/\u202f" + toOpen.length + ")";
          } else {
            statusEl.textContent = "\u2713 Opened " + done + " PDF(s).";
            setTimeout(function () { statusEl.setAttribute("hidden", ""); }, 3000);
          }
        }
      }, i * DELAY_MS);
    });
  }

  return { getUrlsForSubject: getUrlsForSubject, openWithDelay: openWithDelay };
})();

/* ============================================================
   PART 1 — Theme System & Settings Panel
   ============================================================ */
(function () {
  var THEMES = [
    {
      id: 'default',
      label: 'Default',
      colors: ['#1a73e8', '#f4f6fb', '#ffffff']
    },
    {
      id: 'dark',
      label: 'Dark Mode',
      colors: ['#60a5fa', '#0f1117', '#1e2130']
    },
    {
      id: 'ios',
      label: 'iOS Style',
      colors: ['#007aff', '#f2f2f7', 'rgba(255,255,255,0.82)']
    },
    {
      id: 'grayscale',
      label: 'Grayscale',
      colors: ['#333333', '#f0f0f0', '#ffffff']
    },
    {
      id: 'pastel',
      label: 'Soft Pastel',
      colors: ['#9c6fcd', '#fdf6f0', '#fff8fc']
    }
  ];

  var TT_THEMES = [
    { id: 'ios',     label: 'iOS Style',  icon: '🍎' },
    { id: 'minimal', label: 'Minimal',    icon: '◻️' },
    { id: 'dark',    label: 'Dark',       icon: '🌑' }
  ];

  /** Apply a theme by id and persist it */
  function applyTheme(themeId) {
    document.documentElement.setAttribute('data-theme', themeId);
    localStorage.setItem('theme', themeId);
    updateActiveButton(themeId);
  }

  /** Mark the matching theme button as active */
  function updateActiveButton(themeId) {
    document.querySelectorAll('.settings-theme-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.theme === themeId);
    });
  }

  /** Pick a random theme different from the current one */
  function applyRandomTheme() {
    var current = document.documentElement.getAttribute('data-theme') || 'default';
    var others = THEMES.filter(function (t) { return t.id !== current; });
    var pick = others[Math.floor(Math.random() * others.length)];
    applyTheme(pick.id);
  }

  /** Apply a timetable theme and persist it */
  function applyTtTheme(ttId) {
    localStorage.setItem('ttTheme', ttId);
    var resolved = ttId;
    if (ttId === 'random') {
      var opts = TT_THEMES.map(function (t) { return t.id; });
      resolved = opts[Math.floor(Math.random() * opts.length)];
    }
    document.documentElement.setAttribute('data-tt-theme', resolved);
    updateActiveTtButton(ttId);
  }

  /** Mark the matching timetable theme button as active */
  function updateActiveTtButton(ttId) {
    document.querySelectorAll('.settings-tt-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.ttTheme === ttId);
    });
  }

  /** Inject the settings button into the page header */
  function buildSettingsButton() {
    var header = document.querySelector('header');
    if (!header) return;

    var btn = document.createElement('button');
    btn.id = 'settings-btn';
    btn.className = 'settings-btn';
    btn.setAttribute('aria-label', 'Open settings');
    btn.setAttribute('aria-controls', 'settings-panel');
    btn.title = 'Settings';
    btn.textContent = '\u2699\uFE0F'; // ⚙️

    btn.addEventListener('click', openPanel);
    header.appendChild(btn);
  }

  /** Inject the overlay + settings panel into the page body */
  function buildSettingsPanel() {
    /* Overlay */
    var overlay = document.createElement('div');
    overlay.id = 'settings-overlay';
    overlay.className = 'settings-overlay';
    overlay.addEventListener('click', closePanel);

    /* Panel */
    var panel = document.createElement('div');
    panel.id = 'settings-panel';
    panel.className = 'settings-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Settings');

    /* Panel header */
    var panelHeader = document.createElement('div');
    panelHeader.className = 'settings-panel-header';

    var title = document.createElement('h2');
    title.textContent = 'Settings';

    var closeBtn = document.createElement('button');
    closeBtn.className = 'settings-close-btn';
    closeBtn.setAttribute('aria-label', 'Close settings');
    closeBtn.textContent = '\u2715'; // ✕
    closeBtn.addEventListener('click', closePanel);

    panelHeader.appendChild(title);
    panelHeader.appendChild(closeBtn);

    /* Panel body */
    var panelBody = document.createElement('div');
    panelBody.className = 'settings-panel-body';

    var sectionLabel = document.createElement('h3');
    sectionLabel.className = 'settings-section-label';
    sectionLabel.textContent = 'Appearance';

    /* Theme list */
    var themeList = document.createElement('div');
    themeList.className = 'theme-list';

    THEMES.forEach(function (theme) {
      var btn = document.createElement('button');
      btn.className = 'settings-theme-btn';
      btn.dataset.theme = theme.id;
      btn.setAttribute('aria-label', 'Apply ' + theme.label + ' theme');

      var swatch = document.createElement('span');
      swatch.className = 'theme-swatch';
      swatch.style.background =
        'linear-gradient(135deg, ' +
        theme.colors[0] + ' 33%, ' +
        theme.colors[1] + ' 33% 66%, ' +
        theme.colors[2] + ' 66%)';

      var label = document.createElement('span');
      label.textContent = theme.label;

      btn.appendChild(swatch);
      btn.appendChild(label);
      btn.addEventListener('click', function () { applyTheme(theme.id); });
      themeList.appendChild(btn);
    });

    /* Random theme button */
    var randomBtn = document.createElement('button');
    randomBtn.id = 'random-theme-btn';
    randomBtn.className = 'random-theme-btn';
    randomBtn.setAttribute('aria-label', 'Apply a random theme');

    var diceIcon = document.createElement('span');
    diceIcon.setAttribute('aria-hidden', 'true');
    diceIcon.textContent = '\uD83C\uDFB2 '; // 🎲

    var randomBtnText = document.createElement('span');
    randomBtnText.textContent = 'Random Theme';

    randomBtn.appendChild(diceIcon);
    randomBtn.appendChild(randomBtnText);
    randomBtn.addEventListener('click', applyRandomTheme);

    panelBody.appendChild(sectionLabel);
    panelBody.appendChild(themeList);
    panelBody.appendChild(randomBtn);

    /* ---- Timetable Theme section ---- */
    var ttDivider = document.createElement('hr');
    ttDivider.style.cssText = 'border:none;border-top:1px solid var(--border);margin:0.2rem 0;';
    panelBody.appendChild(ttDivider);

    var ttSectionLabel = document.createElement('h3');
    ttSectionLabel.className = 'settings-section-label';
    ttSectionLabel.textContent = 'Timetable Theme';
    panelBody.appendChild(ttSectionLabel);

    var ttList = document.createElement('div');
    ttList.className = 'theme-list';

    TT_THEMES.forEach(function (theme) {
      var btn = document.createElement('button');
      btn.className = 'settings-theme-btn settings-tt-btn';
      btn.dataset.ttTheme = theme.id;
      btn.setAttribute('aria-label', 'Apply ' + theme.label + ' timetable theme');

      var icon = document.createElement('span');
      icon.className = 'theme-swatch';
      icon.style.cssText = 'display:flex;align-items:center;justify-content:center;font-size:1.1rem;background:none;border:none;';
      icon.textContent = theme.icon;

      var label = document.createElement('span');
      label.textContent = theme.label;

      btn.appendChild(icon);
      btn.appendChild(label);
      btn.addEventListener('click', function () { applyTtTheme(theme.id); });
      ttList.appendChild(btn);
    });

    panelBody.appendChild(ttList);

    /* Random timetable theme button */
    var ttRandomBtn = document.createElement('button');
    ttRandomBtn.className = 'settings-tt-btn random-theme-btn';
    ttRandomBtn.dataset.ttTheme = 'random';
    ttRandomBtn.setAttribute('aria-label', 'Apply a random timetable theme');

    var diceIcon2 = document.createElement('span');
    diceIcon2.setAttribute('aria-hidden', 'true');
    diceIcon2.textContent = '\uD83C\uDFB2 '; // 🎲

    var ttRandomText = document.createElement('span');
    ttRandomText.textContent = 'Random Timetable Theme';

    ttRandomBtn.appendChild(diceIcon2);
    ttRandomBtn.appendChild(ttRandomText);
    ttRandomBtn.addEventListener('click', function () { applyTtTheme('random'); });
    panelBody.appendChild(ttRandomBtn);

    panel.appendChild(panelHeader);
    panel.appendChild(panelBody);

    document.body.appendChild(overlay);
    document.body.appendChild(panel);
  }

  function openPanel() {
    var panel = document.getElementById('settings-panel');
    var overlay = document.getElementById('settings-overlay');
    if (panel) panel.classList.add('open');
    if (overlay) overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    var current = document.documentElement.getAttribute('data-theme') || 'default';
    updateActiveButton(current);
    var currentTt = localStorage.getItem('ttTheme') || '';
    updateActiveTtButton(currentTt);
  }

  function closePanel() {
    var panel = document.getElementById('settings-panel');
    var overlay = document.getElementById('settings-overlay');
    if (panel) panel.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  /* Close panel on Escape key */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closePanel();
  });

  /* Apply saved theme immediately (before paint) */
  var savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  /* Build UI when DOM is ready */
  function initUI() {
    buildSettingsButton();
    buildSettingsPanel();
    var current = localStorage.getItem('theme') || 'default';
    updateActiveButton(current);
    var currentTt = localStorage.getItem('ttTheme') || '';
    updateActiveTtButton(currentTt);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI);
  } else {
    initUI();
  }
})();

/* ============================================================
   PART 2 — Subject Page
   ============================================================ */
/**
 * Handles the subject page (subject.html):
 *  - Reads the `subject` query parameter to determine which subject to show
 *  - Fetches the file list from config.js (SUBJECTS)
 *  - Supports both flat subjects (files[]) and sectioned subjects (sections[])
 *  - Sorts files numerically
 *  - Converts filenames to display names
 *  - Renders clickable PDF cards that open in a new tab
 *  - Provides a live search/filter bar across all sections
 */

(function () {
  /**
   * Extract the leading number from a filename segment for numeric sort.
   * "Chapter (10).pdf" → 10
   * "Appendix (2).pdf" → 2
   * "Answers.pdf"      → Infinity (sort to the end)
   */
  function extractSortKey(filename) {
    const match = filename.match(/\((\d+)\)/);
    if (match) return parseInt(match[1], 10);
    return Infinity; // Answers, etc. go at the end
  }

  /**
   * Sort files:
   *   1. "Chapter (N)" files come first, sorted numerically.
   *   2. All other files (Answers, Appendix, etc.) retain their original
   *      manifest order and are appended after the chapters.
   *      Within non-chapter numbered items (e.g. Appendix) the numeric
   *      order is preserved as well.
   */
  function sortFiles(files) {
    const chapters = [];
    const others   = [];
    files.forEach(f => (/^Chapter\s*\(/i.test(f) ? chapters : others).push(f));

    chapters.sort((a, b) => extractSortKey(a) - extractSortKey(b));

    // Within non-chapter groups, sort numerically within each prefix group
    // (e.g. Appendix (1) before Appendix (2)) while keeping different
    // prefix groups in their original manifest order.
    const groupOrder = [];
    const groups = {};
    others.forEach(f => {
      const prefix = f.replace(/\s*\(\d+\)\.pdf$/i, "").replace(/\.pdf$/i, "").trim();
      if (!groups[prefix]) {
        groups[prefix] = [];
        groupOrder.push(prefix);
      }
      groups[prefix].push(f);
    });
    groupOrder.forEach(prefix => groups[prefix].sort((a, b) => extractSortKey(a) - extractSortKey(b)));
    const sortedOthers = groupOrder.flatMap(prefix => groups[prefix]);

    return [...chapters, ...sortedOthers];
  }

  /**
   * Convert a filename to a human-readable display name.
   * "Chapter (1).pdf"       → "Chapter 1"
   * "Appendix (2).pdf"      → "Appendix 2"
   * "Answers.pdf"           → "Answers"
   * "Lekhan-Parichay.pdf"   → "Lekhan-Parichay"
   */
  function toDisplayName(filename) {
    return filename
      .replace(/\.pdf$/i, "")           // remove extension
      .replace(/\s*\((\d+)\)/, " $1");  // "(N)" → " N"
  }

  /** Escape HTML special characters to prevent XSS */
  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* ----------------------------------------------------------
     Bulk Open helpers (Part 2 — subject page)
     ---------------------------------------------------------- */

  /** Wire up the bulk-open bar on the subject page once the subject is known. */
  function initBulkOpen(subject) {
    const bar = document.getElementById("bulk-open-bar");
    if (!bar) return;
    const scopeSelect = document.getElementById("bulk-open-scope");
    const openBtn    = document.getElementById("bulk-open-btn");
    const statusEl   = document.getElementById("bulk-open-status");

    if (Array.isArray(subject.sections)) {
      const allOpt = document.createElement("option");
      allOpt.value = "";
      allOpt.textContent = "All Sections";
      scopeSelect.appendChild(allOpt);
      subject.sections.forEach(sec => {
        const opt = document.createElement("option");
        opt.value = sec.id;
        opt.textContent = sec.label;
        scopeSelect.appendChild(opt);
      });
    } else {
      // Flat subject — scope selector not needed
      scopeSelect.style.display = "none";
    }

    bar.removeAttribute("hidden");
    openBtn.addEventListener("click", () => {
      const sectionId = Array.isArray(subject.sections) ? (scopeSelect.value || null) : null;
      BULK_OPEN.openWithDelay(BULK_OPEN.getUrlsForSubject(subject, sectionId), statusEl);
    });
  }

  /**
   * Build file card HTML strings for a given list of files and folder.
   * Returns an array of anchor element strings.
   */
  function buildFileCards(files, folder, normalQuery) {
    const filtered = normalQuery
      ? files.filter(f => toDisplayName(f).toLowerCase().includes(normalQuery))
      : files;

    return filtered.map(filename => {
      const displayName = escapeHtml(toDisplayName(filename));
      const url = folder + "/" + encodeURIComponent(filename);
      return `<a class="file-card" href="${url}" data-pdf-url="${url}" data-pdf-title="${displayName}">
        <span class="pdf-icon">📄</span>
        <span class="file-name">${displayName}</span>
      </a>`;
    });
  }

  /**
   * Render the subject page for a flat subject (no sections).
   * Shows all files directly in #file-list.
   */
  function renderFlatSubject(subject, query) {
    const container = document.getElementById("file-list");
    if (!container) return;

    const sortedFiles = sortFiles(subject.files);
    const normalQuery = (query || "").trim().toLowerCase();
    const cards = buildFileCards(sortedFiles, subject.folder, normalQuery);

    if (cards.length === 0) {
      container.innerHTML = '<p class="no-results">No files match your search.</p>';
    } else {
      container.innerHTML = cards.join("");
    }

    const countEl = document.getElementById("file-count");
    if (countEl) {
      countEl.textContent = normalQuery
        ? `${cards.length} of ${sortedFiles.length} file(s)`
        : `${sortedFiles.length} file(s)`;
    }
  }

  /**
   * Render the subject page for a sectioned subject.
   * Each section gets its own heading + file grid.
   */
  function renderSectionedSubject(subject, query) {
    const container = document.getElementById("file-list");
    if (!container) return;

    const normalQuery = (query || "").trim().toLowerCase();
    let totalVisible = 0;
    let totalFiles = 0;

    const html = subject.sections.map(section => {
      const sortedFiles = sortFiles(section.files);
      totalFiles += sortedFiles.length;
      const cards = buildFileCards(sortedFiles, section.folder, normalQuery);
      totalVisible += cards.length;

      if (cards.length === 0) return "";   // hide section entirely when filtered out

      return `
        <div class="book-section">
          <h3 class="book-title">${escapeHtml(section.label)}</h3>
          <div class="file-grid">${cards.join("")}</div>
        </div>`;
    }).join("");

    container.innerHTML = html || '<p class="no-results">No files match your search.</p>';

    const countEl = document.getElementById("file-count");
    if (countEl) {
      countEl.textContent = normalQuery
        ? `${totalVisible} of ${totalFiles} file(s)`
        : `${totalFiles} file(s)`;
    }
  }

  /** Initialise the subject page */
  function initSubjectPage() {
    const params = new URLSearchParams(window.location.search);
    const subjectId = params.get("subject");

    const subject = (typeof SUBJECTS !== "undefined" ? SUBJECTS : []).find(
      s => s.id === subjectId
    );

    // Page title & heading
    const titleEl = document.getElementById("page-title");
    const headingEl = document.getElementById("subject-heading");
    const fileSection = document.getElementById("file-section");
    const statusEl = document.getElementById("status-msg");

    if (!subject) {
      if (titleEl) titleEl.textContent = "Subject Not Found";
      if (headingEl) headingEl.textContent = "Subject Not Found";
      if (statusEl) {
        statusEl.textContent =
          "The requested subject could not be found. Please go back to the homepage.";
        statusEl.removeAttribute("hidden");
      }
      if (fileSection) fileSection.setAttribute("hidden", "");
      return;
    }

    if (titleEl) titleEl.textContent = `${subject.label} — Study PDFs`;
    if (headingEl) headingEl.textContent = `${subject.icon} ${subject.label}`;

    if (statusEl) statusEl.setAttribute("hidden", "");
    if (fileSection) fileSection.removeAttribute("hidden");

    const isSectioned = Array.isArray(subject.sections);

    // For sectioned subjects the file-grid inside #file-section acts as the
    // outer container – replace it with a plain div that can hold book-sections.
    const fileListEl = document.getElementById("file-list");
    if (isSectioned && fileListEl) {
      // Remove the file-grid class so it doesn't apply the grid layout to
      // book-section wrappers; the inner grids keep it.
      fileListEl.classList.remove("file-grid");
      fileListEl.classList.add("sections-container");
    }

    function render(query) {
      if (isSectioned) {
        renderSectionedSubject(subject, query);
      } else {
        renderFlatSubject(subject, query);
      }
    }

    render("");

    // PDF viewer: intercept file-card clicks to open in-page viewer
    const fileContainer = document.getElementById("file-list");
    if (fileContainer) {
      fileContainer.addEventListener("click", function (e) {
        const card = e.target.closest("[data-pdf-url]");
        if (!card) return;
        e.preventDefault();
        if (typeof window.openPdfViewer === "function") {
          window.openPdfViewer(card.dataset.pdfUrl, card.dataset.pdfTitle);
        }
      });
    }

    // Bulk open bar
    initBulkOpen(subject);

    // Search bar
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        render(this.value);
      });
    }
  }

  // Run on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSubjectPage);
  } else {
    initSubjectPage();
  }
})();

/* ============================================================
   PART 3 — Home Page Bulk Open
   ============================================================ */
(function () {
  function initHomeBulkOpen() {
    var bar = document.getElementById("bulk-open-bar");
    if (!bar || typeof SUBJECTS === "undefined") return;

    var scopeSelect = document.getElementById("bulk-open-scope");
    var openBtn     = document.getElementById("bulk-open-btn");
    var statusEl    = document.getElementById("bulk-open-status");

    var allOpt = document.createElement("option");
    allOpt.value = "";
    allOpt.textContent = "All Subjects";
    scopeSelect.appendChild(allOpt);

    SUBJECTS.forEach(function (s) {
      var opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = s.icon + " " + s.label;
      scopeSelect.appendChild(opt);
    });

    openBtn.addEventListener("click", function () {
      var subjectId = scopeSelect.value;
      var filtered = subjectId
        ? SUBJECTS.filter(function (s) { return s.id === subjectId; })
        : SUBJECTS;
      var urls = [];
      filtered.forEach(function (s) {
        urls = urls.concat(BULK_OPEN.getUrlsForSubject(s, null));
      });
      BULK_OPEN.openWithDelay(urls, statusEl);
    });
  }

  /* Only runs on index.html (subjects-grid is absent on subject.html) */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      if (document.getElementById("subjects-grid")) {
        initHomeBulkOpen();
      }
    });
  } else {
    if (document.getElementById("subjects-grid")) {
      initHomeBulkOpen();
    }
  }
})();

/* ============================================================
   PART 4 — Timetable Page
   ============================================================ */
(function () {
  /**
   * Parse a time string like "8:00" or "1:10" into minutes since midnight.
   * School periods run from 8:00 AM to 1:10 PM.
   * Hours < 7 are assumed to be PM (e.g. "1:10" → 13:10).
   * All period times should stay in the range 7:00–23:59 to avoid ambiguity.
   * Returns NaN if the format is invalid.
   */
  function parseTimeToMinutes(timeStr) {
    var parts = (timeStr || '').trim().split(':');
    if (parts.length !== 2) return NaN;
    var h = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m) || m < 0 || m > 59) return NaN;
    if (h < 7) h += 12; // 1:10 → 13:10 PM
    return h * 60 + m;
  }

  /** Return the index of the period currently active, or -1 if none. */
  function getCurrentPeriodIndex(periods) {
    var now = new Date();
    var nowMins = now.getHours() * 60 + now.getMinutes();
    for (var i = 0; i < periods.length; i++) {
      var range = periods[i].time.split('-');
      if (range.length < 2) continue;
      var start = parseTimeToMinutes(range[0]);
      var end   = parseTimeToMinutes(range[1]);
      if (isNaN(start) || isNaN(end)) continue;
      if (nowMins >= start && nowMins < end) return i;
    }
    return -1;
  }

  /** Return the 0-based day-of-week index in the days array, or -1 if today is not listed. */
  function getTodayIndex(days) {
    var NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var todayName = NAMES[new Date().getDay()];
    return days.indexOf(todayName);
  }

  /**
   * Shorten known long subject names and set a title attribute for the full name.
   * @param {HTMLElement} el   - The table cell element to populate.
   * @param {string}      name - The raw subject name from the schedule data.
   */
  function abbreviateSubject(el, name) {
    var MAX_SUBJECT_LENGTH = 16;
    if (!name) return;
    var normalized = name.replace(/\s+/g, ' ').trim();
    var abbrevMap = {
      'Chemistry/ Physics Practical': 'Chem/Phys Prac',
      'Chemistry/Physics Practical':  'Chem/Phys Prac',
      'Biology/   Chemistry Practical': 'Bio/Chem Prac',
      'Biology/ Chemistry Practical':  'Bio/Chem Prac',
      'Biology/Chemistry Practical':   'Bio/Chem Prac'
    };
    var short = abbrevMap[normalized] || abbrevMap[name];
    if (short) {
      el.textContent = short;
      el.title = normalized;
    } else if (normalized.length > MAX_SUBJECT_LENGTH) {
      el.textContent = normalized;
      el.title = normalized;
    } else {
      el.textContent = normalized;
    }
  }

  /** Build and inject the timetable into #tt-container. */
  function renderTimetable(data) {
    var days    = data.days    || [];
    var periods = data.periods || [];
    var schedule = data.schedule || {};

    var currentPeriod = getCurrentPeriodIndex(periods);
    var todayIdx      = getTodayIndex(days);

    // Wrapper + meta
    var container = document.getElementById('tt-container');
    if (!container) return;

    // Meta line showing current day/period info
    var meta = document.createElement('p');
    meta.className = 'tt-meta';
    if (currentPeriod !== -1) {
      var p = periods[currentPeriod];
      meta.textContent = 'Now: ' + p.name + ' (' + p.time + ')';
    } else {
      var now2 = new Date();
      var h2 = now2.getHours(), m2 = now2.getMinutes();
      meta.textContent = 'Current time: ' + h2 + ':' + (m2 < 10 ? '0' : '') + m2 + ' — No active period';
    }
    container.appendChild(meta);

    // Scroll wrapper for horizontal overflow on mobile
    var scroll = document.createElement('div');
    scroll.className = 'tt-scroll';

    // Table
    var table = document.createElement('table');
    table.className = 'tt-table';
    table.setAttribute('role', 'grid');
    table.setAttribute('aria-label', 'Timetable');

    // Build a map: period index → schedule array index (Break/Lunch map to -1)
    var periodScheduleIdx = [];
    var si = 0;
    periods.forEach(function (period) {
      if (period.name === 'Break' || period.name === 'Lunch') {
        periodScheduleIdx.push(-1);
      } else {
        periodScheduleIdx.push(si);
        si++;
      }
    });

    // --- <thead> ---
    // Header row: first column "Day", then one column per period
    var thead = document.createElement('thead');
    var headRow = document.createElement('tr');

    var thDay = document.createElement('th');
    thDay.className = 'tt-day-col';
    thDay.scope = 'col';
    thDay.textContent = 'Day';
    headRow.appendChild(thDay);

    periods.forEach(function (period, pi) {
      var th = document.createElement('th');
      th.scope = 'col';
      if (pi === currentPeriod) th.classList.add('tt-current');

      var nameSpan = document.createElement('span');
      nameSpan.className = 'tt-period-name';
      nameSpan.textContent = period.name;

      var timeSpan = document.createElement('span');
      timeSpan.className = 'tt-period-time';
      timeSpan.textContent = period.time;

      if (pi === currentPeriod) {
        var badge = document.createElement('span');
        badge.className = 'tt-now-badge';
        badge.textContent = 'NOW';
        nameSpan.appendChild(badge);
      }

      th.appendChild(nameSpan);
      th.appendChild(timeSpan);
      headRow.appendChild(th);
    });

    thead.appendChild(headRow);
    table.appendChild(thead);

    // --- <tbody> ---
    // One row per day; first cell = day name, remaining cells = subjects per period
    var tbody = document.createElement('tbody');

    days.forEach(function (day, di) {
      var isToday = (di === todayIdx);

      var tr = document.createElement('tr');
      if (isToday) tr.classList.add('tt-today');

      // Day label cell (row header for accessibility)
      var tdLabel = document.createElement('th');
      tdLabel.className = 'tt-day-col';
      tdLabel.scope = 'row';
      if (isToday) tdLabel.classList.add('tt-today');
      tdLabel.textContent = day;
      tr.appendChild(tdLabel);

      // Subject cells per period
      periods.forEach(function (period, pi) {
        var isBreakOrLunch = (period.name === 'Break' || period.name === 'Lunch');
        var isCurrent = (pi === currentPeriod);

        var td = document.createElement('td');
        if (isBreakOrLunch) td.classList.add('tt-row-break');
        if (isCurrent)      td.classList.add('tt-current');
        if (isToday)        td.classList.add('tt-today');

        if (!isBreakOrLunch) {
          var subjects = schedule[day];
          var schedIdx = periodScheduleIdx[pi];
          var subj = (subjects && schedIdx !== -1 && subjects[schedIdx]) ? subjects[schedIdx] : '';
          abbreviateSubject(td, subj);
        }
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    scroll.appendChild(table);
    container.appendChild(scroll);

    // Scroll current period's column header into view on mobile (horizontal)
    if (currentPeriod !== -1) {
      var currentTh = thead.querySelector('th.tt-current');
      if (currentTh) {
        setTimeout(function () { currentTh.scrollIntoView({ inline: 'nearest', block: 'nearest' }); }, 100);
      }
    }
  }

  /** Initialise the timetable page */
  function initTimetablePage() {
    var container = document.getElementById('tt-container');
    var statusEl  = document.getElementById('tt-status');
    if (!container) return; // not on timetable.html

    fetch('timetable.json')
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (statusEl) statusEl.setAttribute('hidden', '');
        container.removeAttribute('hidden');
        renderTimetable(data);
      })
      .catch(function (err) {
        if (statusEl) {
          statusEl.textContent = 'Could not load timetable.json: ' + err.message;
          statusEl.removeAttribute('hidden');
        }
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTimetablePage);
  } else {
    initTimetablePage();
  }
})();

/* ============================================================
   PART 5 — PDF Viewer & AI Chat
   ============================================================ */
(function () {
  var APPWRITE_ENDPOINT = "https://69d102ed003cf7a02ff8.sgp.appwrite.run/"; // Replace with your Appwrite function URL
  var PDFJS_VERSION     = "3.11.174";
  var PDFJS_CDN         = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/" + PDFJS_VERSION + "/pdf.min.js";
  var PDFJS_WORKER      = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/" + PDFJS_VERSION + "/pdf.worker.min.js";
  var PDFJS_TEXT_CSS    = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/" + PDFJS_VERSION + "/pdf_viewer.min.css";
  var FETCH_TIMEOUT_MS  = 30000;
  var THUMB_SCALE       = 0.2;
  var ZOOM_MIN          = 0.25;
  var ZOOM_MAX          = 4.0;
  var ZOOM_STEPS        = [0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1.0, 1.1, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0, 4.0];
  var CANVAS_H_PAD      = 48;   // total horizontal padding inside the canvas wrap
  var PDF_DEFAULT_WIDTH = 800;

  var pdfJsReady   = false;
  var pdfJsLoading = false;
  var pdfJsQueue   = [];

  var currentPdfUrl  = null;
  var currentPdfDoc  = null;
  var currentPage    = 1;
  var totalPages     = 0;
  var currentScale   = null;  /* null = auto fit-width */
  var displayScale   = 1.0;   /* scale used in the last render, for zoom display */
  var rotationDeg    = 0;
  var twoPageView    = false;
  var thumbnailsOpen = false;
  var chatOpen       = false;
  var chatMsgCounter = 0;

  /* ---- Lazy-load PDF.js from CDN ---- */
  function withPdfJs(cb) {
    if (pdfJsReady) { cb(); return; }
    pdfJsQueue.push(cb);
    if (pdfJsLoading) return;
    pdfJsLoading = true;
    if (!document.getElementById("pdfjs-text-layer-css")) {
      var link = document.createElement("link");
      link.id   = "pdfjs-text-layer-css";
      link.rel  = "stylesheet";
      link.href = PDFJS_TEXT_CSS;
      document.head.appendChild(link);
    }
    var s = document.createElement("script");
    s.src = PDFJS_CDN;
    s.onload = function () {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
      pdfJsReady   = true;
      pdfJsLoading = false;
      var q = pdfJsQueue.slice();
      pdfJsQueue   = [];
      q.forEach(function (fn) { fn(); });
    };
    s.onerror = function () {
      pdfJsLoading = false;
      pdfJsQueue   = [];
      alert("Failed to load PDF viewer library. Please try again.");
    };
    document.head.appendChild(s);
  }

  /* ---- Toolbar helpers ---- */
  function makeTbBtn(extraClass, ariaLabel, text, onClick) {
    var btn = document.createElement("button");
    btn.className   = "pdf-tb-btn" + (extraClass ? " " + extraClass : "");
    btn.setAttribute("aria-label", ariaLabel);
    btn.title       = ariaLabel;
    btn.textContent = text;
    if (onClick) btn.addEventListener("click", onClick);
    return btn;
  }

  function makeSep() {
    var s = document.createElement("span");
    s.className = "pdf-tb-sep";
    s.setAttribute("aria-hidden", "true");
    return s;
  }

  /* ---- Build viewer DOM (injected once) ---- */
  function buildViewerDom() {
    var overlay = document.createElement("div");
    overlay.id        = "pdf-viewer-overlay";
    overlay.className = "pdf-viewer-overlay";

    var container = document.createElement("div");
    container.className = "pdf-viewer-container";

    /* === TOOLBAR === */
    var toolbar = document.createElement("div");
    toolbar.className = "pdf-viewer-toolbar";

    /* Thumbnail toggle */
    var thumbBtn = makeTbBtn("pdf-tb-thumb-btn", "Toggle thumbnails", "\u2630", function () {
      thumbnailsOpen = !thumbnailsOpen;
      thumbBtn.classList.toggle("active", thumbnailsOpen);
      var sb = document.getElementById("pdf-thumbnail-sidebar");
      if (sb) sb.classList.toggle("open", thumbnailsOpen);
    });
    toolbar.appendChild(thumbBtn);

    /* Page number input + total */
    var pageWrap = document.createElement("div");
    pageWrap.className = "pdf-tb-page-wrap";

    var pageInput = document.createElement("input");
    pageInput.type      = "text";
    pageInput.id        = "pdf-page-input";
    pageInput.className = "pdf-tb-input pdf-tb-page-input";
    pageInput.setAttribute("aria-label", "Current page number");
    pageInput.value     = "1";
    pageInput.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      var n = parseInt(pageInput.value, 10);
      if (!isNaN(n) && n >= 1 && n <= totalPages) {
        scrollToPage(n);
      } else {
        pageInput.value = currentPage;
      }
    });

    var pageTotalEl = document.createElement("span");
    pageTotalEl.id        = "pdf-page-total";
    pageTotalEl.className = "pdf-tb-page-total";
    pageTotalEl.textContent = "/ 0";

    pageWrap.appendChild(pageInput);
    pageWrap.appendChild(pageTotalEl);
    toolbar.appendChild(pageWrap);
    toolbar.appendChild(makeSep());

    /* Zoom out */
    toolbar.appendChild(makeTbBtn("", "Zoom out", "\u2212", function () { zoomStep(-1); }));

    /* Zoom percentage input */
    var zoomInput = document.createElement("input");
    zoomInput.type      = "text";
    zoomInput.id        = "pdf-zoom-input";
    zoomInput.className = "pdf-tb-input pdf-tb-zoom-input";
    zoomInput.setAttribute("aria-label", "Zoom level");
    zoomInput.value     = "100%";
    zoomInput.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      var pct = parseFloat(zoomInput.value.replace("%", "").trim());
      if (!isNaN(pct)) {
        applyZoom(pct / 100);
      } else {
        updateZoomDisplay();
      }
    });
    toolbar.appendChild(zoomInput);

    /* Zoom in */
    toolbar.appendChild(makeTbBtn("", "Zoom in", "+", function () { zoomStep(1); }));
    toolbar.appendChild(makeSep());

    /* Fit to page */
    toolbar.appendChild(makeTbBtn("", "Fit to page", "\u229f", fitToPage));

    /* Fit to width */
    toolbar.appendChild(makeTbBtn("", "Fit to width", "\u2194", fitToWidth));
    toolbar.appendChild(makeSep());

    /* Rotate counterclockwise */
    toolbar.appendChild(makeTbBtn("", "Rotate counterclockwise", "\u21ba", function () {
      rotationDeg = (rotationDeg + 270) % 360;
      renderAllPages();
    }));
    toolbar.appendChild(makeSep());

    /* Two-page view toggle */
    var twoPageBtn = makeTbBtn("pdf-tb-twopage-btn", "Toggle two-page view", "\u25af\u25af", function () {
      twoPageView = !twoPageView;
      twoPageBtn.classList.toggle("active", twoPageView);
      renderAllPages();
    });
    toolbar.appendChild(twoPageBtn);
    toolbar.appendChild(makeSep());

    /* Download */
    toolbar.appendChild(makeTbBtn("", "Download PDF", "\u2193", downloadPdf));
    toolbar.appendChild(makeSep());

    /* Spacer — pushes close button to the far right */
    var spacer = document.createElement("span");
    spacer.className = "pdf-tb-spacer";
    toolbar.appendChild(spacer);

    /* Close */
    toolbar.appendChild(makeTbBtn("pdf-viewer-close-btn", "Close viewer", "\u2715", closeViewer));

    /* === BODY (thumbnail sidebar + canvas wrap) === */
    var body = document.createElement("div");
    body.className = "pdf-viewer-body";

    /* Thumbnail sidebar */
    var sidebar = document.createElement("div");
    sidebar.id        = "pdf-thumbnail-sidebar";
    sidebar.className = "pdf-thumbnail-sidebar";
    body.appendChild(sidebar);

    /* Canvas wrap */
    var canvasWrap = document.createElement("div");
    canvasWrap.id        = "pdf-canvas-wrap";
    canvasWrap.className = "pdf-canvas-wrap";

    /* Scroll → update page indicator and thumbnail highlight */
    canvasWrap.addEventListener("scroll", function () {
      var wrappers = canvasWrap.querySelectorAll(".pdf-page-wrapper");
      if (!wrappers.length) return;
      var wrapRect = canvasWrap.getBoundingClientRect();
      var midY     = wrapRect.top + canvasWrap.clientHeight / 2;
      var closest  = null;
      var closestD = Infinity;
      for (var i = 0; i < wrappers.length; i++) {
        var r    = wrappers[i].getBoundingClientRect();
        var dist = Math.abs((r.top + r.height / 2) - midY);
        if (dist < closestD) { closestD = dist; closest = wrappers[i]; }
      }
      if (closest) {
        var pg = parseInt(closest.dataset.page, 10);
        if (pg !== currentPage) {
          currentPage = pg;
          updatePageIndicator();
          updateThumbnailHighlight();
        }
      }
    });

    /* Ctrl+scroll → zoom in/out */
    canvasWrap.addEventListener("wheel", function (e) {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        zoomStep(e.deltaY < 0 ? 1 : -1);
      }
    }, { passive: false });

    body.appendChild(canvasWrap);
    container.appendChild(toolbar);
    container.appendChild(body);
    overlay.appendChild(container);

    /* === Floating AI button (FAB) === */
    var askAiFab = document.createElement("button");
    askAiFab.id        = "pdf-ask-ai-fab";
    askAiFab.className = "pdf-ask-ai-fab";
    askAiFab.setAttribute("aria-label", "Ask AI about this PDF");
    askAiFab.textContent = "\uD83E\uDD16"; // 🤖
    askAiFab.addEventListener("click", toggleChat);
    overlay.appendChild(askAiFab);

    /* === Chat panel === */
    var chatPanel = document.createElement("div");
    chatPanel.id        = "pdf-chat-panel";
    chatPanel.className = "pdf-chat-panel";

    var chatHeader = document.createElement("div");
    chatHeader.className = "pdf-chat-header";

    var chatTitle = document.createElement("span");
    chatTitle.className = "pdf-chat-title";
    chatTitle.textContent = "\uD83E\uDD16 Ask AI"; // 🤖

    var chatCloseBtn = document.createElement("button");
    chatCloseBtn.className = "pdf-chat-close-btn";
    chatCloseBtn.setAttribute("aria-label", "Close chat");
    chatCloseBtn.textContent = "\u2715"; // ✕
    chatCloseBtn.addEventListener("click", toggleChat);

    chatHeader.appendChild(chatTitle);
    chatHeader.appendChild(chatCloseBtn);

    var chatMessages = document.createElement("div");
    chatMessages.id        = "pdf-chat-messages";
    chatMessages.className = "pdf-chat-messages";

    var chatInputArea = document.createElement("div");
    chatInputArea.className = "pdf-chat-input-area";

    var chatTextarea = document.createElement("textarea");
    chatTextarea.id          = "pdf-chat-input";
    chatTextarea.className   = "pdf-chat-input";
    chatTextarea.placeholder = "Ask a question about this PDF\u2026";
    chatTextarea.rows        = 2;
    chatTextarea.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        doSendQuestion();
      }
    });

    var sendBtn = document.createElement("button");
    sendBtn.id        = "pdf-chat-send-btn";
    sendBtn.className = "pdf-chat-send-btn";
    sendBtn.innerHTML = "&#8593;"; // ↑ arrow
    sendBtn.addEventListener("click", doSendQuestion);

    chatInputArea.appendChild(chatTextarea);
    chatInputArea.appendChild(sendBtn);

    chatPanel.appendChild(chatHeader);
    chatPanel.appendChild(chatMessages);
    chatPanel.appendChild(chatInputArea);

    /* Resize handles */
    var chatResizeLeft = document.createElement("div");
    chatResizeLeft.className = "pdf-chat-resize-left";
    var chatResizeTop = document.createElement("div");
    chatResizeTop.className = "pdf-chat-resize-top";
    chatPanel.appendChild(chatResizeLeft);
    chatPanel.appendChild(chatResizeTop);

    /* Restore saved panel size from localStorage */
    (function () {
      var CHAT_MIN_W = 280, CHAT_MAX_W = 600, CHAT_MIN_H = 300;
      var savedW = parseInt(localStorage.getItem("pdfChatWidth"), 10);
      var savedH = parseInt(localStorage.getItem("pdfChatHeight"), 10);
      if (savedW >= CHAT_MIN_W && savedW <= CHAT_MAX_W) {
        chatPanel.style.width = savedW + "px";
      }
      if (savedH >= CHAT_MIN_H && savedH <= Math.floor(window.innerHeight * 0.9)) {
        chatPanel.style.top    = "auto";
        chatPanel.style.height = savedH + "px";
      }

      /* Left-edge drag → resize width */
      chatResizeLeft.addEventListener("mousedown", function (e) {
        e.preventDefault();
        var startX = e.clientX;
        var startW = chatPanel.offsetWidth;
        function onMove(ev) {
          var newW = Math.min(CHAT_MAX_W, Math.max(CHAT_MIN_W, startW + (startX - ev.clientX)));
          chatPanel.style.width = newW + "px";
          localStorage.setItem("pdfChatWidth", newW);
        }
        function onUp() {
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
        }
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
      });

      /* Top-edge drag → resize height */
      chatResizeTop.addEventListener("mousedown", function (e) {
        e.preventDefault();
        var startY = e.clientY;
        var startH = chatPanel.offsetHeight;
        function onMove(ev) {
          var maxH = Math.floor(window.innerHeight * 0.9);
          var newH = Math.min(maxH, Math.max(CHAT_MIN_H, startH + (startY - ev.clientY)));
          chatPanel.style.top    = "auto";
          chatPanel.style.height = newH + "px";
          localStorage.setItem("pdfChatHeight", newH);
        }
        function onUp() {
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
        }
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
      });
    })();

    overlay.appendChild(chatPanel);
    document.body.appendChild(overlay);
  }

  /* ---- Zoom helpers ---- */
  function computeFitWidthScale(baseViewport) {
    var wrap   = document.getElementById("pdf-canvas-wrap");
    var avail  = wrap ? Math.max(1, wrap.clientWidth - CANVAS_H_PAD) : PDF_DEFAULT_WIDTH;
    return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, (avail / baseViewport.width) * 0.95));
  }

  function computeFitPageScale(baseViewport) {
    var wrap   = document.getElementById("pdf-canvas-wrap");
    var availW = wrap ? Math.max(1, wrap.clientWidth  - CANVAS_H_PAD) : PDF_DEFAULT_WIDTH;
    var availH = wrap ? Math.max(1, wrap.clientHeight - 48) : 600;
    return Math.max(ZOOM_MIN, Math.min(ZOOM_MAX,
      Math.min(availW / baseViewport.width, availH / baseViewport.height) * 0.95));
  }

  function applyZoom(scale) {
    currentScale = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, scale));
    renderAllPages();
  }

  function zoomStep(dir) {
    var eff = (currentScale !== null) ? currentScale : displayScale;
    if (dir > 0) {
      for (var i = 0; i < ZOOM_STEPS.length; i++) {
        if (ZOOM_STEPS[i] > eff + 0.005) { applyZoom(ZOOM_STEPS[i]); return; }
      }
      applyZoom(ZOOM_MAX);
    } else {
      for (var i = ZOOM_STEPS.length - 1; i >= 0; i--) {
        if (ZOOM_STEPS[i] < eff - 0.005) { applyZoom(ZOOM_STEPS[i]); return; }
      }
      applyZoom(ZOOM_MIN);
    }
  }

  function fitToWidth() {
    currentScale = null; /* will be recomputed on next render */
    renderAllPages();
  }

  function fitToPage() {
    if (!currentPdfDoc) return;
    currentPdfDoc.getPage(1).then(function (page) {
      var base = page.getViewport({ scale: 1, rotation: rotationDeg });
      applyZoom(computeFitPageScale(base));
    });
  }

  function updateZoomDisplay() {
    var el = document.getElementById("pdf-zoom-input");
    if (el) el.value = Math.round(displayScale * 100) + "%";
  }

  /* ---- Page helpers ---- */
  function scrollToPage(n) {
    var wrap = document.getElementById("pdf-canvas-wrap");
    if (!wrap) return;
    var target = wrap.querySelector(".pdf-page-wrapper[data-page='" + n + "']");
    if (!target) return;
    target.scrollIntoView({ block: "start", behavior: "smooth" });
    currentPage = n;
    updatePageIndicator();
    updateThumbnailHighlight();
  }

  /* ---- Download ---- */
  function downloadPdf() {
    if (!currentPdfUrl) return;
    var a = document.createElement("a");
    try {
      a.href = new URL(currentPdfUrl, window.location.href).href;
    } catch (e) {
      a.href = currentPdfUrl;
    }
    a.download      = "";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { if (a.parentNode) a.parentNode.removeChild(a); }, 1000);
  }

  /* ---- Open the viewer ---- */
  function openViewer(pdfUrl, title) {
    currentPdfUrl  = pdfUrl;
    currentPage    = 1;
    totalPages     = 0;
    currentScale   = null; /* reset to auto fit-width on each open */
    rotationDeg    = 0;
    twoPageView    = false;
    thumbnailsOpen = false;
    chatOpen       = false;

    var overlay    = document.getElementById("pdf-viewer-overlay");
    var chatPanel  = document.getElementById("pdf-chat-panel");
    var messages   = document.getElementById("pdf-chat-messages");
    var sidebar    = document.getElementById("pdf-thumbnail-sidebar");
    var twoPageBtn = overlay ? overlay.querySelector(".pdf-tb-twopage-btn") : null;
    var thumbBtn2  = overlay ? overlay.querySelector(".pdf-tb-thumb-btn")   : null;

    if (chatPanel)  chatPanel.classList.remove("open");
    if (messages)   messages.innerHTML = "";
    if (sidebar)  { sidebar.classList.remove("open"); sidebar.innerHTML = ""; }
    if (twoPageBtn) twoPageBtn.classList.remove("active");
    if (thumbBtn2)  thumbBtn2.classList.remove("active");

    updatePageIndicator();

    var canvasWrap = document.getElementById("pdf-canvas-wrap");
    if (canvasWrap) canvasWrap.innerHTML = "";

    if (overlay) overlay.classList.add("open");
    document.body.style.overflow = "hidden";

    withPdfJs(function () { loadPdf(pdfUrl); });
  }

  /* ---- Close the viewer ---- */
  function closeViewer() {
    var overlay = document.getElementById("pdf-viewer-overlay");
    if (overlay) overlay.classList.remove("open");
    document.body.style.overflow = "";

    if (currentPdfDoc) {
      currentPdfDoc.destroy();
      currentPdfDoc = null;
    }
    currentPdfUrl = null;
    chatOpen      = false;
  }

  /* ---- Load a PDF via PDF.js ---- */
  function loadPdf(url) {
    var absUrl;
    try {
      absUrl = new URL(url, window.location.href).href;
    } catch (e) {
      showCanvasError("Invalid PDF URL. Cannot open this file.");
      return;
    }
    var loadingTask = window.pdfjsLib.getDocument(absUrl);
    loadingTask.promise.then(function (pdfDoc) {
      currentPdfDoc = pdfDoc;
      totalPages    = pdfDoc.numPages;
      updatePageIndicator();
      renderAllPages();
    }).catch(function (err) {
      console.error("PDF load error:", err);
      showCanvasError("Failed to load PDF. Please try again.");
    });
  }

  /* ---- Render all pages sequentially with text layers ---- */
  function renderAllPages() {
    if (!currentPdfDoc) return;
    var wrap = document.getElementById("pdf-canvas-wrap");
    if (!wrap) return;
    wrap.innerHTML = "";

    var loadingEl = document.createElement("p");
    loadingEl.className   = "pdf-loading-indicator";
    loadingEl.textContent = "Loading pages\u2026 (0\u202f/\u202f" + totalPages + ")";
    wrap.appendChild(loadingEl);

    var pageNum    = 0;
    var pdfDoc     = currentPdfDoc; // capture to detect stale renders
    var scaleToUse = null;          // determined once from the first page

    function renderNext() {
      if (pdfDoc !== currentPdfDoc) return; // viewer was closed/reopened
      pageNum++;

      if (pageNum > totalPages) {
        if (loadingEl.parentNode) loadingEl.parentNode.removeChild(loadingEl);
        currentPage = 1;
        updatePageIndicator();
        renderThumbnails();
        return;
      }

      loadingEl.textContent = "Loading pages\u2026 (" + pageNum + "\u202f/\u202f" + totalPages + ")";

      var capturedPage = pageNum;
      pdfDoc.getPage(capturedPage).then(function (page) {
        if (pdfDoc !== currentPdfDoc) return;

        var baseViewport = page.getViewport({ scale: 1, rotation: rotationDeg });

        /* Determine scale once from the first page */
        if (scaleToUse === null) {
          if (currentScale !== null) {
            scaleToUse = currentScale;
          } else {
            /* auto fit-width; in two-page mode each page occupies roughly half */
            var wrapW = Math.max(1, wrap.clientWidth - CANVAS_H_PAD);
            if (twoPageView) {
              scaleToUse = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX,
                ((wrapW / 2) - 12) / baseViewport.width * 0.95));
            } else {
              scaleToUse = computeFitWidthScale(baseViewport);
            }
          }
          displayScale = scaleToUse;
          updateZoomDisplay();
        }

        var viewport     = page.getViewport({ scale: scaleToUse, rotation: rotationDeg });
        var pageWrapper  = document.createElement("div");
        pageWrapper.className    = "pdf-page-wrapper";
        pageWrapper.dataset.page = capturedPage;

        var canvas = document.createElement("canvas");
        canvas.className    = "pdf-page-canvas";
        canvas.width        = viewport.width;
        canvas.height       = viewport.height;
        canvas.style.width  = viewport.width  + "px";
        canvas.style.height = viewport.height + "px";

        var textLayerDiv = document.createElement("div");
        textLayerDiv.className    = "textLayer";
        textLayerDiv.style.width  = viewport.width  + "px";
        textLayerDiv.style.height = viewport.height + "px";

        pageWrapper.appendChild(canvas);
        pageWrapper.appendChild(textLayerDiv);

        /* Insert into layout — single column or two-page pairs */
        if (twoPageView) {
          if (capturedPage === 1) {
            /* Page 1 stands alone in its own centred row */
            var row1 = document.createElement("div");
            row1.className = "pdf-pair-row pdf-pair-row--single";
            row1.appendChild(pageWrapper);
            wrap.insertBefore(row1, loadingEl);
          } else if (capturedPage % 2 === 0) {
            /* Even page: start a new pair row */
            var pairRow = document.createElement("div");
            pairRow.className = "pdf-pair-row";
            pairRow.appendChild(pageWrapper);
            wrap.insertBefore(pairRow, loadingEl);
          } else {
            /* Odd page (≥3): append to the last pair row */
            var rows    = wrap.querySelectorAll(".pdf-pair-row");
            var lastRow = rows[rows.length - 1];
            if (lastRow) {
              lastRow.appendChild(pageWrapper);
            } else {
              wrap.insertBefore(pageWrapper, loadingEl);
            }
          }
        } else {
          wrap.insertBefore(pageWrapper, loadingEl);
        }

        /* Render canvas and text layer */
        var ctx = canvas.getContext("2d");
        page.render({ canvasContext: ctx, viewport: viewport }).promise
          .then(function () { return page.getTextContent(); })
          .then(function (textContent) {
            if (pdfDoc !== currentPdfDoc) return;
            // Clear any previous content before (re-)rendering.
            textLayerDiv.innerHTML = "";
            window.pdfjsLib.renderTextLayer({
              textContentSource: textContent,
              container:         textLayerDiv,
              viewport:          viewport,
              textDivs:          []
            });
            renderNext();
          })
          .catch(function (err) {
            if (err && err.name !== "RenderingCancelledException") {
              console.error("Render error page " + capturedPage + ":", err);
            }
            renderNext();
          });
      }).catch(function (err) {
        console.error("getPage error page " + capturedPage + ":", err);
        renderNext();
      });
    }

    renderNext();
  }

  /* ---- Thumbnail sidebar ---- */
  function renderThumbnails() {
    var sidebar = document.getElementById("pdf-thumbnail-sidebar");
    if (!sidebar || !currentPdfDoc) return;
    sidebar.innerHTML = "";
    var pdfDoc = currentPdfDoc;

    for (var p = 1; p <= totalPages; p++) {
      (function (pageNum) {
        var thumbEl = document.createElement("div");
        thumbEl.className    = "pdf-thumb";
        thumbEl.dataset.page = pageNum;
        if (pageNum === currentPage) thumbEl.classList.add("active");

        var canvas = document.createElement("canvas");
        canvas.className = "pdf-thumb-canvas";

        var label = document.createElement("span");
        label.className   = "pdf-thumb-label";
        label.textContent = pageNum;

        thumbEl.appendChild(canvas);
        thumbEl.appendChild(label);
        sidebar.appendChild(thumbEl);

        thumbEl.addEventListener("click", function () { scrollToPage(pageNum); });

        pdfDoc.getPage(pageNum).then(function (page) {
          if (pdfDoc !== currentPdfDoc) return;
          var vp = page.getViewport({ scale: THUMB_SCALE, rotation: rotationDeg });
          canvas.width        = vp.width;
          canvas.height       = vp.height;
          canvas.style.width  = vp.width  + "px";
          canvas.style.height = vp.height + "px";
          page.render({ canvasContext: canvas.getContext("2d"), viewport: vp });
        });
      })(p);
    }
  }

  function updateThumbnailHighlight() {
    var sidebar = document.getElementById("pdf-thumbnail-sidebar");
    if (!sidebar) return;
    var thumbs = sidebar.querySelectorAll(".pdf-thumb");
    for (var i = 0; i < thumbs.length; i++) {
      thumbs[i].classList.toggle("active",
        parseInt(thumbs[i].dataset.page, 10) === currentPage);
    }
  }

  /* ---- Page indicator ---- */
  function updatePageIndicator() {
    var pageInput = document.getElementById("pdf-page-input");
    var totalEl   = document.getElementById("pdf-page-total");
    if (pageInput) pageInput.value     = currentPage;
    if (totalEl)   totalEl.textContent = "/ " + (totalPages || 0);
  }

  function showCanvasError(msg) {
    var wrap = document.getElementById("pdf-canvas-wrap");
    if (!wrap) return;
    wrap.innerHTML = "";
    var p = document.createElement("p");
    p.className   = "pdf-load-error";
    p.textContent = msg;
    wrap.appendChild(p);
  }

  /* ---- Chat panel ---- */
  function toggleChat() {
    var panel = document.getElementById("pdf-chat-panel");
    if (!panel) return;
    chatOpen = !chatOpen;
    panel.classList.toggle("open", chatOpen);
    if (chatOpen) {
      var input = document.getElementById("pdf-chat-input");
      if (input) input.focus();
    }
  }

  function doSendQuestion() {
    var inputEl = document.getElementById("pdf-chat-input");
    var sendBtn = document.getElementById("pdf-chat-send-btn");
    if (!inputEl) return;
    var question = inputEl.value.trim();
    if (!question) return;

    appendChatMsg("user", question);
    inputEl.value    = "";
    inputEl.disabled = true;
    if (sendBtn) sendBtn.disabled = true;

    var pdfUrl = "";
    try {
      if (currentPdfUrl) pdfUrl = new URL(currentPdfUrl, window.location.href).href;
    } catch (e) { /* keep empty string */ }

    var loadingId = appendChatMsg("ai", "\u2026"); // …

    var controller = new AbortController();
    var timeoutId  = setTimeout(function () { controller.abort(); }, FETCH_TIMEOUT_MS);

    fetch(APPWRITE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: question, pdfUrl: pdfUrl }),
      signal: controller.signal
    })
    .then(function (res) {
      if (!res.ok) throw new Error("Server error: " + res.status);
      return res.json();
    })
    .then(function (data) {
      // Accepts { answer: "..." } or { response: "..." } from the Appwrite function
      updateChatMsg(loadingId, data.answer || data.response || JSON.stringify(data));
    })
    .catch(function (err) {
      var msg = err.name === "AbortError"
        ? "Request timed out. Please try again."
        : "Error: " + err.message;
      updateChatMsg(loadingId, msg);
    })
    .finally(function () {
      clearTimeout(timeoutId);
      if (inputEl) inputEl.disabled = false;
      if (sendBtn) sendBtn.disabled = false;
      if (inputEl) inputEl.focus();
    });
  }

  function appendChatMsg(role, text) {
    var messages = document.getElementById("pdf-chat-messages");
    if (!messages) return null;
    var id  = "pdf-cmsg-" + (++chatMsgCounter);
    var div = document.createElement("div");
    div.id          = id;
    div.className   = "pdf-chat-msg pdf-chat-msg--" + role;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return id;
  }

  function updateChatMsg(id, text) {
    if (!id) return;
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    var messages = document.getElementById("pdf-chat-messages");
    if (messages) messages.scrollTop = messages.scrollHeight;
  }

  /* ---- Keyboard shortcuts ---- */
  document.addEventListener("keydown", function (e) {
    var overlay = document.getElementById("pdf-viewer-overlay");
    if (!overlay || !overlay.classList.contains("open")) return;
    if (e.key === "Escape") { closeViewer(); }
  });

  /* ---- Init ---- */
  function init() {
    buildViewerDom();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* Expose for event delegation in Part 2 */
  window.openPdfViewer = openViewer;
})();
