window.RenderCells = () => `
    <header class="page-header">
        <div>
            <h1 class="page-title">Cell Diagnostics</h1>
            <p class="page-subtitle">Monitor individual cell performance and health</p>
        </div>
    </header>

    <div class="controls-bar card cell-controls">
        <div class="cell-search-group">
            <label class="info-label" style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem;">Battery ID / BMS ID</label>
            <div class="search-wrapper cell-search-wrapper">
                <i data-lucide="search"></i>
                <input type="text" class="input-field" value="BAT-1000">
            </div>
        </div>
        <div class="cell-actions">
            <button class="btn btn-primary" onclick="alert('Search simulated')">Search</button>
            <button class="btn btn-outline"><i data-lucide="qr-code"></i> Scan QR</button>
        </div>
    </div>

    <h3 class="cell-page-title">Battery: Battery 1 (BAT-1000)</h3>
    <div class="battery-pack">
        <div class="cells-grid" id="cells-container">
            <!-- Populated by JS -->
        </div>
    </div>

    <!-- Cell Detail Modal -->
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
    let charts = {};

    const findMinMaxIndices = (data) => {
        let minVal = Math.min(...data);
        let maxVal = Math.max(...data);
        return {
            minIdx: data.indexOf(minVal),
            maxIdx: data.indexOf(maxVal),
            minVal,
            maxVal
        };
    };

    const renderModalCharts = () => {
        const MMD = window.mmd;
        const { labels, data: volData } = MMD.generateTimeSeriesData(24, 3.2, 4.2);
        const { data: curData } = MMD.generateTimeSeriesData(24, 0, 5);
        const { data: tempData } = MMD.generateTimeSeriesData(24, 20, 35);

        const getVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        const gridColor = () => getVar('--border-light') || '#dde5eb';
        const tickColor = () => getVar('--text-secondary') || '#5c6d78';

        const createChartObj = (ctxId, data, label, baseColor) => {
            const extremes = findMinMaxIndices(data);
            const pointColors = data.map((_, i) => {
                if (i === extremes.minIdx) return getVar('--info-color') || '#3a7185';
                if (i === extremes.maxIdx) return getVar('--danger-color') || '#d32f2f';
                return baseColor;
            });
            const pointRadii = data.map((_, i) => (i === extremes.minIdx || i === extremes.maxIdx) ? 6 : 3);

            return new Chart(document.getElementById(ctxId), {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: label,
                        data: data,
                        borderColor: baseColor,
                        backgroundColor: 'transparent',
                        pointBackgroundColor: pointColors,
                        pointBorderColor: pointColors,
                        pointRadius: pointRadii,
                        pointHoverRadius: 8
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { color: gridColor, drawBorder: false }, ticks: { color: tickColor } },
                        y: { grid: { color: gridColor, drawBorder: false }, ticks: { color: tickColor } }
                    }
                }
            });
        };

        charts.v = createChartObj('modalVolChart', volData, 'Voltage (V)', getVar('--primary-color') || '#0e5a6f');
        charts.c = createChartObj('modalCurChart', curData, 'Current (A)', getVar('--warning-color') || '#f57c00');
        charts.t = createChartObj('modalTempChart', tempData, 'Temp (°C)', getVar('--danger-color') || '#d32f2f');
    };

    const openModal = (cellNum, v, status) => {
        document.getElementById('cellModal').classList.add('active');
        document.getElementById('modal-title').innerText = `Cell ${cellNum} Details`;
        document.getElementById('modal-v').innerHTML = `${v}<span class="kpi-unit">V</span>`;
        document.getElementById('modal-c').innerHTML = `2.39<span class="kpi-unit">A</span>`;
        document.getElementById('modal-t').innerHTML = `28.6<span class="kpi-unit">°C</span>`;

        // Destroy existing before re-rendering
        if(charts.v) charts.v.destroy();
        if(charts.c) charts.c.destroy();
        if(charts.t) charts.t.destroy();

        // Delay slight to ensure modal is rendered and canvas has dimension
        setTimeout(() => renderModalCharts(), 50);
    };

    const container = document.getElementById('cells-container');
    if (container) {
        for(let i=1; i<=16; i++) {
            let v = (Math.random() * (4.2 - 3.2) + 3.2).toFixed(2);
            let status = 'good';
            if(v < 3.3 || v > 4.1) status = 'critical';
            else if (v < 3.6 || v > 3.9) status = 'warning';

            const div = document.createElement('div');
            div.className = `cell-box ${status}`;
            div.onclick = () => openModal(i, v, status);
            div.innerHTML = `
                <div class="cell-number">Cell ${i}</div>
                <div class="cell-voltage">${v}V</div>
                <div class="cell-status">${status}</div>
            `;
            container.appendChild(div);
        }
    }

    const closeModalBtn = document.getElementById('close-modal-btn');
    if(closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            document.getElementById('cellModal').classList.remove('active');
            if(charts.v) charts.v.destroy();
            if(charts.c) charts.c.destroy();
            if(charts.t) charts.t.destroy();
        });
    }

    return () => {
        if(charts.v) charts.v.destroy();
        if(charts.c) charts.c.destroy();
        if(charts.t) charts.t.destroy();
    };
};
