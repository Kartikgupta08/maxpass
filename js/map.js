window.RenderMap = () => `
    <header class="page-header">
        <div>
            <h1 class="page-title">Live Locations</h1>
            <p class="page-subtitle">Track battery positions and live operating status</p>
        </div>
    </header>

    <div class="kpi-grid" style="margin-bottom: 1.5rem;">
        <div class="card kpi-card edge-accent edge-accent-primary flex justify-between items-center" style="flex-direction: row;">
            <div>
                <div class="kpi-title">Total Batteries</div>
                <div class="kpi-value" id="map-kpi-total">0</div>
            </div>
            <i data-lucide="map-pin" style="color: var(--text-secondary); width: 32px; height: 32px;"></i>
        </div>
        <div class="card kpi-card edge-accent edge-accent-success flex justify-between items-center" style="flex-direction: row;">
            <div>
                <div class="kpi-title">Online Batteries</div>
                <div class="kpi-value good" id="map-kpi-online">0</div>
            </div>
            <i data-lucide="zap" style="color: var(--success-color); width: 32px; height: 32px;"></i>
        </div>
        <div class="card kpi-card edge-accent edge-accent-danger flex justify-between items-center" style="flex-direction: row;">
            <div>
                <div class="kpi-title">Offline Batteries</div>
                <div class="kpi-value critical" id="map-kpi-offline">0</div>
            </div>
            <i data-lucide="zap-off" style="color: var(--danger-color); width: 32px; height: 32px;"></i>
        </div>
    </div>

    <div class="map-layout">
        <div class="map-container">
            <div id="map"></div>
            <div class="map-legend">
                <span style="display:flex; align-items:center; gap:0.5rem;"><div style="width:12px;height:12px;border-radius:50%;background:var(--danger-color);"></div> Battery Location</span>
                <span style="display:flex; align-items:center; gap:0.5rem;"><div style="width:12px;height:12px;border-radius:50%;background:#94a3b8;"></div> Offline Battery</span>
            </div>
        </div>

        <div class="side-panel" id="sidePanel">
            <div class="side-panel-empty" id="sidePanelEmpty">
                <i data-lucide="map-pin" style="width: 48px; height: 48px;"></i>
                <p>Click on a marker to view battery details</p>
            </div>

            <div class="side-panel-content" id="sidePanelContent">
                <h3 style="margin-bottom: 2rem;">Battery Details</h3>
                <div class="battery-header" id="panelBotId">BAT-1000</div>
                <div class="battery-status-badge">
                    <span class="badge success" id="panelStatus">
                        <div class="badge-dot"></div> Online
                    </span>
                </div>

                <div class="metric-grid">
                    <div class="metric-box">
                        <div class="kpi-title">SOC</div>
                        <div class="kpi-value" style="font-size: 1.5rem; color: var(--primary-color);" id="panelSoc">90<span class="kpi-unit">%</span></div>
                    </div>
                    <div class="metric-box">
                        <div class="kpi-title">SOH</div>
                        <div class="kpi-value" style="font-size: 1.5rem; color: var(--success-color);" id="panelSoh">95<span class="kpi-unit">%</span></div>
                    </div>
                    <div class="metric-box">
                        <div class="kpi-title">Voltage</div>
                        <div class="kpi-value" style="font-size: 1.5rem;" id="panelVol">51.3<span class="kpi-unit">V</span></div>
                    </div>
                    <div class="metric-box">
                        <div class="kpi-title">Current</div>
                        <div class="kpi-value" style="font-size: 1.5rem;" id="panelCur">24.8<span class="kpi-unit">A</span></div>
                    </div>
                    <div class="metric-box" style="grid-column: 1 / -1;">
                        <div class="kpi-title">Temperature</div>
                        <div class="kpi-value critical" style="font-size: 1.5rem;" id="panelTemp">28<span class="kpi-unit">°C</span></div>
                    </div>
                </div>

                <button class="btn btn-primary" style="width: 100%; margin-top: 2rem;" onclick="window.location.hash='/battery'">View Full Analytics</button>
            </div>
        </div>
    </div>
`;

