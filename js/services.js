window.Services = (() => {
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const toSeverity = (alertType) => {
        if (!alertType) return 'Low';
        const highKeywords = ['Over Voltage', 'High Temperature', 'High Current'];
        const mediumKeywords = ['Low SOC', 'Cell Imbalance'];
        if (highKeywords.includes(alertType)) return 'High';
        if (mediumKeywords.includes(alertType)) return 'Medium';
        return 'Low';
    };

    const toAlertType = (battery) => {
        if (battery.faulty) return 'Cell Imbalance';
        if (battery.status === 'Offline') return 'Offline';
        if (battery.speed > 65) return 'High Current';
        if (battery.distance > 100) return 'Low SOC';
        return 'Telemetry Notice';
    };

    const toAlert = (battery, idx) => {
        const type = toAlertType(battery);
        const sev = toSeverity(type);
        const minutesAgo = 8 + idx * 13;
        return {
            id: battery.id,
            type,
            sev,
            time: minutesAgo < 60 ? `${minutesAgo} mins ago` : `${Math.floor(minutesAgo / 60)} hours ago`,
            status: idx % 4 === 0 ? 'Resolved' : 'Active',
            desc: type === 'Cell Imbalance'
                ? 'Voltage spread across cells exceeded threshold'
                : type === 'Offline'
                    ? 'No telemetry heartbeat received in expected interval'
                    : type === 'High Current'
                        ? 'Discharge current trending above configured profile'
                        : type === 'Low SOC'
                            ? 'State of charge has dropped near minimum reserve'
                            : 'Observed non-critical anomaly in telemetry stream'
        };
    };

    const buildAnalytics = (batteries) => {
        const total = batteries.length;
        const online = batteries.filter((b) => b.status === 'Online').length;
        const avgSoc = Math.max(0, Math.min(100, Math.round((45 + (online / Math.max(total, 1)) * 45) * 10) / 10));
        const avgSoh = Math.max(70, Math.min(100, Math.round((88 + (online / Math.max(total, 1)) * 10) * 10) / 10));

        const byTag = {};
        batteries.forEach((b) => {
            if (!byTag[b.tag]) {
                byTag[b.tag] = { online: 0, offline: 0, soh: [] };
            }
            if (b.status === 'Online') byTag[b.tag].online += 1;
            else byTag[b.tag].offline += 1;
            const pseudoSoh = 90 + (b.status === 'Online' ? 6 : -2) + (b.faulty ? -6 : 0);
            byTag[b.tag].soh.push(Math.max(70, Math.min(100, pseudoSoh)));
        });

        const categories = Object.entries(byTag).map(([tag, stats]) => ({
            category: tag,
            online: stats.online,
            offline: stats.offline,
            avgSoh: (stats.soh.reduce((a, c) => a + c, 0) / Math.max(stats.soh.length, 1)).toFixed(1)
        }));

        return {
            kpis: { total, online, avgSoc, avgSoh },
            categories
        };
    };

    const fetchBatteries = async () => {
        await delay(180);
        return window.mmd.generateBatteries(52);
    };

    const fetchBatteryById = async (batteryId) => {
        const batteries = await fetchBatteries();
        return batteries.find((b) => b.id === batteryId || b.name === batteryId) || batteries[0];
    };

    const fetchAlerts = async () => {
        const batteries = await fetchBatteries();
        const candidates = batteries.filter((b) => b.faulty || b.status === 'Offline' || b.speed > 65 || b.distance > 100);
        return candidates.slice(0, 14).map((b, idx) => toAlert(b, idx));
    };

    const fetchAnalytics = async () => {
        const batteries = await fetchBatteries();
        return buildAnalytics(batteries);
    };

    const fetchMapBatteries = async () => {
        const batteries = await fetchBatteries();
        const baseLat = 19.076;
        const baseLng = 72.8777;
        return batteries.slice(0, 18).map((b, idx) => ({
            id: b.id,
            lat: baseLat + ((idx % 6) - 2.5) * 0.04,
            lng: baseLng + (Math.floor(idx / 6) - 1) * 0.05,
            online: b.status === 'Online',
            soc: Math.max(0, Math.min(100, 30 + (b.distance % 70))),
            soh: Math.max(70, Math.min(100, 85 + (b.status === 'Online' ? 10 : -3))),
            v: (47 + (b.speed % 8)).toFixed(1),
            c: (b.status === 'Online' ? 5 + (b.speed % 22) : 0).toFixed(1),
            t: 23 + (b.distance % 14)
        }));
    };

    return {
        fetchBatteries,
        fetchBatteryById,
        fetchAlerts,
        fetchAnalytics,
        fetchMapBatteries
    };
})();
