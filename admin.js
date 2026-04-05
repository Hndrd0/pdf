/* admin.js — NCERT PDF Admin Panel */
(function () {
  'use strict';

  /* ============================================================
     APPWRITE CONFIG
     ============================================================ */
  var ENDPOINT   = 'https://sgp.cloud.appwrite.io/v1';
  var PROJECT_ID = '69d0f017002257fde008';
  var BUCKET_ID  = 'pdfs';

  var client  = new Appwrite.Client();
  var account = new Appwrite.Account(client);
  var storage = new Appwrite.Storage(client);

  client.setEndpoint(ENDPOINT).setProject(PROJECT_ID);

  /* ============================================================
     GITHUB CONFIG
     ============================================================ */
  var GH_OWNER = 'Hndrd0';
  var GH_REPO  = 'pdf';
  var GH_FILE  = 'timetable.json';
  var GH_TOKEN_KEY = 'admin_gh_token';

  /* ============================================================
     STATE
     ============================================================ */
  var currentUser = null;
  var allFiles    = [];       // cached bucket listing
  var timetableData = null;   // loaded timetable

  /* ============================================================
     HELPERS
     ============================================================ */
  function el(id) { return document.getElementById(id); }

  function showAlert(alertEl, type, msg) {
    alertEl.className = 'alert alert-' + type + ' visible';
    alertEl.textContent = msg;
  }

  function hideAlert(alertEl) {
    alertEl.className = 'alert';
    alertEl.textContent = '';
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    var k = 1024;
    var sizes = ['B', 'KB', 'MB', 'GB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function formatDate(isoStr) {
    if (!isoStr) return '—';
    try {
      return new Date(isoStr).toLocaleString();
    } catch (e) { return isoStr; }
  }

  /* ============================================================
     AUTH
     ============================================================ */
  function showLogin() {
    el('login-page').style.display = '';
    el('admin-layout').style.display = 'none';
  }

  function showDashboard(user) {
    currentUser = user;
    el('login-page').style.display = 'none';
    el('admin-layout').style.display = 'flex';
    el('user-info-display').textContent = user.email;
    loadDashboardStats();
  }

  async function tryRestoreSession() {
    try {
      var user = await account.get();
      if (!user.labels || user.labels.indexOf('admin') === -1) {
        await account.deleteSession('current');
        showLogin();
        el('login-error').className = 'login-error visible';
        el('login-error').textContent = 'Access denied: account does not have admin privileges.';
        return;
      }
      showDashboard(user);
    } catch (e) {
      showLogin();
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    var email    = el('login-email').value.trim();
    var password = el('login-password').value;
    var errEl    = el('login-error');
    var btn      = el('login-btn');

    if (!email || !password) {
      errEl.className = 'login-error visible';
      errEl.textContent = 'Please enter email and password.';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Signing in…';
    hideAlert(errEl);
    errEl.className = 'login-error';

    try {
      await account.createEmailSession(email, password);
      var user = await account.get();
      if (!user.labels || user.labels.indexOf('admin') === -1) {
        await account.deleteSession('current');
        errEl.className = 'login-error visible';
        errEl.textContent = 'Access denied: your account does not have admin privileges.';
        btn.disabled = false;
        btn.textContent = 'Sign In';
        return;
      }
      showDashboard(user);
    } catch (e) {
      errEl.className = 'login-error visible';
      errEl.textContent = 'Login failed: ' + (e.message || 'Invalid credentials.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  }

  async function handleLogout() {
    try { await account.deleteSession('current'); } catch (_) {}
    currentUser = null;
    allFiles = [];
    timetableData = null;
    showLogin();
  }

  /* ============================================================
     NAVIGATION
     ============================================================ */
  var sectionTitles = {
    dashboard:  'Dashboard',
    upload:     'Upload PDFs',
    manage:     'Manage PDFs',
    timetable:  'Timetable Editor',
    settings:   'Settings'
  };

  function switchSection(name) {
    document.querySelectorAll('.section').forEach(function (s) {
      s.classList.remove('active');
    });
    document.querySelectorAll('.nav-item').forEach(function (b) {
      b.classList.remove('active');
    });
    var sec = el('section-' + name);
    if (sec) sec.classList.add('active');
    var navBtn = document.querySelector('.nav-item[data-section="' + name + '"]');
    if (navBtn) navBtn.classList.add('active');
    el('topbar-title').textContent = sectionTitles[name] || name;

    // Lazy load
    if (name === 'manage') loadFileList();
    if (name === 'timetable') loadTimetable();
    if (name === 'settings') loadSettings();

    // Close sidebar on mobile
    el('sidebar').classList.remove('open');
    el('sidebar-overlay').classList.remove('visible');
  }

  /* ============================================================
     DASHBOARD STATS
     ============================================================ */
  function countConfigPdfs() {
    if (typeof SUBJECTS === 'undefined') return 0;
    var count = 0;
    SUBJECTS.forEach(function (s) {
      if (s.files) {
        count += s.files.length;
      } else if (s.sections) {
        s.sections.forEach(function (sec) {
          count += (sec.files || []).length;
        });
      }
    });
    return count;
  }

  async function loadDashboardStats() {
    el('stat-total-pdfs').textContent = countConfigPdfs();

    try {
      var resp = await storage.listFiles(BUCKET_ID);
      var files = resp.files || [];
      el('stat-bucket-files').textContent = files.length;

      var totalBytes = files.reduce(function (acc, f) { return acc + (f.sizeOriginal || 0); }, 0);
      el('stat-storage').textContent = formatBytes(totalBytes);
    } catch (e) {
      el('stat-bucket-files').textContent = 'Err';
      el('stat-storage').textContent = 'Err';
    }
  }

  /* ============================================================
     UPLOAD PDFs
     ============================================================ */
  var pendingFiles = [];

  function initUploadSection() {
    var dropZone = el('drop-zone');
    var fileInput = el('file-input');
    var uploadBtn = el('upload-btn');
    var queue = el('upload-queue');

    // Click on drop zone opens file picker
    dropZone.addEventListener('click', function () { fileInput.click(); });

    // Drag & drop
    dropZone.addEventListener('dragover', function (e) {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', function () {
      dropZone.classList.remove('dragover');
    });
    dropZone.addEventListener('drop', function (e) {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      addFilesToQueue(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', function () {
      addFilesToQueue(fileInput.files);
      fileInput.value = '';
    });

    uploadBtn.addEventListener('click', uploadAllPending);
  }

  function addFilesToQueue(fileList) {
    for (var i = 0; i < fileList.length; i++) {
      var f = fileList[i];
      if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
        continue;
      }
      pendingFiles.push(f);
    }
    renderUploadQueue();
    el('upload-btn').disabled = pendingFiles.length === 0;
  }

  function renderUploadQueue() {
    var queue = el('upload-queue');
    queue.innerHTML = '';
    pendingFiles.forEach(function (f, idx) {
      var item = document.createElement('div');
      item.className = 'upload-item';
      item.id = 'upload-item-' + idx;
      item.innerHTML =
        '<div class="upload-item-header">' +
          '<span class="upload-item-name">' + escapeHtml(f.name) + '</span>' +
          '<span class="upload-item-status" id="status-' + idx + '">Pending</span>' +
        '</div>' +
        '<div class="progress-bar-wrap"><div class="progress-bar-fill" id="progress-' + idx + '"></div></div>';
      queue.appendChild(item);
    });
  }

  async function uploadAllPending() {
    if (pendingFiles.length === 0) return;
    var subject = el('upload-subject').value;
    var btn = el('upload-btn');
    var alertEl = el('upload-alert');
    hideAlert(alertEl);
    btn.disabled = true;

    var successCount = 0;
    var errorCount = 0;

    for (var i = 0; i < pendingFiles.length; i++) {
      var f = pendingFiles[i];
      var statusEl = el('status-' + i);
      var progressEl = el('progress-' + i);

      statusEl.className = 'upload-item-status';
      statusEl.textContent = 'Uploading…';
      progressEl.style.width = '30%';

      try {
        await storage.createFile(BUCKET_ID, Appwrite.ID.unique(), f, undefined, { subject: subject });
        progressEl.style.width = '100%';
        progressEl.classList.add('success');
        statusEl.className = 'upload-item-status success';
        statusEl.textContent = '✓ Uploaded';
        successCount++;
      } catch (e) {
        progressEl.style.width = '100%';
        progressEl.classList.add('error');
        statusEl.className = 'upload-item-status error';
        statusEl.textContent = '✗ ' + (e.message || 'Failed');
        errorCount++;
      }
    }

    pendingFiles = [];
    btn.disabled = true;

    if (errorCount === 0) {
      showAlert(alertEl, 'success', '✓ All ' + successCount + ' file(s) uploaded successfully.');
    } else {
      showAlert(alertEl, 'warning', successCount + ' uploaded, ' + errorCount + ' failed. Check items above.');
    }

    // Refresh dashboard stats
    loadDashboardStats();
  }

  /* ============================================================
     MANAGE PDFs
     ============================================================ */
  async function loadFileList() {
    var tbody = el('file-table-body');
    var alertEl = el('manage-alert');
    hideAlert(alertEl);
    tbody.innerHTML = '<tr><td colspan="4"><div class="empty-state"><div class="empty-icon"><span class="spinner"></span></div><p>Loading files…</p></div></td></tr>';

    try {
      var resp = await storage.listFiles(BUCKET_ID);
      allFiles = resp.files || [];
      renderFileTable(allFiles);
    } catch (e) {
      showAlert(alertEl, 'error', 'Failed to load files: ' + (e.message || 'Unknown error'));
      tbody.innerHTML = '<tr><td colspan="4"><div class="empty-state"><div class="empty-icon">⚠️</div><p>Error loading files</p></div></td></tr>';
    }
  }

  function renderFileTable(files) {
    var tbody = el('file-table-body');
    if (!files || files.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4"><div class="empty-state"><div class="empty-icon">📭</div><p>No files in bucket</p></div></td></tr>';
      return;
    }
    tbody.innerHTML = '';
    files.forEach(function (f) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td class="file-name">' + escapeHtml(f.name || f.$id) + '</td>' +
        '<td class="file-size">' + formatBytes(f.sizeOriginal || 0) + '</td>' +
        '<td class="file-date">' + formatDate(f.$createdAt) + '</td>' +
        '<td><button class="btn btn-danger btn-sm" data-id="' + escapeHtml(f.$id) + '" data-name="' + escapeHtml(f.name || f.$id) + '">🗑️ Delete</button></td>';
      tbody.appendChild(tr);
    });
  }

  function initManageSection() {
    el('manage-search').addEventListener('input', function () {
      var q = this.value.toLowerCase();
      var filtered = allFiles.filter(function (f) {
        return (f.name || f.$id).toLowerCase().includes(q);
      });
      renderFileTable(filtered);
    });

    el('manage-refresh-btn').addEventListener('click', loadFileList);

    el('file-table-body').addEventListener('click', async function (e) {
      var btn = e.target.closest('button[data-id]');
      if (!btn) return;
      var fileId = btn.dataset.id;
      var fileName = btn.dataset.name;
      if (!confirm('Delete "' + fileName + '"? This cannot be undone.')) return;
      btn.disabled = true;
      btn.textContent = '…';
      var alertEl = el('manage-alert');
      try {
        await storage.deleteFile(BUCKET_ID, fileId);
        allFiles = allFiles.filter(function (f) { return f.$id !== fileId; });
        var q = el('manage-search').value.toLowerCase();
        renderFileTable(allFiles.filter(function (f) { return (f.name || f.$id).toLowerCase().includes(q); }));
        showAlert(alertEl, 'success', '✓ File deleted.');
        loadDashboardStats();
      } catch (e) {
        showAlert(alertEl, 'error', 'Delete failed: ' + (e.message || 'Unknown error'));
        btn.disabled = false;
        btn.textContent = '🗑️ Delete';
      }
    });
  }

  /* ============================================================
     TIMETABLE EDITOR
     ============================================================ */
  async function loadTimetable() {
    var alertEl = el('tt-alert');
    hideAlert(alertEl);
    el('tt-editor').innerHTML = '<div class="empty-state"><div class="empty-icon"><span class="spinner"></span></div><p>Loading timetable…</p></div>';

    try {
      var resp = await fetch('timetable.json?_=' + Date.now());
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      timetableData = await resp.json();
      renderTimetableEditor();
    } catch (e) {
      showAlert(alertEl, 'error', 'Failed to load timetable.json: ' + e.message);
      el('tt-editor').innerHTML = '<div class="empty-state"><div class="empty-icon">⚠️</div><p>Error loading timetable</p></div>';
    }
  }

  function renderTimetableEditor() {
    if (!timetableData) return;
    var container = el('tt-editor');
    var td = timetableData;
    var days = td.days || [];
    var periods = td.periods || [];
    var schedule = td.schedule || {};

    var table = document.createElement('table');
    table.className = 'tt-table';

    // Header row: first cell (corner) + one per day
    var thead = document.createElement('thead');
    var headerRow = document.createElement('tr');

    // Corner th (Period)
    var cornerTh = document.createElement('th');
    cornerTh.textContent = 'Period / Day';
    headerRow.appendChild(cornerTh);

    days.forEach(function (day, di) {
      var th = document.createElement('th');
      var dayDiv = document.createElement('div');
      dayDiv.className = 'tt-day-header';

      var nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.className = 'tt-day-name-input';
      nameInput.value = day;
      nameInput.placeholder = 'Day';
      nameInput.addEventListener('input', function () {
        var old = td.days[di];
        td.days[di] = this.value;
        if (td.schedule[old] !== undefined) {
          td.schedule[this.value] = td.schedule[old];
          delete td.schedule[old];
        }
      });
      dayDiv.appendChild(nameInput);

      var removeBtn = document.createElement('button');
      removeBtn.className = 'tt-remove-day';
      removeBtn.title = 'Remove day';
      removeBtn.textContent = '✕';
      removeBtn.addEventListener('click', function () {
        var dayName = td.days[di];
        td.days.splice(di, 1);
        delete td.schedule[dayName];
        renderTimetableEditor();
      });
      dayDiv.appendChild(removeBtn);

      th.appendChild(dayDiv);
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body rows: one per period
    var tbody = document.createElement('tbody');
    periods.forEach(function (period, pi) {
      var tr = document.createElement('tr');

      // Period header cell
      var tdPeriod = document.createElement('td');
      tdPeriod.className = 'period-header';

      var headerCell = document.createElement('div');
      headerCell.className = 'tt-header-cell';

      var nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.className = 'tt-period-name-input';
      nameInput.value = period.name || '';
      nameInput.placeholder = 'Name';
      nameInput.addEventListener('input', function () {
        td.periods[pi].name = this.value;
      });
      headerCell.appendChild(nameInput);

      var timeInput = document.createElement('input');
      timeInput.type = 'text';
      timeInput.className = 'tt-time-input';
      timeInput.value = period.time || '';
      timeInput.placeholder = 'HH:MM - HH:MM';
      timeInput.addEventListener('input', function () {
        td.periods[pi].time = this.value;
      });
      headerCell.appendChild(timeInput);

      var removeBtn = document.createElement('button');
      removeBtn.className = 'tt-remove-period';
      removeBtn.title = 'Remove period';
      removeBtn.textContent = '✕';
      removeBtn.addEventListener('click', function () {
        td.periods.splice(pi, 1);
        // Remove slot at this index from all days
        Object.keys(td.schedule).forEach(function (d) {
          if (Array.isArray(td.schedule[d])) {
            td.schedule[d].splice(pi, 1);
          }
        });
        renderTimetableEditor();
      });
      headerCell.appendChild(removeBtn);

      tdPeriod.appendChild(headerCell);
      tr.appendChild(tdPeriod);

      // Subject cell per day
      days.forEach(function (day) {
        var tdCell = document.createElement('td');
        var inp = document.createElement('input');
        inp.type = 'text';
        inp.className = 'tt-cell-input';
        inp.placeholder = '—';
        if (!schedule[day]) schedule[day] = [];
        inp.value = schedule[day][pi] || '';
        inp.addEventListener('input', function () {
          if (!td.schedule[day]) td.schedule[day] = [];
          td.schedule[day][pi] = this.value;
        });
        tdCell.appendChild(inp);
        tr.appendChild(tdCell);
      });

      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    container.innerHTML = '';
    container.appendChild(table);
  }

  function initTimetableSection() {
    el('tt-add-period-btn').addEventListener('click', function () {
      if (!timetableData) return;
      timetableData.periods.push({ name: 'P' + (timetableData.periods.length + 1), time: '' });
      // Extend each day's schedule array
      var days = timetableData.days || [];
      days.forEach(function (d) {
        if (!timetableData.schedule[d]) timetableData.schedule[d] = [];
        timetableData.schedule[d].push('');
      });
      renderTimetableEditor();
    });

    el('tt-add-day-btn').addEventListener('click', function () {
      if (!timetableData) return;
      var dayName = 'Day' + (timetableData.days.length + 1);
      timetableData.days.push(dayName);
      timetableData.schedule[dayName] = timetableData.periods.map(function () { return ''; });
      renderTimetableEditor();
    });

    el('tt-save-btn').addEventListener('click', saveTimetableToGitHub);
  }

  async function saveTimetableToGitHub() {
    var alertEl = el('tt-alert');
    var btn = el('tt-save-btn');
    var token = localStorage.getItem(GH_TOKEN_KEY);
    if (!token) {
      showAlert(alertEl, 'error', 'No GitHub token found. Please add it in Settings first.');
      return;
    }
    if (!timetableData) {
      showAlert(alertEl, 'error', 'No timetable data to save.');
      return;
    }

    btn.disabled = true;
    btn.textContent = '⏳ Saving…';
    hideAlert(alertEl);

    try {
      // Get current file SHA
      var apiBase = 'https://api.github.com/repos/' + GH_OWNER + '/' + GH_REPO + '/contents/' + GH_FILE;
      var headers = {
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      };

      var getResp = await fetch(apiBase, { headers: headers });
      if (!getResp.ok && getResp.status !== 404) {
        throw new Error('GitHub API error: ' + getResp.status);
      }
      var currentSha = null;
      if (getResp.ok) {
        var fileInfo = await getResp.json();
        currentSha = fileInfo.sha;
      }

      var content = JSON.stringify(timetableData, null, 2);
      var encoded = btoa(String.fromCharCode.apply(null, new TextEncoder().encode(content)));

      var body = {
        message: 'Update timetable.json via admin panel',
        content: encoded
      };
      if (currentSha) body.sha = currentSha;

      var putResp = await fetch(apiBase, {
        method: 'PUT',
        headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
        body: JSON.stringify(body)
      });

      if (!putResp.ok) {
        var errData = await putResp.json().catch(function () { return {}; });
        throw new Error(errData.message || ('GitHub API error: ' + putResp.status));
      }

      showAlert(alertEl, 'success', '✓ timetable.json saved to GitHub successfully.');
    } catch (e) {
      showAlert(alertEl, 'error', 'Save failed: ' + e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = '💾 Save to GitHub';
    }
  }

  /* ============================================================
     SETTINGS
     ============================================================ */
  function loadSettings() {
    var token = localStorage.getItem(GH_TOKEN_KEY) || '';
    if (token) {
      // Show masked value
      el('gh-token-input').placeholder = '••••••••••••••• (saved)';
      el('gh-token-input').value = '';
    } else {
      el('gh-token-input').placeholder = 'ghp_…';
    }
  }

  function initSettingsSection() {
    el('save-gh-token-btn').addEventListener('click', function () {
      var val = el('gh-token-input').value.trim();
      var alertEl = el('settings-alert');
      if (!val) {
        showAlert(alertEl, 'error', 'Please enter a token before saving.');
        return;
      }
      localStorage.setItem(GH_TOKEN_KEY, val);
      el('gh-token-input').value = '';
      el('gh-token-input').placeholder = '••••••••••••••• (saved)';
      showAlert(alertEl, 'success', '✓ Token saved to localStorage.');
    });

    el('clear-gh-token-btn').addEventListener('click', function () {
      localStorage.removeItem(GH_TOKEN_KEY);
      el('gh-token-input').value = '';
      el('gh-token-input').placeholder = 'ghp_…';
      showAlert(el('settings-alert'), 'info', 'Token cleared.');
    });
  }

  /* ============================================================
     XSS HELPER
     ============================================================ */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ============================================================
     SIDEBAR / MOBILE
     ============================================================ */
  function initNav() {
    document.querySelectorAll('.nav-item[data-section]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchSection(this.dataset.section);
      });
    });

    el('menu-toggle').addEventListener('click', function () {
      el('sidebar').classList.toggle('open');
      el('sidebar-overlay').classList.toggle('visible');
    });

    el('sidebar-overlay').addEventListener('click', function () {
      el('sidebar').classList.remove('open');
      el('sidebar-overlay').classList.remove('visible');
    });
  }

  /* ============================================================
     BOOT
     ============================================================ */
  function init() {
    el('login-form').addEventListener('submit', handleLogin);
    el('logout-btn').addEventListener('click', handleLogout);

    initNav();
    initUploadSection();
    initManageSection();
    initTimetableSection();
    initSettingsSection();

    tryRestoreSession();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
