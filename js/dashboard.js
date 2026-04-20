window.RenderDashboard = () => `
    <header class="page-header">
        <div>
            <h1 class="page-title">Fleet Overview</h1>
            <p class="page-subtitle">Monitor and manage all registered batteries</p>
        </div>
    </header>

    <div class="kpi-grid fleet-kpi-grid">
        <div class="kpi-card fleet-kpi-card edge-accent edge-accent-primary">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.75rem;">
                <div>
                    <div class="kpi-title">Total Batteries</div>
                    <div class="kpi-value" id="kpi-total-batteries">0</div>
                </div>
                <i data-lucide="battery-charging" style="color: var(--primary-color); width: 28px; height: 28px;"></i>
            </div>
        </div>
        <div class="kpi-card fleet-kpi-card edge-accent edge-accent-success">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.75rem;">
                <div>
                    <div class="kpi-title">Online Batteries</div>
                    <div class="kpi-value good" id="kpi-online-batteries">0</div>
                </div>
                <i data-lucide="radio-tower" style="color: var(--success-color); width: 28px; height: 28px;"></i>
            </div>
        </div>
        <div class="kpi-card fleet-kpi-card edge-accent edge-accent-danger">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.75rem;">
                <div>
                    <div class="kpi-title">Offline Batteries</div>
                    <div class="kpi-value critical" id="kpi-offline-batteries">0</div>
                </div>
                <i data-lucide="wifi-off" style="color: var(--danger-color); width: 28px; height: 28px;"></i>
            </div>
        </div>
        <div class="kpi-card fleet-kpi-card edge-accent edge-accent-warning">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.75rem;">
                <div>
                    <div class="kpi-title">Faulty Batteries</div>
                    <div class="kpi-value warning" id="kpi-faulty-batteries">0</div>
                </div>
                <i data-lucide="alert-triangle" style="color: var(--warning-color); width: 28px; height: 28px;"></i>
            </div>
        </div>
    </div>

    <div class="controls-bar card">
        <div class="search-wrapper">
            <i data-lucide="search"></i>
            <input type="text" class="input-field" id="dashboard-search" placeholder="Search by name, battery ID, or IMEI...">
        </div>
        <select class="select-field" id="dashboard-category">
            <option value="all">All Categories</option>
            <option value="ess">ESS</option>
            <option value="2w">2-Wheeler</option>
            <option value="3w">3-Wheeler</option>
            <option value="other">Other</option>
        </select>
        <select class="select-field" id="dashboard-status">
            <option value="all">All Status</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
        </select>
        <div class="search-wrapper" style="max-width: 320px;">
            <i data-lucide="smartphone"></i>
            <input type="text" class="input-field" id="global-imei-input" placeholder="Set global IMEI ID...">
        </div>
        <button class="btn btn-primary" id="global-imei-apply">Apply IMEI</button>
        <button class="btn btn-outline" id="global-imei-clear">Clear IMEI</button>
    </div>

    <div style="margin-bottom: var(--space-4); color: var(--text-secondary); font-size: 0.875rem; padding: 0 var(--space-2);" id="battery-count-label">Loading batteries...</div>

    <div class="table-container">
        <table id="dashboard-table">
            <thead>
                <tr>
                    <th><button class="sort-header" data-column="name">Name <i data-lucide="arrow-up-down" style="width: 14px; height: 14px; display:inline-block; vertical-align:-2px;"></i></button></th>
                    <th><button class="sort-header" data-column="status">Status <i data-lucide="arrow-up-down" style="width: 14px; height: 14px; display:inline-block; vertical-align:-2px;"></i></button></th>
                    <th>Network</th>
                    <th>Tag</th>
                    <th>Last Update</th>
                    <th><button class="sort-header" data-column="speed">Speed (km/h) <i data-lucide="arrow-up-down" style="width: 14px; height: 14px; display:inline-block; vertical-align:-2px;"></i></button></th>
                    <th><button class="sort-header" data-column="distance">Today Distance <i data-lucide="arrow-up-down" style="width: 14px; height: 14px; display:inline-block; vertical-align:-2px;"></i></button></th>
                    <th>Address</th>
                    <th>Plan Ends</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody id="dashboard-table-body">
                <tr><td colspan="10" style="text-align: center; padding: 2rem; color: var(--text-secondary);">Loading batteries...</td></tr>
            </tbody>
        </table>
        <div class="pagination">
            <span id="page-display">Page 1 of 1</span>
            <div class="pagination-controls">
                <button class="page-btn" id="prev-page" title="Previous page">
                    <i data-lucide="chevron-left"></i>
                </button>
                <span id="pagination-numbers" style="display: flex; gap: 0.25rem;"></span>
                <button class="page-btn" id="next-page" title="Next page">
                    <i data-lucide="chevron-right"></i>
                </button>
            </div>
        </div>
    </div>
`;

