const DOM = {
    // Auth
    loginOverlay: document.getElementById('login-overlay'),
    loginPassword: document.getElementById('login-password'),
    btnLogin: document.getElementById('btn-login'),
    loginError: document.getElementById('login-error'),
    btnLogout: document.getElementById('btn-logout'),

    // Sidebar
    sidebar: document.getElementById('sidebar'),
    btnMenu: document.getElementById('btn-menu'),
    btnCloseSidebar: document.getElementById('btn-close-sidebar'),
    colList: document.getElementById('collection-list'),
    btnAddCol: document.getElementById('btn-add-collection'),
    searchCol: document.getElementById('search-collection'),

    // Main Content
    colName: document.getElementById('current-col-name'),
    btnAdd: document.getElementById('btn-add'),
    tableHead: document.getElementById('table-head'),
    tableBody: document.getElementById('table-body'),
    emptyState: document.getElementById('empty-state'),
    statCols: document.getElementById('stat-cols'),
    statDocs: document.getElementById('stat-docs'),
    statSize: document.getElementById('stat-size'),
    
    // Search Data
    dataToolbar: document.getElementById('data-toolbar'),
    searchData: document.getElementById('search-data'),
    btnExportCol: document.getElementById('btn-export-collection'),
    btnDeleteCol: document.getElementById('btn-delete-collection'),
    
    // Tabs
    tabTable: document.getElementById('tab-table'),
    tabGraph: document.getElementById('tab-graph'),
    viewTable: document.getElementById('view-table'),
    viewGraph: document.getElementById('view-graph'),
    graphContainer: document.getElementById('graph-container'),
    btnCenterGraph: document.getElementById('btn-center-graph'),
    
    // Drawer
    drawer: document.getElementById('drawer'),
    drawerOverlay: document.getElementById('drawer-overlay'),
    inputId: document.getElementById('input-id'),
    inputJson: document.getElementById('input-json'),
    btnSave: document.getElementById('btn-save'),
    btnCancel: document.getElementById('btn-cancel'),
    btnCloseDrawer: document.getElementById('btn-close-drawer'),
    jsonError: document.getElementById('json-error'),

    // Settings
    btnSettings: document.getElementById('btn-settings'),
    modalSettings: document.getElementById('modal-settings'),
    modalSettingsContent: document.getElementById('modal-settings-content'),
    btnCloseSettings: document.getElementById('btn-close-settings'),
    inputOldPass: document.getElementById('input-old-pass'),
    inputNewPass: document.getElementById('input-new-pass'),
    btnSavePass: document.getElementById('btn-save-password'),
    settingsMsg: document.getElementById('settings-msg'),

    // Theme & Toast
    btnTheme: document.getElementById('btn-toggle-theme'),
    themeIcon: document.getElementById('theme-icon'),
    toastContainer: document.getElementById('toast-container'),

    // Custom Dialogs
    dialogConfirm: document.getElementById('dialog-confirm'),
    dialogConfirmTitle: document.getElementById('dialog-confirm-title'),
    dialogConfirmCaption: document.getElementById('dialog-confirm-caption'),
    btnDialogConfirmCancel: document.getElementById('btn-dialog-confirm-cancel'),
    btnDialogConfirmAction: document.getElementById('btn-dialog-confirm-action'),
    
    dialogPrompt: document.getElementById('dialog-prompt'),
    dialogPromptTitle: document.getElementById('dialog-prompt-title'),
    dialogPromptInput: document.getElementById('dialog-prompt-input'),
    btnDialogPromptCancel: document.getElementById('btn-dialog-prompt-cancel'),
    btnDialogPromptSubmit: document.getElementById('btn-dialog-prompt-submit'),

    // Pagination
    paginationControls: document.getElementById('pagination-controls'),
    pageInfo: document.getElementById('page-info'),
    btnPrevPage: document.getElementById('btn-prev-page'),
    btnNextPage: document.getElementById('btn-next-page')
};

let currentCollection = null;
let currentTab = 'table';
let myGraph = null;
let currentDataList = [];
let currentPage = 1;
const ITEMS_PER_PAGE = 50;

