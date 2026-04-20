window.RenderBattery = () => `
    <header class="page-header">
        <div>
            <h1 class="page-title">Battery Insights</h1>
            <p class="page-subtitle">View detailed battery metrics and performance</p>
        </div>
    </header>

    <div class="controls-bar card battery-controls">
        <div class="battery-search-group">
            <label class="info-label" style="display: block; margin-bottom: 0.5rem;">IMEI ID</label>
            <div class="search-wrapper battery-search-wrapper">
                <i data-lucide="search"></i>
                <input type="text" class="input-field" value="" id="bat-search" placeholder="Enter IMEI ID">
            </div>
        </div>
        <div class="battery-actions">
            <button class="btn btn-primary" id="battery-imei-search-btn"><i data-lucide="search"></i> Search</button>
        </div>
    </div>

    <div class="kpi-grid">
        <div class="card kpi-card edge-accent edge-accent-primary">
            <div class="kpi-title">State of Charge</div>
            <div class="kpi-value" style="color: var(--primary-color);">90.7<span class="kpi-unit">%</span></div>
        </div>
        <div class="card kpi-card edge-accent edge-accent-success">
            <div class="kpi-title">State of Health</div>
            <div class="kpi-value good">95.0<span class="kpi-unit">%</span></div>
        </div>
        <div class="card kpi-card edge-accent edge-accent-info">
            <div class="kpi-title">Voltage</div>
            <div class="kpi-value" style="color: var(--primary-color);">51.3<span class="kpi-unit">V</span></div> 
        </div>
        <div class="card kpi-card edge-accent edge-accent-danger">
            <div class="kpi-title">Current</div>
            <div class="kpi-value critical">24.8<span class="kpi-unit">A</span></div>
        </div>
    </div>

    <!-- Inject battery CSS explicitly here or in index.html. To cleanly support SPA without complex loaders, we'll ensure index.html includes it or we dynamically append it if not using standard id toggling -->

    <div class="charts-grid">
        <div class="chart-card">
            <div class="chart-header">State of Charge (SOC)</div>
            <div class="chart-canvas-wrap">
                <canvas id="socChart"></canvas>
            </div>
        </div>
        <div class="chart-card">
            <div class="chart-header">State of Health (SOH)</div>
            <div class="chart-canvas-wrap">
                <canvas id="sohChart"></canvas>
            </div>
        </div>
        <div class="chart-card">
            <div class="chart-header">Voltage</div>
            <div class="chart-canvas-wrap">
                <canvas id="voltageChart"></canvas>
            </div>
        </div>
        <div class="chart-card">
            <div class="chart-header">Current</div>
            <div class="chart-canvas-wrap">
                <canvas id="currentChart"></canvas>
            </div>
        </div>
        <div class="chart-card chart-card-full">
            <div class="chart-header">Temperature</div>
            <div class="chart-canvas-wrap chart-canvas-wrap-lg">
                <canvas id="tempChart"></canvas>
            </div>
        </div>
    </div>

    <div class="card battery-spec-card">
        <h3 class="chart-header page-section-title">Battery Specifications</h3>
        <div class="info-panel">
            <div class="info-item"><span class="info-label">Battery ID</span><span class="info-value" id="battery-spec-id">-</span></div>
            <div class="info-item"><span class="info-label">IMEI</span><span class="info-value" id="battery-spec-imei">-</span></div>
            <div class="info-item"><span class="info-label">Power</span><span class="info-value">1.27 kW</span></div>
            <div class="info-item"><span class="info-label">Cycles</span><span class="info-value">245</span></div>
            <div class="info-item"><span class="info-label">Temperature</span><span class="info-value">28°C</span></div>
            <div class="info-item"><span class="info-label">Cell Count</span><span class="info-value">16 Series</span></div>
        </div>
    </div>
    <link rel="stylesheet" href="css/battery.css">
`;