window.InitDashboard = () => {
    let allBatteries = [];
    let filteredBatteries = [];
    let currentPage = 1;
    const pageSize = 15;
    let sortColumn = null;
    let sortDirection = 'asc';

    const tbody = document.getElementById('dashboard-table-body');
    const countLabel = document.getElementById('battery-count-label');
    const searchInput = document.getElementById('dashboard-search');
    const categorySelect = document.getElementById('dashboard-category');
    const statusSelect = document.getElementById('dashboard-status');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    const pageDisplay = document.getElementById('page-display');
    const paginationNumbers = document.getElementById('pagination-numbers');
    const totalKpi = document.getElementById('kpi-total-batteries');
    const onlineKpi = document.getElementById('kpi-online-batteries');
    const offlineKpi = document.getElementById('kpi-offline-batteries');
    const faultyKpi = document.getElementById('kpi-faulty-batteries');
    const globalImeiInput = document.getElementById('global-imei-input');
    const globalImeiApply = document.getElementById('global-imei-apply');
    const globalImeiClear = document.getElementById('global-imei-clear');

    const setTableMessage = (message) => {
        if (!tbody) return;
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding: 2rem; color: var(--text-secondary);">${message}</td></tr>`;
    };

    const updateFleetKpis = () => {
        const total = allBatteries.length;
        const online = allBatteries.filter((bat) => bat.status === 'Online').length;
        const offline = total - online;
        const faulty = allBatteries.filter((bat) => bat.faulty).length;

        if (totalKpi) totalKpi.textContent = total;
        if (onlineKpi) onlineKpi.textContent = online;
        if (offlineKpi) offlineKpi.textContent = offline;
        if (faultyKpi) faultyKpi.textContent = faulty;
    };

    const renderTable = () => {
        if (!tbody) return;
        tbody.innerHTML = '';

        const start = (currentPage - 1) * pageSize;
        const pageData = filteredBatteries.slice(start, start + pageSize);

        if (pageData.length === 0) {
            setTableMessage('No batteries found');
            return;
        }

        pageData.forEach((bat) => {
            const statusClass = bat.status === 'Online' ? 'success' : 'danger';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div style="font-weight: 500;">${bat.name}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">${bat.id}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">IMEI: ${bat.imei}</div>
                </td>
                <td>
                    <span class="badge ${statusClass}">
                        <div class="badge-dot"></div>
                        ${bat.status}
                    </span>
                </td>
                <td>${bat.network}</td>
                <td><span class="badge badge-blue">${bat.tag}</span></td>
                <td>${bat.lastUpdate}</td>
                <td>${bat.speed}</td>
                <td>${bat.distance} km</td>
                <td>${bat.address}</td>
                <td>${bat.planEnds}</td>
                <td>
                    <button class="btn-icon" onclick="window.location.hash='/battery'" title="View Details" aria-label="View battery details">
                        <i data-lucide="more-vertical"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    };

    const updatePagination = () => {
        const totalPages = Math.max(1, Math.ceil(filteredBatteries.length / pageSize));
        pageDisplay.textContent = `Page ${currentPage} of ${totalPages}`;

        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage === totalPages;

        paginationNumbers.innerHTML = '';
        const maxPages = Math.min(5, totalPages);
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + maxPages - 1);

        if (endPage - startPage < maxPages - 1) {
            startPage = Math.max(1, endPage - maxPages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            const btn = document.createElement('button');
            btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
            btn.textContent = i;
            btn.onclick = () => {
                currentPage = i;
                renderTable();
                updatePagination();
                if (typeof lucide !== 'undefined') lucide.createIcons();
            };
            paginationNumbers.appendChild(btn);
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    const applyFilters = () => {
        const searchTerm = searchInput?.value.toLowerCase() || '';
        const category = categorySelect?.value || 'all';
        const status = statusSelect?.value || 'all';

        filteredBatteries = allBatteries.filter((bat) => {
            const matchSearch = !searchTerm ||
                bat.name.toLowerCase().includes(searchTerm) ||
                bat.id.toLowerCase().includes(searchTerm) ||
                bat.imei.toLowerCase().includes(searchTerm);

            const tag = bat.tag.toLowerCase();
            const matchCategory = category === 'all' ||
                tag === category.toLowerCase() ||
                (category === 'other' && !['ess', '2w', '3w'].includes(tag));
            const matchStatus = status === 'all' || bat.status === status;

            return matchSearch && matchCategory && matchStatus;
        });

        currentPage = 1;

        if (countLabel) {
            const showing = Math.min(pageSize, filteredBatteries.length);
            countLabel.textContent = `Showing ${showing} of ${filteredBatteries.length} batteries`;
        }

        renderTable();
        updatePagination();
    };

    const applyGlobalImei = async () => {
        const imei = (globalImeiInput?.value || '').trim();
        if (!imei) return;
        const selected = await window.Services.setSelectedImei(imei);
        if (!selected) {
            alert('IMEI not found. Please enter a valid IMEI ID from fleet records.');
            return;
        }
        if (searchInput) searchInput.value = selected.imei;
        if (countLabel) countLabel.textContent = `Global IMEI selected: ${selected.imei} (${selected.id})`;
        applyFilters();
    };

    const clearGlobalImei = () => {
        window.Services.clearSelectedImei();
        if (globalImeiInput) globalImeiInput.value = '';
        applyFilters();
    };

    const sortTable = (column) => {
        if (sortColumn === column) {
            sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            sortColumn = column;
            sortDirection = 'asc';
        }

        filteredBatteries.sort((a, b) => {
            let aVal = a[column];
            let bVal = b[column];

            if (typeof aVal === 'string' && !isNaN(aVal)) {
                aVal = parseFloat(aVal);
                bVal = parseFloat(bVal);
            }

            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if (sortDirection === 'asc') return aVal > bVal ? 1 : -1;
            return aVal < bVal ? 1 : -1;
        });

        currentPage = 1;
        renderTable();
        updatePagination();
    };

    const onSearch = () => applyFilters();
    const onCategory = () => applyFilters();
    const onStatus = () => applyFilters();

    searchInput?.addEventListener('input', onSearch);
    categorySelect?.addEventListener('change', onCategory);
    statusSelect?.addEventListener('change', onStatus);

    document.querySelectorAll('.sort-header').forEach((btn) => {
        btn.addEventListener('click', () => {
            sortTable(btn.dataset.column);
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });
    });

    prevBtn?.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
            updatePagination();
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    });

    nextBtn?.addEventListener('click', () => {
        const totalPages = Math.max(1, Math.ceil(filteredBatteries.length / pageSize));
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
            updatePagination();
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    });

    globalImeiApply?.addEventListener('click', applyGlobalImei);
    globalImeiClear?.addEventListener('click', clearGlobalImei);
    globalImeiInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') applyGlobalImei();
    });

    const loadBatteries = async () => {
        setTableMessage('Loading batteries...');
        try {
            allBatteries = await window.Services.fetchBatteries();
            filteredBatteries = [...allBatteries];
            const selectedImei = window.Services.getSelectedImei();
            if (selectedImei && globalImeiInput) {
                globalImeiInput.value = selectedImei;
                if (searchInput) searchInput.value = selectedImei;
            }
            updateFleetKpis();
            applyFilters();
        } catch (error) {
            updateFleetKpis();
            setTableMessage('Failed to load battery data');
            if (countLabel) countLabel.textContent = 'Unable to fetch batteries';
        }
    };

    loadBatteries();

    return () => {
        searchInput?.removeEventListener('input', onSearch);
        categorySelect?.removeEventListener('change', onCategory);
        statusSelect?.removeEventListener('change', onStatus);
        globalImeiApply?.removeEventListener('click', applyGlobalImei);
        globalImeiClear?.removeEventListener('click', clearGlobalImei);
    };
};