// --- TOAST NOTIFICATIONS ---
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast-enter p-3 rounded-md shadow-lg text-sm text-white flex items-center gap-2 ${
        type === 'success' ? 'bg-[var(--accent)]' : 'bg-red-500'
    }`;
    const icon = type === 'success' ? 'check_circle' : 'error';
    toast.innerHTML = `<span class="material-symbols-outlined text-[18px]">${icon}</span> ${message}`;
    
    DOM.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.replace('toast-enter', 'toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- CUSTOM DIALOGS (PROMISE BASED) ---
function showConfirmDialog(title, caption, actionText = 'Confirm', isDanger = false) {
    return new Promise((resolve) => {
        DOM.dialogConfirmTitle.textContent = title;
        DOM.dialogConfirmCaption.textContent = caption;
        DOM.btnDialogConfirmAction.textContent = actionText;
        
        if (isDanger) {
            DOM.btnDialogConfirmAction.className = 'px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-all shadow-sm';
        } else {
            DOM.btnDialogConfirmAction.className = 'px-4 py-2 text-sm font-medium text-white bg-[var(--accent)] hover:brightness-110 rounded-md transition-all shadow-sm';
        }

        DOM.dialogConfirm.classList.remove('hidden');
        setTimeout(() => {
            DOM.dialogConfirm.classList.remove('opacity-0');
            DOM.dialogConfirm.querySelector('div').classList.remove('scale-95');
        }, 10);

        const cleanup = () => {
            DOM.dialogConfirm.classList.add('opacity-0');
            DOM.dialogConfirm.querySelector('div').classList.add('scale-95');
            setTimeout(() => DOM.dialogConfirm.classList.add('hidden'), 200);
            DOM.btnDialogConfirmCancel.removeEventListener('click', onCancel);
            DOM.btnDialogConfirmAction.removeEventListener('click', onConfirm);
        };

        const onCancel = () => { cleanup(); resolve(false); };
        const onConfirm = () => { cleanup(); resolve(true); };

        DOM.btnDialogConfirmCancel.addEventListener('click', onCancel);
        DOM.btnDialogConfirmAction.addEventListener('click', onConfirm);
    });
}

function showPromptDialog(title, placeholder) {
    return new Promise((resolve) => {
        DOM.dialogPromptTitle.textContent = title;
        DOM.dialogPromptInput.placeholder = placeholder;
        DOM.dialogPromptInput.value = '';

        DOM.dialogPrompt.classList.remove('hidden');
        setTimeout(() => {
            DOM.dialogPrompt.classList.remove('opacity-0');
            DOM.dialogPrompt.querySelector('div').classList.remove('scale-95');
            DOM.dialogPromptInput.focus();
        }, 10);

        const cleanup = () => {
            DOM.dialogPrompt.classList.add('opacity-0');
            DOM.dialogPrompt.querySelector('div').classList.add('scale-95');
            setTimeout(() => DOM.dialogPrompt.classList.add('hidden'), 200);
            DOM.btnDialogPromptCancel.removeEventListener('click', onCancel);
            DOM.btnDialogPromptSubmit.removeEventListener('click', onSubmit);
            DOM.dialogPromptInput.removeEventListener('keydown', onKeydown);
        };

        const onCancel = () => { cleanup(); resolve(null); };
        const onSubmit = () => { cleanup(); resolve(DOM.dialogPromptInput.value.trim()); };
        const onKeydown = (e) => { if (e.key === 'Enter') onSubmit(); };

        DOM.btnDialogPromptCancel.addEventListener('click', onCancel);
        DOM.btnDialogPromptSubmit.addEventListener('click', onSubmit);
        DOM.dialogPromptInput.addEventListener('keydown', onKeydown);
    });
}

// --- THEME MANAGEMENT ---
function initTheme() {
    const savedTheme = localStorage.getItem('ghost_theme') || 'dark';
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        DOM.themeIcon.textContent = 'light_mode';
    } else {
        document.documentElement.classList.remove('dark');
        DOM.themeIcon.textContent = 'dark_mode';
    }
}
DOM.btnTheme.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('ghost_theme', isDark ? 'dark' : 'light');
    DOM.themeIcon.textContent = isDark ? 'light_mode' : 'dark_mode';
});

// --- AUTH & FETCH WRAPPER ---
function getToken() {
    return localStorage.getItem('ghost_token');
}

async function apiFetch(url, options = {}) {
    const token = getToken();
    if (!options.headers) options.headers = {};
    if (token) options.headers['Authorization'] = `Bearer ${token}`;
    
    const res = await fetch(url, options);
    if (res.status === 401) {
        localStorage.removeItem('ghost_token');
        showLogin();
        throw new Error('Unauthorized');
    }
    return res;
}

// --- LOGIN FLOW ---
function showLogin() {
    DOM.loginOverlay.classList.remove('hidden');
    DOM.loginPassword.value = '';
    DOM.loginError.classList.add('hidden');
}

function hideLogin() {
    DOM.loginOverlay.classList.add('hidden');
}

DOM.btnLogin.addEventListener('click', async () => {
    const pwd = DOM.loginPassword.value;
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pwd })
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem('ghost_token', data.token);
            hideLogin();
            initApp();
            showToast('Welcome to GhostDB Studio');
        } else {
            DOM.loginError.textContent = data.error || 'Login failed';
            DOM.loginError.classList.remove('hidden');
        }
    } catch (e) {
        DOM.loginError.textContent = 'Network error';
        DOM.loginError.classList.remove('hidden');
    }
});

DOM.btnLogout.addEventListener('click', () => {
    localStorage.removeItem('ghost_token');
    showLogin();
});

// --- SETTINGS (CHANGE PASSWORD) ---
DOM.btnSettings.addEventListener('click', () => {
    DOM.modalSettings.classList.remove('hidden');
    setTimeout(() => {
        DOM.modalSettings.classList.remove('opacity-0');
        DOM.modalSettingsContent.classList.remove('scale-95');
    }, 10);
    DOM.inputOldPass.value = '';
    DOM.inputNewPass.value = '';
    DOM.settingsMsg.classList.add('hidden');
});

function closeSettings() {
    DOM.modalSettings.classList.add('opacity-0');
    DOM.modalSettingsContent.classList.add('scale-95');
    setTimeout(() => DOM.modalSettings.classList.add('hidden'), 200);
}
DOM.btnCloseSettings.addEventListener('click', closeSettings);

DOM.btnSavePass.addEventListener('click', async () => {
    const oldP = DOM.inputOldPass.value;
    const newP = DOM.inputNewPass.value;
    try {
        const res = await apiFetch('/api/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldPassword: oldP, newPassword: newP })
        });
        const data = await res.json();
        DOM.settingsMsg.classList.remove('hidden');
        if (data.success) {
            DOM.settingsMsg.textContent = 'Password updated!';
            DOM.settingsMsg.className = 'text-sm text-[var(--accent)] mt-2';
            localStorage.setItem('ghost_token', data.token);
            setTimeout(closeSettings, 1000);
            showToast('Password changed successfully');
        } else {
            DOM.settingsMsg.textContent = data.error;
            DOM.settingsMsg.className = 'text-sm text-red-500 mt-2';
        }
    } catch (e) {
        console.error(e);
    }
});

// --- MOBILE SIDEBAR ---
DOM.btnMenu.addEventListener('click', () => {
    DOM.sidebar.classList.remove('-translate-x-full');
});
DOM.btnCloseSidebar.addEventListener('click', () => {
    DOM.sidebar.classList.add('-translate-x-full');
});

// --- TAB SWITCHING ---
function switchTab(tab) {
    currentTab = tab;
    if (tab === 'table') {
        DOM.tabTable.className = "px-3 py-1 text-sm rounded-md bg-text-primary text-bg-primary font-medium transition-colors shadow-sm";
        DOM.tabGraph.className = "px-3 py-1 text-sm rounded-md text-text-secondary hover:text-text-primary transition-colors";
        DOM.viewTable.classList.remove('hidden');
        DOM.viewGraph.classList.add('hidden');
        if (currentCollection) DOM.dataToolbar.classList.remove('hidden');
    } else {
        DOM.tabGraph.className = "px-3 py-1 text-sm rounded-md bg-text-primary text-bg-primary font-medium transition-colors shadow-sm";
        DOM.tabTable.className = "px-3 py-1 text-sm rounded-md text-text-secondary hover:text-text-primary transition-colors";
        DOM.viewTable.classList.add('hidden');
        DOM.viewGraph.classList.remove('hidden');
        DOM.dataToolbar.classList.add('hidden');
        loadGraph();
    }
}

// --- DATA FETCHING ---
async function fetchCollections() {
    try {
        const res = await apiFetch('/api/collections');
        const cols = await res.json();
        renderCollections(cols);
        updateDashboardStats(cols.length);
    } catch (e) {
        console.error(e);
    }
}

async function updateDashboardStats(colCount) {
    if (DOM.statCols) DOM.statCols.textContent = colCount;
    try {
        const res = await apiFetch('/api/graph-data');
        const data = await res.json();
        
        // Count documents (nodes with group !== 0 and !== 'ROOT')
        let docCount = 0;
        let totalSize = 0;
        
        if (data.nodes) {
            data.nodes.forEach(n => {
                if (n.group !== 0 && n.group !== 'ROOT') {
                    docCount++;
                    // Node val represents estimated size (val = chars / 50)
                    totalSize += (n.val * 50);
                }
            });
        }
        
        if (DOM.statDocs) DOM.statDocs.textContent = docCount.toLocaleString();
        
        let sizeStr = totalSize + " B";
        if (totalSize > 1024) sizeStr = (totalSize / 1024).toFixed(2) + " KB";
        if (totalSize > 1024 * 1024) sizeStr = (totalSize / (1024 * 1024)).toFixed(2) + " MB";
        
        if (DOM.statSize) DOM.statSize.textContent = sizeStr;
    } catch(e) {
        console.error('Stats error', e);
    }
}

function renderCollections(cols) {
    DOM.colList.innerHTML = '';
    const filterText = DOM.searchCol.value.toLowerCase();
    
    cols.forEach(col => {
        if (filterText && !col.toLowerCase().includes(filterText)) return;

        const btn = document.createElement('button');
        btn.className = `w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors flex items-center gap-2 ${col === currentCollection ? 'bg-bg-tertiary text-text-primary font-medium border border-border-color shadow-sm' : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'}`;
        btn.innerHTML = `<span class="material-symbols-outlined text-[18px]">folder_data</span> ${col}`;
        btn.onclick = () => {
            currentCollection = col;
            DOM.colName.textContent = col;
            if (currentTab === 'table') DOM.dataToolbar.classList.remove('hidden');
            if (window.innerWidth < 768) DOM.sidebar.classList.add('-translate-x-full');
            loadData();
            fetchCollections();
        };
        DOM.colList.appendChild(btn);
    });
}
DOM.searchCol.addEventListener('input', fetchCollections);

