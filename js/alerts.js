window.RenderAlerts = () => `
    <header class="page-header">
        <div>
            <h1 class="page-title">Alerts & Notifications</h1>
            <p class="page-subtitle">Manage system alerts and critical battery events</p>
        </div>
    </header>

    <div class="kpi-grid">
        <div class="card kpi-card edge-accent edge-accent-primary">
            <div class="kpi-title">Total Active Alerts</div>
            <div class="kpi-value" id="alerts-kpi-total">0</div>
        </div>
        <div class="card kpi-card edge-accent edge-accent-danger">
            <div class="kpi-title">High Severity</div>
            <div class="kpi-value critical" id="alerts-kpi-high">0</div>
        </div>
        <div class="card kpi-card edge-accent edge-accent-warning">
            <div class="kpi-title">Medium Severity</div>
            <div class="kpi-value warning" id="alerts-kpi-medium">0</div>
        </div>
        <div class="card kpi-card edge-accent edge-accent-success">
            <div class="kpi-title">Resolved (Today)</div>
            <div class="kpi-value good" id="alerts-kpi-resolved">0</div>
        </div>
    </div>

    <div class="controls-bar card">
        <div class="search-wrapper" style="flex-grow: 2;">
            <i data-lucide="search"></i>
            <input type="text" class="input-field" id="alerts-search" placeholder="Search alerts...">
        </div>
        <select class="select-field" id="alerts-severity">
            <option value="all">All Severities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
        </select>
        <select class="select-field" id="alerts-status">
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="resolved">Resolved</option>
        </select>
        <button class="btn btn-primary" id="alerts-filter-btn"><i data-lucide="filter"></i> Filter</button>
    </div>

    <div class="table-container">
        <table id="alerts-table">
            <thead>
                <tr>
                    <th>Battery</th>
                    <th>Alert Type</th>
                    <th>Severity</th>
                    <th>Timestamp</th>
                    <th>Status</th>
                    <th>Description</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody id="alerts-table-body">
                <tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">Loading alerts...</td></tr>
            </tbody>
        </table>
    </div>

    <div class="card alerts-legend-card">
        <h4 style="margin-bottom: 0.5rem; font-size: 0.875rem;">Legend</h4>
        <div class="alerts-legend-items">
            <span class="badge danger"><div class="badge-dot"></div> High</span>
            <span class="badge warning"><div class="badge-dot"></div> Medium</span>
            <span class="badge success"><div class="badge-dot"></div> Low</span>
        </div>
    </div>
`;

window.InitAlerts = () => {
    const tbody = document.getElementById('alerts-table-body');
    const searchInput = document.getElementById('alerts-search');
    const severitySelect = document.getElementById('alerts-severity');
    const statusSelect = document.getElementById('alerts-status');
    const filterBtn = document.getElementById('alerts-filter-btn');
    const kpiTotal = document.getElementById('alerts-kpi-total');
    const kpiHigh = document.getElementById('alerts-kpi-high');
    const kpiMedium = document.getElementById('alerts-kpi-medium');
    const kpiResolved = document.getElementById('alerts-kpi-resolved');

    let allAlerts = [];

    const setTableMessage = (message) => {
        if (!tbody) return;
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">${message}</td></tr>`;
    };

    const renderKpis = (alerts) => {
        const totalActive = alerts.filter((a) => a.status === 'Active').length;
        const high = alerts.filter((a) => a.sev === 'High').length;
        const medium = alerts.filter((a) => a.sev === 'Medium').length;
        const resolved = alerts.filter((a) => a.status === 'Resolved').length;
        if (kpiTotal) kpiTotal.textContent = totalActive;
        if (kpiHigh) kpiHigh.textContent = high;
        if (kpiMedium) kpiMedium.textContent = medium;
        if (kpiResolved) kpiResolved.textContent = resolved;
    };

    const renderTable = (alerts) => {
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!alerts.length) {
            setTableMessage('No alerts found');
            return;
        }

        alerts.forEach((alert) => {
            let sevClass = '';
            if (alert.sev === 'High') sevClass = 'danger';
            if (alert.sev === 'Medium') sevClass = 'warning';
            if (alert.sev === 'Low') sevClass = 'success';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight: 500;">${alert.id}</td>
                <td>${alert.type}</td>
                <td>
                    <span class="badge ${sevClass}">
                        <div class="badge-dot"></div>
                        ${alert.sev}
                    </span>
                </td>
                <td style="color: var(--text-secondary);">${alert.time}</td>
                <td>${alert.status}</td>
                <td style="color: var(--text-secondary); max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${alert.desc}">${alert.desc}</td>
                <td>
                    <button class="btn btn-outline" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;">Acknowledge</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    };

    const applyFilters = () => {
        const q = (searchInput?.value || '').toLowerCase();
        const sevFilter = severitySelect?.value || 'all';
        const statusFilter = statusSelect?.value || 'all';

        const filtered = allAlerts.filter((a) => {
            const sev = a.sev.toLowerCase();
            const status = a.status.toLowerCase();
            const matchQuery = !q ||
                a.id.toLowerCase().includes(q) ||
                a.type.toLowerCase().includes(q) ||
                a.desc.toLowerCase().includes(q);
            const matchSev = sevFilter === 'all' || sev === sevFilter;
            const matchStatus = statusFilter === 'all' || status === statusFilter;
            return matchQuery && matchSev && matchStatus;
        });

        renderKpis(filtered);
        renderTable(filtered);
    };

    const onFilter = () => applyFilters();
    const onSearch = () => applyFilters();

    filterBtn?.addEventListener('click', onFilter);
    searchInput?.addEventListener('input', onSearch);

    const loadAlerts = async () => {
        setTableMessage('Loading alerts...');
        try {
            allAlerts = await window.Services.fetchAlerts();
            applyFilters();
        } catch (error) {
            setTableMessage('Failed to load alerts');
            renderKpis([]);
        }
    };

    loadAlerts();
    const onSelectedImeiChanged = () => {
        loadAlerts();
    };
    window.addEventListener('selectedImeiChanged', onSelectedImeiChanged);

    return () => {
        filterBtn?.removeEventListener('click', onFilter);
        searchInput?.removeEventListener('input', onSearch);
        window.removeEventListener('selectedImeiChanged', onSelectedImeiChanged);
    };
};
