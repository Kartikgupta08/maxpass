window.RenderCells = () => `
    <header class="page-header">
        <div>
            <h1 class="page-title">Cell Diagnostics</h1>
            <p class="page-subtitle">Monitor individual cell performance and health</p>
        </div>
    </header>

    <div class="controls-bar card cell-controls">
        <div class="cell-search-group">
            <label class="info-label" style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem;">IMEI ID</label>
            <div class="search-wrapper cell-search-wrapper">
                <i data-lucide="search"></i>
                <input type="text" class="input-field" value="" id="cells-imei-input" placeholder="Enter IMEI ID">
            </div>
        </div>
        <div class="cell-actions">
            <button class="btn btn-primary" id="cells-imei-search-btn"><i data-lucide="search"></i> Search</button>
        </div>
    </div>

    <h3 class="cell-page-title" id="cells-battery-title">Battery: -</h3>

    <div class="cell-analytics-grid">
        <div class="chart-card cell-chart-card">
            <h4 class="chart-header">Cell Voltage Overview</h4>
            <div class="cell-chart-wrap"><canvas id="cellVoltageChart"></canvas></div>
        </div>
        <div class="chart-card cell-chart-card">
            <h4 class="chart-header">Cell Temperature Overview</h4>
            <div class="cell-chart-wrap"><canvas id="cellTempChart"></canvas></div>
        </div>
        <div class="chart-card cell-chart-card cell-chart-card-full">
            <h4 class="chart-header">Cell Current Overview</h4>
            <div class="cell-chart-wrap"><canvas id="cellCurrentChart"></canvas></div>
        </div>
    </div>

    <div class="battery-pack">
        <div class="cells-grid" id="cells-container">
            <!-- Populated by JS -->
        </div>
    </div>

    <div class="modal-overlay" id="cellModal">
        <div class="modal-content">
            <button class="modal-close" id="close-modal-btn"><i data-lucide="x"></i></button>
            <h2 id="modal-title" style="margin-bottom: 1.5rem;">Cell Details</h2>
            
            <div class="kpi-grid cell-modal-kpi-grid">
                <div class="card kpi-card" style="padding: 1rem;">
                    <div class="kpi-title">Voltage</div>
                    <div class="kpi-value" style="color: var(--primary-color);" id="modal-v">-<span class="kpi-unit">V</span></div>
                </div>
                <div class="card kpi-card" style="padding: 1rem;">
                    <div class="kpi-title">Current</div>
                    <div class="kpi-value" style="color: var(--warning-color);" id="modal-c">-<span class="kpi-unit">A</span></div>
                </div>
                <div class="card kpi-card" style="padding: 1rem;">
                    <div class="kpi-title">Temperature</div>
                    <div class="kpi-value critical" id="modal-t">-<span class="kpi-unit">°C</span></div>
                </div>
            </div>

            <div class="modal-body-grid">
                <div>
                    <h4 style="margin-bottom: 0.5rem;">Voltage Over Time</h4>
                    <div style="height: 200px;"><canvas id="modalVolChart"></canvas></div>
                </div>
                <div>
                    <h4 style="margin-bottom: 0.5rem;">Current Over Time</h4>
                    <div style="height: 200px;"><canvas id="modalCurChart"></canvas></div>
                </div>
                <div>
                    <h4 style="margin-bottom: 0.5rem;">Temperature Over Time</h4>
                    <div style="height: 200px;"><canvas id="modalTempChart"></canvas></div>
                </div>
            </div>
        </div>
    </div>
`;