DOM.btnAddCol.addEventListener('click', async () => {
    const name = await showPromptDialog('New Collection Name', 'e.g. users, products...');
    if (name) {
        currentCollection = name;
        DOM.colName.textContent = name;
        if (currentTab === 'table') DOM.dataToolbar.classList.remove('hidden');
        loadData();
        showToast('Empty collection initialized');
    }
});

// --- COLLECTION ACTIONS ---
DOM.btnDeleteCol.addEventListener('click', async () => {
    if (!currentCollection) return;
    
    const isConfirmed = await showConfirmDialog(
        'Drop Collection', 
        `Are you sure you want to DROP the entire collection '${currentCollection}'? This will permanently delete the JSON file.`, 
        'Drop Collection', 
        true
    );
    if (!isConfirmed) return;
    
    try {
        await apiFetch(`/api/${currentCollection}`, { method: 'DELETE' });
        showToast(`Collection ${currentCollection} dropped`);
        currentCollection = null;
        DOM.colName.textContent = 'Select Collection';
        DOM.dataToolbar.classList.add('hidden');
        DOM.tableBody.innerHTML = '';
        DOM.emptyState.classList.remove('hidden');
        DOM.paginationControls.classList.add('hidden');
        fetchCollections();
    } catch (e) {
        showToast('Failed to drop collection', 'error');
    }
});