window.InitBattery = () => {
    let instances = [];

    const getVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const gridColor = () => getVar('--border-light') || '#dde5eb';
    const tickColor = () => getVar('--text-secondary') || '#5c6d78';

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { display: false, drawBorder: false }, ticks: { color: tickColor } },
            y: { grid: { display: false, drawBorder: false }, ticks: { color: tickColor } }
        },
        elements: {
            line: { tension: 0.4 },
            point: { radius: 3, hoverRadius: 6 }
        },
        interaction: { intersect: false, mode: 'index' },
    };

    const MMD = window.mmd;
    const { labels, data: socData } = MMD.generateTimeSeriesData(24, 75, 100);
    const { data: sohData } = MMD.generateTimeSeriesData(24, 94, 100);
    const { data: volData } = MMD.generateTimeSeriesData(24, 48, 54);
    const { data: curData } = MMD.generateTimeSeriesData(24, 0, 30);
    const { data: tempData } = MMD.generateTimeSeriesData(24, 25, 45);

    setTimeout(() => {
        const primary = getVar('--primary-color') || '#0e5a6f';
        const primaryLight = getVar('--primary-light') || 'rgba(14, 90, 111, 0.16)';
        const success = getVar('--success-color') || '#2e7d32';
        const danger = getVar('--danger-color') || '#d32f2f';
        const warning = getVar('--warning-color') || '#f57c00';

        instances.push(new Chart(document.getElementById('socChart'), {
            type: 'line', data: { labels, datasets: [{ label: 'SOC (%)', data: socData, borderColor: primary, backgroundColor: primaryLight, fill: true }] }, options: commonOptions
        }));
        instances.push(new Chart(document.getElementById('sohChart'), {
            type: 'line', data: { labels, datasets: [{ label: 'SOH (%)', data: sohData, borderColor: success, backgroundColor: getVar('--success-light') || 'rgba(46, 125, 50, 0.16)', fill: true }] }, options: commonOptions
        }));
        instances.push(new Chart(document.getElementById('voltageChart'), {
            type: 'line', data: { labels, datasets: [{ label: 'Voltage (V)', data: volData, borderColor: primary, backgroundColor: primaryLight, fill: true }] }, options: commonOptions
        }));
        instances.push(new Chart(document.getElementById('currentChart'), {
            type: 'line', data: { labels, datasets: [{ label: 'Current (A)', data: curData, borderColor: warning, backgroundColor: getVar('--warning-light') || 'rgba(245, 124, 0, 0.16)', fill: true }] }, options: commonOptions
        }));
        instances.push(new Chart(document.getElementById('tempChart'), {
            type: 'line', data: { labels, datasets: [{ label: 'Temperature (°C)', data: tempData, borderColor: danger, backgroundColor: getVar('--danger-light') || 'rgba(211, 47, 47, 0.16)', fill: true }] }, options: commonOptions
        }));
    }, 50);

    const searchInput = document.getElementById('bat-search');
    const searchBtn = document.getElementById('battery-imei-search-btn');
    const specId = document.getElementById('battery-spec-id');
    const specImei = document.getElementById('battery-spec-imei');

    const syncSelectedBattery = async () => {
        const selected = await window.Services.getSelectedBattery();
        if (!selected) return;
        if (searchInput) searchInput.value = selected.imei;
        if (specId) specId.textContent = selected.id;
        if (specImei) specImei.textContent = selected.imei;
    };

    const applyImeiSelection = async () => {
        const imei = (searchInput?.value || '').trim();
        if (!imei) return;
        const selected = await window.Services.setSelectedImei(imei);
        if (!selected) {
            alert('IMEI not found. Please use a valid IMEI from Fleet Overview.');
            return;
        }
        if (specId) specId.textContent = selected.id;
        if (specImei) specImei.textContent = selected.imei;
    };

    searchBtn?.addEventListener('click', applyImeiSelection);
    searchInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') applyImeiSelection();
    });

    const onSelectedImeiChanged = () => {
        syncSelectedBattery();
    };
    window.addEventListener('selectedImeiChanged', onSelectedImeiChanged);
    syncSelectedBattery();

    return () => {
        instances.forEach(chart => chart.destroy());
        searchBtn?.removeEventListener('click', applyImeiSelection);
        window.removeEventListener('selectedImeiChanged', onSelectedImeiChanged);
    };
};
