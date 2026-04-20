window.RenderAnalytics = () => `
    <header class="page-header" style="align-items: center;">
        <div>
            <h1 class="page-title">Analytics</h1>
            <p class="page-subtitle">Platform-wide insights and historical trends</p>
        </div>
        <div class="analytics-header-actions">
            <button class="btn btn-outline" onclick="alert('Downloading CSV...')">
                <i data-lucide="file-text"></i> Export CSV
            </button>
            <button class="btn btn-outline" onclick="alert('Downloading Excel...')">
                <i data-lucide="table"></i> Export Excel
            </button>
        </div>
    </header>

    <div class="filter-grid">
        <div>
            <label class="info-label" style="display:block; margin-bottom:0.5rem;">Battery Model</label>
            <select class="select-field" id="analytics-model">
                <option value="all">All Models</option>
                <option value="ess">ESS-5000</option>
                <option value="2w">2W-LFP-60V</option>
            </select>
        </div>
        <div>
            <label class="info-label" style="display:block; margin-bottom:0.5rem;">Location</label>
            <select class="select-field" id="analytics-location">
                <option value="all">All Locations</option>
                <option value="bangalore">Bangalore</option>
                <option value="mumbai">Mumbai</option>
                <option value="delhi">Delhi</option>
            </select>
        </div>
        <div>
            <label class="info-label" style="display:block; margin-bottom:0.5rem;">Start Date</label>
            <input type="date" class="input-field" id="analytics-start-date">
        </div>
        <div>
            <label class="info-label" style="display:block; margin-bottom:0.5rem;">End Date</label>
            <input type="date" class="input-field" id="analytics-end-date">
        </div>
        <div class="filter-actions">
            <button class="btn btn-primary" id="analytics-search-btn"><i data-lucide="search"></i> Search</button>
            <button class="btn btn-outline" id="analytics-reset-btn"><i data-lucide="rotate-ccw"></i> Reset</button>
        </div>
    </div>

    <div class="kpi-grid">
        <div class="kpi-card edge-accent edge-accent-primary">
            <div class="kpi-title">Total Batteries</div>
            <div class="kpi-value" id="analytics-kpi-total">0</div>
        </div>
        <div class="kpi-card edge-accent edge-accent-success">
            <div class="kpi-title">Online Batteries</div>
            <div class="kpi-value good" id="analytics-kpi-online">0</div>
        </div>
        <div class="kpi-card edge-accent edge-accent-info">
            <div class="kpi-title">Avg SOC</div>
            <div class="kpi-value" style="color: var(--primary-color);" id="analytics-kpi-soc">0<span class="kpi-unit">%</span></div>
        </div>
        <div class="kpi-card edge-accent edge-accent-success">
            <div class="kpi-title">Avg SOH</div>
            <div class="kpi-value good" id="analytics-kpi-soh">0<span class="kpi-unit">%</span></div>
        </div>
    </div>

    <div class="analytics-charts">
        <div class="chart-card">
            <h3 class="chart-header">SOC Distribution</h3>
            <div style="height: 280px;"><canvas id="socDistChart"></canvas></div>
        </div>
        <div class="chart-card">
            <h3 class="chart-header">SOH Distribution</h3>
            <div style="height: 280px;"><canvas id="sohDistChart"></canvas></div>
        </div>
        <div class="chart-card analytics-chart-full">
            <h3 class="chart-header">Daily Usage Trends (Distance km)</h3>
            <div style="height: 280px;"><canvas id="usageChart"></canvas></div>
        </div>
    </div>

    <h3 class="analytics-section-title">Category Statistics</h3>
    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>Category</th>
                    <th>Online Count</th>
                    <th>Offline Count</th>
                    <th>Avg SOH</th>
                </tr>
            </thead>
            <tbody id="analytics-category-body">
                <tr><td colspan="4" style="text-align: center; padding: 1.5rem; color: var(--text-secondary);">Loading category statistics...</td></tr>
            </tbody>
        </table>
    </div>
`;

