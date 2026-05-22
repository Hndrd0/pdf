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
 *  - Fetches additional resources from Appwrite Storage by subject metadata
 */

(function () {
  /* Appwrite config (public read — no auth required) */
  var AW_ENDPOINT   = 'https://sgp.cloud.appwrite.io/v1';
  var AW_PROJECT_ID = '69d0f017002257fde008';
  var AW_BUCKET_ID  = 'pdfs';

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

  /**
   * Build the Appwrite Storage view URL for a given file ID.
   */
  function buildAppwriteFileUrl(fileId) {
    return AW_ENDPOINT + '/storage/buckets/' + AW_BUCKET_ID + '/files/' + fileId + '/view?project=' + AW_PROJECT_ID;
  }

  /**
   * Fetch files from Appwrite bucket and append any that match the current
   * subject under a "📦 Additional Resources" divider.
   * Subject is read from f.subject (top-level), f.metadata.subject, or
   * f.metadata?.subject — whichever is present.
   * Shows a debug info div when ?debug=1 is in the URL.
   * Silently fails if Appwrite is unavailable or no matching files are found.
   */
  function fetchAppwriteFiles(subjectId) {
    if (typeof Appwrite === 'undefined') {
      console.warn('[Appwrite] SDK not loaded — skipping fetchAppwriteFiles');
      return;
    }

    var isDebug = new URLSearchParams(window.location.search).get('debug') === '1';
    var debugDiv = null;
    if (isDebug) {
      debugDiv = document.createElement('div');
      debugDiv.id = 'appwrite-debug';
      debugDiv.style.cssText = 'background:#fffbdd;border:1px solid #e0c800;padding:0.6rem 1rem;' +
        'margin:0.8rem 0;font-size:0.8rem;font-family:monospace;border-radius:4px;';
      debugDiv.textContent = 'Appwrite: fetching…';
      var fs = document.getElementById('file-section');
      if (fs) fs.insertBefore(debugDiv, fs.firstChild);
    }

    var client  = new Appwrite.Client();
    var storage = new Appwrite.Storage(client);
    client.setEndpoint(AW_ENDPOINT).setProject(AW_PROJECT_ID);

    var id = subjectId.toLowerCase();

    /** Extract the subject string from a file object, trying multiple field paths. */
    function extractSubject(f) {
      if (f.subject) return String(f.subject);
      if (f.metadata && f.metadata.subject) return String(f.metadata.subject);
      return '';
    }

    function matchesSubject(f) {
      var subject = extractSubject(f).toLowerCase();
      return subject === id || subject.startsWith(id + '/');
    }

    storage.listFiles(AW_BUCKET_ID)
      .then(function (resp) {
        var allFetched = resp.files || [];
        console.log('[Appwrite] Total files fetched:', allFetched.length, '— matching against subject:', subjectId);
        allFetched.forEach(function (f) {
          console.log('[Appwrite] File object:', JSON.stringify(f));
        });

        var matched = allFetched.filter(matchesSubject);
        console.log('[Appwrite] Matched files:', matched.length);

        if (isDebug && debugDiv) {
          debugDiv.textContent = 'Appwrite: fetched ' + allFetched.length + ' file(s), ' +
            matched.length + ' matched subject "' + subjectId + '"';
        }

        if (matched.length > 0) {
          appendAppwriteSection(matched);
          return;
        }

        // No subject matches from listFiles — try fetching each file individually
        // to get full metadata (listFiles may omit custom fields)
        if (allFetched.length === 0) return;

        console.log('[Appwrite] No matches from listFiles — fetching files individually for full metadata');
        var promises = allFetched.map(function (f) {
          return storage.getFile(AW_BUCKET_ID, f.$id).catch(function (err) {
            console.warn('[Appwrite] getFile failed for', f.$id, err);
            return null;
          });
        });

        return Promise.all(promises).then(function (fullFiles) {
          var enriched = fullFiles.filter(function (f) {
            if (!f) return false;
            console.log('[Appwrite] getFile result:', JSON.stringify(f));
            return matchesSubject(f);
          });
          console.log('[Appwrite] Matched (via getFile):', enriched.length);

          if (isDebug && debugDiv) {
            debugDiv.textContent = 'Appwrite: fetched ' + allFetched.length + ' file(s) (via getFile), ' +
              enriched.length + ' matched subject "' + subjectId + '"';
          }

          if (enriched.length > 0) {
            appendAppwriteSection(enriched);
          }
        });
      })
      .catch(function (err) {
        console.warn('[Appwrite] fetchAppwriteFiles error:', err);
        if (isDebug && debugDiv) {
          debugDiv.textContent = 'Appwrite: error — ' + (err && err.message ? err.message : String(err));
        }
      });
  }

  /**
   * Append a "📦 Additional Resources" section with file cards for
   * files fetched from Appwrite Storage.
   */
  function appendAppwriteSection(files) {
    var fileSection = document.getElementById('file-section');
    if (!fileSection) return;

    var divider = document.createElement('p');
    divider.className   = 'section-title appwrite-divider';
    divider.textContent = '📦 Additional Resources';
    fileSection.appendChild(divider);

    var grid = document.createElement('div');
    grid.className = 'file-grid';

    files.forEach(function (f) {
      var url         = buildAppwriteFileUrl(f.$id);
      var displayName = escapeHtml(f.name || f.$id);
      var card        = document.createElement('a');
      card.className          = 'file-card';
      card.href               = url;
      card.dataset.pdfUrl     = url;
      card.dataset.pdfTitle   = f.name || f.$id;
      card.innerHTML          = '<span class="pdf-icon">📄</span><span class="file-name">' + displayName + '</span>';
      grid.appendChild(card);
    });

    fileSection.appendChild(grid);
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

    // Fetch additional resources from Appwrite bucket (silently fails if unavailable)
    fetchAppwriteFiles(subjectId);

    // PDF viewer: intercept file-card clicks to open in-page viewer
    // Attach to file-section to also cover Appwrite-appended cards
    const fileSectionEl = document.getElementById("file-section");
    if (fileSectionEl) {
      fileSectionEl.addEventListener("click", function (e) {
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
   PART 5 — PDF Viewer
   ============================================================ */
(function () {
  var overlayEl = null;
  var frameEl = null;
  var titleEl = null;
  var previousBodyOverflow = "";

  function closeViewer() {
    if (!overlayEl) return;
    overlayEl.style.display = "none";
    if (frameEl) frameEl.src = "about:blank";
    document.body.style.overflow = previousBodyOverflow;
  }

  function onKeyDown(e) {
    if (e.key === "Escape" && overlayEl && overlayEl.style.display !== "none") {
      closeViewer();
    }
  }

  function ensureViewerDom() {
    if (overlayEl) return;

    overlayEl = document.createElement("div");
    overlayEl.id = "pdf-viewer-overlay";
    overlayEl.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;display:none;";

    var container = document.createElement("div");
    container.style.cssText = "position:absolute;inset:2rem;background:#fff;border-radius:12px;overflow:hidden;display:flex;flex-direction:column;";

    var toolbar = document.createElement("div");
    toolbar.style.cssText = "display:flex;align-items:center;justify-content:space-between;padding:.75rem 1rem;background:#f5f6f8;border-bottom:1px solid #e5e7eb;";

    titleEl = document.createElement("span");
    titleEl.style.cssText = "font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-right:1rem;";

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.textContent = "\u2715";
    closeBtn.setAttribute("aria-label", "Close viewer");
    closeBtn.style.cssText = "border:0;background:transparent;font-size:1.2rem;line-height:1;cursor:pointer;";
    closeBtn.addEventListener("click", closeViewer);

    frameEl = document.createElement("iframe");
    frameEl.setAttribute("title", "PDF viewer");
    frameEl.style.cssText = "width:100%;height:100%;border:0;flex:1;";
    frameEl.setAttribute("referrerpolicy", "no-referrer");

    toolbar.appendChild(titleEl);
    toolbar.appendChild(closeBtn);
    container.appendChild(toolbar);
    container.appendChild(frameEl);
    overlayEl.appendChild(container);
    document.body.appendChild(overlayEl);
  }

  window.openPdfViewer = function (url, title) {
    var absoluteUrl = new URL(url, window.location.href).href;
    var viewerUrl = "https://docs.google.com/viewer?url=" + encodeURIComponent(absoluteUrl) + "&embedded=true";

    ensureViewerDom();
    previousBodyOverflow = document.body.style.overflow;
    titleEl.textContent = title || "PDF Viewer";
    frameEl.src = viewerUrl;
    overlayEl.style.display = "block";
    document.body.style.overflow = "hidden";
  };

  document.addEventListener("keydown", onKeyDown);
})();
