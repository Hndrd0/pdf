/**
 * script.js
 * Handles the subject page (subject.html):
 *  - Reads the `subject` query parameter to determine which subject to show
 *  - Fetches the file list from config.js (SUBJECTS)
 *  - Sorts files numerically
 *  - Converts filenames to display names
 *  - Renders clickable PDF cards that open in a new tab
 *  - Provides a live search/filter bar
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
   * "Chapter (1).pdf"  → "Chapter 1"
   * "Appendix (2).pdf" → "Appendix 2"
   * "Answers.pdf"      → "Answers"
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

  /** Render the list of file cards into #file-list */
  function renderFiles(files, folder, query) {
    const container = document.getElementById("file-list");
    if (!container) return;

    const normalQuery = (query || "").trim().toLowerCase();
    const filtered = normalQuery
      ? files.filter(f => toDisplayName(f).toLowerCase().includes(normalQuery))
      : files;

    if (filtered.length === 0) {
      container.innerHTML =
        '<p class="no-results">No files match your search.</p>';
      return;
    }

    container.innerHTML = filtered
      .map(filename => {
        const displayName = escapeHtml(toDisplayName(filename));
        // Encode the filename component separately so spaces and special chars are safe
        const url = folder + "/" + encodeURIComponent(filename);
        return `
          <a class="file-card" href="${url}" target="_blank" rel="noopener noreferrer">
            <span class="pdf-icon">📄</span>
            <span class="file-name">${displayName}</span>
          </a>`;
      })
      .join("");
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

    const sortedFiles = sortFiles(subject.files);

    // Section count label
    const countEl = document.getElementById("file-count");
    if (countEl) countEl.textContent = `${sortedFiles.length} file(s)`;

    if (statusEl) statusEl.setAttribute("hidden", "");
    if (fileSection) fileSection.removeAttribute("hidden");

    renderFiles(sortedFiles, subject.folder, "");

    // Search bar
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        renderFiles(sortedFiles, subject.folder, this.value);
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