DOM.btnExportCol.addEventListener('click', async () => {
    if (!currentCollection || currentDataList.length === 0) return;
    
    const isConfirmed = await showConfirmDialog(
        'Export Data', 
        `Download '${currentCollection}.json' containing ${currentDataList.length} documents?`, 
        'Download', 
        false
    );
    if (!isConfirmed) return;

    const dataStr = JSON.stringify(currentDataList, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentCollection}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Exported ${currentCollection}.json`);
});

// --- DATA LIST & PAGINATION ---
async function loadData() {
    if (!currentCollection) return;
    try {
        const res = await apiFetch(`/api/${currentCollection}`);
        currentDataList = await res.json();
        currentPage = 1;
        renderDataList();
    } catch (e) {
        console.error(e);
    }
}

function renderDataList() {
    DOM.tableBody.innerHTML = '';
    
    let filteredList = currentDataList;
    const filterText = DOM.searchData.value.toLowerCase();
    
    if (filterText) {
        filteredList = currentDataList.filter(item => 
            item.id.toLowerCase().includes(filterText) || 
            JSON.stringify(item).toLowerCase().includes(filterText)
        );
    }
    
    if (filteredList.length === 0) {
        DOM.tableHead.parentElement.classList.add('hidden');
        DOM.emptyState.classList.remove('hidden');
        DOM.paginationControls.classList.add('hidden');
        return;
    }
    
    DOM.tableHead.parentElement.classList.remove('hidden');
    DOM.emptyState.classList.add('hidden');
    DOM.paginationControls.classList.remove('hidden');
    
    const totalItems = filteredList.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    
    // Reverse for latest first
    filteredList = filteredList.slice().reverse();
    
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
    const pageData = filteredList.slice(startIndex, endIndex);

    DOM.pageInfo.textContent = `Showing ${startIndex + 1}-${endIndex} of ${totalItems}`;
    DOM.btnPrevPage.disabled = currentPage === 1;
    DOM.btnNextPage.disabled = currentPage === totalPages;
    
    pageData.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-bg-tertiary transition-colors group";
        
        // Pretty JSON for table view
        let formattedJson = JSON.stringify(item, null, 2);
        // Truncate if too long for preview
        if (formattedJson.length > 200) {
            formattedJson = formattedJson.substring(0, 200) + '...';
        }

        tr.innerHTML = `
            <td class="px-6 py-4 font-mono text-xs font-semibold text-text-primary align-top w-48">${item.id}</td>
            <td class="px-6 py-4 font-mono text-xs text-text-secondary align-top">
                <pre class="bg-bg-primary p-2 rounded border border-border-color overflow-x-auto text-[11px] leading-relaxed">${formattedJson}</pre>
            </td>
            <td class="px-6 py-4 align-top">
                <div class="flex items-center justify-end gap-2">
                    <button class="p-1.5 rounded-md text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors border border-transparent hover:border-border-color shadow-sm" onclick="editData('${item.id}')" title="Edit">
                        <span class="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button class="p-1.5 rounded-md text-text-secondary hover:bg-red-500/10 hover:text-red-500 transition-colors border border-transparent hover:border-red-500/20 shadow-sm" onclick="deleteData('${item.id}')" title="Delete">
                        <span class="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                </div>
            </td>
        `;
        DOM.tableBody.appendChild(tr);
    });
}

DOM.searchData.addEventListener('input', () => {
    currentPage = 1;
    renderDataList();
});
DOM.btnPrevPage.addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; renderDataList(); }
});
DOM.btnNextPage.addEventListener('click', () => {
    currentPage++; renderDataList();
});

// --- DRAWER & CRUD ---
function openDrawer(id = '', jsonData = '') {
    DOM.drawerOverlay.classList.remove('hidden');
    DOM.drawer.classList.remove('translate-x-full');
    setTimeout(() => {
        DOM.drawerOverlay.classList.remove('opacity-0');
    }, 10);
    
    DOM.inputId.value = id;
    DOM.inputJson.value = jsonData;
    DOM.inputId.disabled = !!id; 
    DOM.jsonError.classList.add('hidden');
}

function closeDrawer() {
    DOM.drawerOverlay.classList.add('opacity-0');
    DOM.drawer.classList.add('translate-x-full');
    setTimeout(() => {
        DOM.drawerOverlay.classList.add('hidden');
    }, 300);
}

DOM.btnAdd.addEventListener('click', () => {
    openDrawer('', '{\n  \n}');
});
DOM.btnCancel.addEventListener('click', closeDrawer);
DOM.btnCloseDrawer.addEventListener('click', closeDrawer);
DOM.drawerOverlay.addEventListener('click', closeDrawer);

// Realtime JSON validation
DOM.inputJson.addEventListener('input', () => {
    try {
        JSON.parse(DOM.inputJson.value);
        DOM.jsonError.classList.add('hidden');
        DOM.inputJson.classList.remove('border-red-500');
    } catch(e) {
        DOM.jsonError.classList.remove('hidden');
        DOM.inputJson.classList.add('border-red-500');
    }
});

DOM.btnSave.addEventListener('click', async () => {
    const id = DOM.inputId.value.trim();
    let data;
    try {
        data = JSON.parse(DOM.inputJson.value);
    } catch(e) {
        showToast('Invalid JSON Payload', 'error');
        return;
    }
    
    if (!id) {
        showToast('Document ID is required', 'error');
        return;
    }
    data.id = id;
    
    try {
        await apiFetch(`/api/${currentCollection}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        closeDrawer();
        showToast('Document saved');
        loadData();
    } catch (e) {
        showToast('Failed to save document', 'error');
    }
});