window.InitMap = () => {
    let mapInstance = null;
    let resizeHandler = null;

    const initializeLeaflet = (batteries) => {
        if(mapInstance) return;
        mapInstance = L.map('map').setView([19.0760, 72.8777], 11);

        const getVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(mapInstance);

        const createIcon = (color) => {
            return L.divIcon({
                className: "custom-pin",
                iconAnchor: [0, 24], labelAnchor: [-6, 0], popupAnchor: [0, -36],
                html: `<span style="background-color:${color}; width: 1.5rem; height: 1.5rem; display: block; left: -0.75rem; top: -0.75rem; position: relative; border-radius: 3rem 3rem 0; transform: rotate(45deg); border: 2px solid #FFFFFF; box-shadow: 0 2px 4px rgba(0,0,0,0.3)"></span>`
            });
        };

        const onlineIcon = createIcon(getVar('--danger-color') || '#d32f2f'); 
        const offlineIcon = createIcon('#94a3b8');

        const panelEmpty = document.getElementById('sidePanelEmpty');
        const panelContent = document.getElementById('sidePanelContent');

        const totalKpi = document.getElementById('map-kpi-total');
        const onlineKpi = document.getElementById('map-kpi-online');
        const offlineKpi = document.getElementById('map-kpi-offline');
        const onlineCount = batteries.filter((b) => b.online).length;
        if (totalKpi) totalKpi.textContent = batteries.length;
        if (onlineKpi) onlineKpi.textContent = onlineCount;
        if (offlineKpi) offlineKpi.textContent = batteries.length - onlineCount;

        const showPanelData = (b) => {
            panelEmpty.style.display = 'none';
            panelContent.style.display = 'block';

            document.getElementById('panelBotId').innerText = b.id;
            document.getElementById('panelSoc').innerHTML = `${b.soc}<span class="kpi-unit">%</span>`;
            document.getElementById('panelSoh').innerHTML = `${b.soh}<span class="kpi-unit">%</span>`;
            document.getElementById('panelVol').innerHTML = `${b.v}<span class="kpi-unit">V</span>`;
            document.getElementById('panelCur').innerHTML = `${b.c}<span class="kpi-unit">A</span>`;
            document.getElementById('panelTemp').innerHTML = `${b.t}<span class="kpi-unit">°C</span>`;

            const st = document.getElementById('panelStatus');
            if(b.online) {
                st.className = 'badge success';
                st.innerHTML = '<div class="badge-dot"></div> Online';
            } else {
                st.className = 'badge danger';
                st.innerHTML = '<div class="badge-dot"></div> Offline';
            }
        };

        batteries.forEach(b => {
            const marker = L.marker([b.lat, b.lng], { icon: b.online ? onlineIcon : offlineIcon }).addTo(mapInstance);
            marker.bindTooltip(`<b>${b.id}</b><br/>SOC: ${b.soc}%`, {direction: 'top', offset: [0, -30]});
            marker.on('click', () => showPanelData(b));
        });

        setTimeout(() => mapInstance.invalidateSize(), 80);
        resizeHandler = () => mapInstance && mapInstance.invalidateSize();
        window.addEventListener('resize', resizeHandler);
    };

    const loadLeafletAssets = () => {
        const cssPromise = new Promise((resolve) => {
            if (document.getElementById('leaflet-css')) {
                resolve();
                return;
            }

            const link = document.createElement('link');
            link.id = 'leaflet-css';
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            link.crossOrigin = '';
            link.onload = () => resolve();
            link.onerror = () => resolve();
            document.head.appendChild(link);
        });

        const jsPromise = new Promise((resolve) => {
            if (typeof L !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => resolve();
            script.onerror = () => resolve();
            document.head.appendChild(script);
        });

        return Promise.all([cssPromise, jsPromise]);
    };

    Promise.all([loadLeafletAssets(), window.Services.fetchMapBatteries()])
        .then(([, batteries]) => setTimeout(() => initializeLeaflet(batteries), 30))
        .catch(() => {
            const panelEmpty = document.getElementById('sidePanelEmpty');
            if (panelEmpty) panelEmpty.innerHTML = '<p>Failed to load map batteries</p>';
        });

    return () => {
        if(mapInstance) {
            mapInstance.remove();
            mapInstance = null;
        }
        if (resizeHandler) {
            window.removeEventListener('resize', resizeHandler);
            resizeHandler = null;
        }
    };
};