window.InitAnalytics = () => {
    let instances = [];
    let analyticsData = null;
    const getVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

    const getPrimaryColor = () => getVar('--primary-color') || '#0e5a6f';
    const getSuccessColor = () => getVar('--success-color') || '#2e7d32';
    const getWarningColor = () => getVar('--warning-color') || '#f57c00';
    const getGridColor = () => getVar('--border-light') || '#dde5eb';
    const getTickColor = () => getVar('--text-secondary') || '#5c6d78';

    const updateKpis = (data) => {
        const total = document.getElementById('analytics-kpi-total');
        const online = document.getElementById('analytics-kpi-online');
        const soc = document.getElementById('analytics-kpi-soc');
        const soh = document.getElementById('analytics-kpi-soh');
        if (total) total.textContent = data.kpis.total;
        if (online) online.textContent = data.kpis.online;
        if (soc) soc.innerHTML = `${data.kpis.avgSoc}<span class="kpi-unit">%</span>`;
        if (soh) soh.innerHTML = `${data.kpis.avgSoh}<span class="kpi-unit">%</span>`;
    };

    const updateCategoryTable = (data) => {
        const tbody = document.getElementById('analytics-category-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        data.categories.forEach((row) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="badge badge-blue">${row.category}</span></td>
                <td><span class="badge success"><div class="badge-dot"></div>${row.online}</span></td>
                <td><span class="badge danger"><div class="badge-dot"></div>${row.offline}</span></td>
                <td>${row.avgSoh}%</td>
            `;
            tbody.appendChild(tr);
        });
    };

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'top' }
        },
        scales: {
            x: { grid: { color: getGridColor, drawBorder: false }, ticks: { color: getTickColor } },
            y: { grid: { color: getGridColor, drawBorder: false }, ticks: { color: getTickColor } }
        }
    };

    const renderCharts = () => {
        instances.forEach((c) => c.destroy());
        instances = [];

        setTimeout(() => {
            const socCanvas = document.getElementById('socDistChart');
            if (socCanvas) {
                const buckets = [0, 0, 0, 0, 0];
                const total = analyticsData?.kpis.total || 52;
                buckets[0] = Math.round(total * 0.04);
                buckets[1] = Math.round(total * 0.1);
                buckets[2] = Math.round(total * 0.16);
                buckets[3] = Math.round(total * 0.3);
                buckets[4] = total - buckets[0] - buckets[1] - buckets[2] - buckets[3];
                instances.push(new Chart(socCanvas, {
                    type: 'bar',
                    data: {
                        labels: ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'],
                        datasets: [{
                            label: 'Batteries',
                            data: buckets,
                            backgroundColor: getPrimaryColor(),
                            borderRadius: 8,
                            borderSkipped: false
                        }]
                    },
                    options: commonOptions
                }));
            }

            const sohCanvas = document.getElementById('sohDistChart');
            if (sohCanvas) {
                const total = analyticsData?.kpis.total || 52;
                const healthy = Math.round(total * 0.67);
                const mid = Math.round(total * 0.23);
                instances.push(new Chart(sohCanvas, {
                    type: 'bar',
                    data: {
                        labels: ['<80%', '80-89%', '90-95%', '>95%'],
                        datasets: [{
                            label: 'Batteries',
                            data: [Math.max(1, total - healthy - mid - 2), 2, mid, healthy],
                            backgroundColor: getSuccessColor(),
                            borderRadius: 8,
                            borderSkipped: false
                        }]
                    },
                    options: commonOptions
                }));
            }

            const usageCanvas = document.getElementById('usageChart');
            if (usageCanvas) {
                const base = analyticsData?.kpis.total || 52;
                const values = [1, 1.1, 0.95, 1.15, 1.3, 0.8, 0.72].map((v) => Math.round(base * 22 * v));
                instances.push(new Chart(usageCanvas, {
                    type: 'line',
                    data: {
                        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                        datasets: [{
                            label: 'Total Distance (km)',
                            data: values,
                            borderColor: getWarningColor(),
                            backgroundColor: getWarningColor() + '15',
                            fill: true,
                            tension: 0.4,
                            borderWidth: 2,
                            pointBackgroundColor: getWarningColor(),
                            pointBorderColor: getVar('--surface-color') || '#ffffff',
                            pointBorderWidth: 2,
                            pointRadius: 4
                        }]
                    },
                    options: commonOptions
                }));
            }
        }, 50);
    };

    const searchBtn = document.getElementById('analytics-search-btn');
    const resetBtn = document.getElementById('analytics-reset-btn');
    const modelSelect = document.getElementById('analytics-model');
    const locationSelect = document.getElementById('analytics-location');
    const startDateInput = document.getElementById('analytics-start-date');
    const endDateInput = document.getElementById('analytics-end-date');

    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            renderCharts();
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (modelSelect) modelSelect.value = 'all';
            if (locationSelect) locationSelect.value = 'all';
            if (startDateInput) startDateInput.value = '';
            if (endDateInput) endDateInput.value = '';
            renderCharts();
        });
    }

    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (startDateInput) startDateInput.value = sevenDaysAgo.toISOString().split('T')[0];
    if (endDateInput) endDateInput.value = today.toISOString().split('T')[0];

    const loadAnalytics = async () => {
        try {
            analyticsData = await window.Services.fetchAnalytics();
            updateKpis(analyticsData);
            updateCategoryTable(analyticsData);
        } catch (error) {
            const tbody = document.getElementById('analytics-category-body');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 1.5rem; color: var(--danger-color);">Failed to load analytics data</td></tr>';
            }
        }
        renderCharts();
    };

    loadAnalytics();
    const onSelectedImeiChanged = () => {
        loadAnalytics();
    };
    window.addEventListener('selectedImeiChanged', onSelectedImeiChanged);
    window.addEventListener('themeChanged', renderCharts);

    return () => {
        instances.forEach((c) => c.destroy());
        window.removeEventListener('selectedImeiChanged', onSelectedImeiChanged);
        window.removeEventListener('themeChanged', renderCharts);
    };
};