window.editData = (id) => {
    const item = currentDataList.find(i => i.id === id);
    if (!item) return;
    openDrawer(id, JSON.stringify(item, null, 2));
}

window.deleteData = async (id) => {
    const isConfirmed = await showConfirmDialog(
        'Delete Document', 
        `Are you sure you want to delete document '${id}' from '${currentCollection}'?`, 
        'Delete', 
        true
    );
    if (!isConfirmed) return;

    try {
        await apiFetch(`/api/${currentCollection}/${id}`, { method: 'DELETE' });
        showToast('Document deleted');
        loadData();
    } catch (e) {
        showToast('Failed to delete', 'error');
    }
}

// --- GRAPH VISUALIZATION ---
async function loadGraph() {
    try {
        const res = await apiFetch('/api/graph-data');
        const gData = await res.json();
        
        const colors = {};
        
        if (!myGraph) {
            myGraph = ForceGraph()(DOM.graphContainer)
                .backgroundColor('transparent')
                .nodeId('id')
                .nodeVal('val')
                .nodeLabel(node => {
                    if (node.group === 'ROOT') return `<div class="bg-bg-secondary text-text-primary p-2 rounded-md border border-[var(--accent)] text-lg font-bold shadow-[0_0_15px_rgba(36,180,126,0.3)]">🌌 ROOT: ${node.name}</div>`;
                    if (node.group === 0) return `<div class="bg-bg-tertiary text-text-primary p-2 rounded-md border border-border-color text-sm font-semibold flex items-center gap-1"><span class="material-symbols-outlined text-[16px]">folder_data</span> ${node.name}</div>`;
                    return `<div class="bg-bg-tertiary text-text-secondary p-2 rounded-md border border-border-color text-xs font-mono"><span class="text-text-primary font-semibold">📄 ${node.name}</span><br/>Size: ${node.val * 50} chars</div>`;
                })
                .nodeColor(node => {
                    if (node.group === 'ROOT') return '#24b47e'; // Accent
                    if (node.group === 0) return '#6b7280'; // Folder
                    if (!colors[node.group]) {
                        colors[node.group] = `hsl(${Math.random() * 360}, 60%, 50%)`;
                    }
                    return colors[node.group];
                })
                .linkColor(() => {
                    const isDark = document.documentElement.classList.contains('dark');
                    return isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
                })
                .linkWidth(1)
                .onNodeClick(node => {
                    if (node.group !== 0 && node.group !== 'ROOT') {
                        currentCollection = node.group;
                        DOM.colName.textContent = currentCollection;
                        DOM.dataToolbar.classList.remove('hidden');
                        switchTab('table');
                        loadData();
                        setTimeout(() => editData(node.name), 300);
                    }
                });
                
            myGraph.d3Force('charge').strength(-200);
            myGraph.d3Force('link').distance(link => {
                if (link.source.id === 'ROOT_DB' || link.target.id === 'ROOT_DB') return 80; 
                return 40;
            });
        }
        
        myGraph.graphData(gData);
    } catch (e) {
        console.error('Graph error', e);
    }
}

DOM.btnCenterGraph.addEventListener('click', () => {
    if (myGraph) myGraph.zoomToFit(800, 50);
});

// --- BOOTSTRAP ---
function initApp() {
    initTheme();
    if (getToken()) {
        hideLogin();
        fetchCollections();
    } else {
        showLogin();
    }
}

initApp();