window.InitCells = () => {
    const charts = {
        overviewV: null,
        overviewC: null,
        overviewT: null,
        modalV: null,
        modalC: null,
        modalT: null
    };

    const MMD = window.mmd;
    const getVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const gridColor = () => getVar('--border-light') || '#dde5eb';
    const tickColor = () => getVar('--text-secondary') || '#5c6d78';

    const cellData = Array.from({ length: 16 }, (_, idx) => {
        const i = idx + 1;
        const voltage = parseFloat((Math.random() * (4.2 - 3.2) + 3.2).toFixed(2));
        const current = parseFloat((Math.random() * 5.5).toFixed(2));
        const temp = parseFloat((Math.random() * (40 - 22) + 22).toFixed(1));

        let status = 'good';
        if (voltage < 3.3 || voltage > 4.1 || temp > 37.5) status = 'critical';
        else if (voltage < 3.6 || voltage > 3.9 || temp > 33.5) status = 'warning';

        return { i, voltage, current, temp, status };
    });

    const labels = cellData.map((d) => `Cell ${d.i}`);

    const renderCellCards = () => {
        const container = document.getElementById('cells-container');
        if (!container) return;

        container.innerHTML = '';
        cellData.forEach((cell) => {
            const div = document.createElement('div');
            div.className = `cell-box ${cell.status}`;
            div.onclick = () => openModal(cell);
            div.innerHTML = `
                <div class="cell-number">Cell ${cell.i}</div>
                <div class="cell-voltage">${cell.voltage.toFixed(2)}V</div>
                <div class="cell-status">${cell.status}</div>
            `;
            container.appendChild(div);
        });
    };

    const syncSelectedBattery = async () => {
        const selected = await window.Services.getSelectedBattery();
        if (!selected) return;
        if (imeiInput) imeiInput.value = selected.imei;
        if (batteryTitle) batteryTitle.textContent = `Battery: ${selected.name} (${selected.id})`;
    };

    const applyImeiSelection = async () => {
        const imei = (imeiInput?.value || '').trim();
        if (!imei) return;
        const selected = await window.Services.setSelectedImei(imei);
        if (!selected) {
            alert('IMEI not found. Please use a valid IMEI from Fleet Overview.');
            return;
        }
        if (batteryTitle) batteryTitle.textContent = `Battery: ${selected.name} (${selected.id})`;
    };

    const findMinMaxIndices = (data) => {
        const minVal = Math.min(...data);
        const maxVal = Math.max(...data);
        return {
            minIdx: data.indexOf(minVal),
            maxIdx: data.indexOf(maxVal)
        };
    };

    const renderOverviewCharts = () => {
        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: {
                legend: { display: false },
                tooltip: { enabled: true }
            },
            scales: {
                x: { grid: { color: gridColor, drawBorder: false }, ticks: { color: tickColor } },
                y: { grid: { color: gridColor, drawBorder: false }, ticks: { color: tickColor } }
            }
        };

        const voltageValues = cellData.map((d) => d.voltage);
        const currentValues = cellData.map((d) => d.current);
        const tempValues = cellData.map((d) => d.temp);

        if (charts.overviewV) charts.overviewV.destroy();
        if (charts.overviewC) charts.overviewC.destroy();
        if (charts.overviewT) charts.overviewT.destroy();

        charts.overviewV = new Chart(document.getElementById('cellVoltageChart'), {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Voltage (V)',
                    data: voltageValues,
                    borderColor: getVar('--primary-color') || '#0e5a6f',
                    backgroundColor: (getVar('--primary-light') || '#d8e8f4') + '80',
                    fill: true,
                    tension: 0.35,
                    pointRadius: 4,
                    pointHoverRadius: 7
                }]
            },
            options: commonOptions
        });

        charts.overviewT = new Chart(document.getElementById('cellTempChart'), {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Temperature (°C)',
                    data: tempValues,
                    backgroundColor: getVar('--danger-color') || '#d32f2f',
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: commonOptions
        });

        charts.overviewC = new Chart(document.getElementById('cellCurrentChart'), {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Current (A)',
                    data: currentValues,
                    borderColor: getVar('--warning-color') || '#f57c00',
                    backgroundColor: (getVar('--warning-light') || '#fff3e0') + '88',
                    fill: true,
                    tension: 0.35,
                    pointRadius: 4,
                    pointHoverRadius: 7
                }]
            },
            options: commonOptions
        });
    };

    const createModalChart = (ctxId, data, label, baseColor) => {
        const extremes = findMinMaxIndices(data);
        const pointColors = data.map((_, i) => {
            if (i === extremes.minIdx) return getVar('--info-color') || '#3a7185';
            if (i === extremes.maxIdx) return getVar('--danger-color') || '#d32f2f';
            return baseColor;
        });
        const pointRadii = data.map((_, i) => (i === extremes.minIdx || i === extremes.maxIdx ? 6 : 3));

        return new Chart(document.getElementById(ctxId), {
            type: 'line',
            data: {
                labels: MMD.generateTimeSeriesData(24, 0, 1).labels,
                datasets: [{
                    label,
                    data,
                    borderColor: baseColor,
                    backgroundColor: 'transparent',
                    pointBackgroundColor: pointColors,
                    pointBorderColor: pointColors,
                    pointRadius: pointRadii,
                    pointHoverRadius: 8,
                    tension: 0.35
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'index' },
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: gridColor, drawBorder: false }, ticks: { color: tickColor } },
                    y: { grid: { color: gridColor, drawBorder: false }, ticks: { color: tickColor } }
                }
            }
        });
    };

    const renderModalCharts = (cell) => {
        const { data: volData } = MMD.generateTimeSeriesData(24, Math.max(3.1, cell.voltage - 0.25), Math.min(4.2, cell.voltage + 0.2));
        const { data: curData } = MMD.generateTimeSeriesData(24, Math.max(0, cell.current - 1.2), Math.min(7.5, cell.current + 1.6));
        const { data: tempData } = MMD.generateTimeSeriesData(24, Math.max(18, cell.temp - 4), Math.min(48, cell.temp + 5));

        if (charts.modalV) charts.modalV.destroy();
        if (charts.modalC) charts.modalC.destroy();
        if (charts.modalT) charts.modalT.destroy();

        charts.modalV = createModalChart('modalVolChart', volData, 'Voltage (V)', getVar('--primary-color') || '#0e5a6f');
        charts.modalC = createModalChart('modalCurChart', curData, 'Current (A)', getVar('--warning-color') || '#f57c00');
        charts.modalT = createModalChart('modalTempChart', tempData, 'Temp (°C)', getVar('--danger-color') || '#d32f2f');
    };

    const openModal = (cell) => {
        document.getElementById('cellModal').classList.add('active');
        document.getElementById('modal-title').innerText = `Cell ${cell.i} Details`;
        document.getElementById('modal-v').innerHTML = `${cell.voltage.toFixed(2)}<span class="kpi-unit">V</span>`;
        document.getElementById('modal-c').innerHTML = `${cell.current.toFixed(2)}<span class="kpi-unit">A</span>`;
        document.getElementById('modal-t').innerHTML = `${cell.temp.toFixed(1)}<span class="kpi-unit">°C</span>`;

        setTimeout(() => renderModalCharts(cell), 50);
    };

    const onCloseModal = () => {
        document.getElementById('cellModal').classList.remove('active');
        if (charts.modalV) charts.modalV.destroy();
        if (charts.modalC) charts.modalC.destroy();
        if (charts.modalT) charts.modalT.destroy();
        charts.modalV = null;
        charts.modalC = null;
        charts.modalT = null;
    };

    renderCellCards();
    renderOverviewCharts();
    syncSelectedBattery();

    imeiSearchBtn?.addEventListener('click', applyImeiSelection);
    imeiInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') applyImeiSelection();
    });

    const onSelectedImeiChanged = () => {
        syncSelectedBattery();
    };
    window.addEventListener('selectedImeiChanged', onSelectedImeiChanged);

    const closeModalBtn = document.getElementById('close-modal-btn');
    closeModalBtn?.addEventListener('click', onCloseModal);

    return () => {
        closeModalBtn?.removeEventListener('click', onCloseModal);
        imeiSearchBtn?.removeEventListener('click', applyImeiSelection);
        window.removeEventListener('selectedImeiChanged', onSelectedImeiChanged);

        Object.keys(charts).forEach((k) => {
            if (charts[k]) charts[k].destroy();
            charts[k] = null;
        });
    };
};
    const imeiInput = document.getElementById('cells-imei-input');
    const imeiSearchBtn = document.getElementById('cells-imei-search-btn');
    const batteryTitle = document.getElementById('cells-battery-title');
