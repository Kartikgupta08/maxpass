// Dummy Mock Data & Helpers
const MMD = { 
    generateBatteries: (count = 52) => {
        const categories = ['ESS', '2W', '3W', '4W'];
        const networks = ['4G', 'LTE', '5G'];
        let batteries = [];
        for (let i = 1; i <= count; i++) {
            const isOnline = Math.random() > 0.3; // 70% chance online
            const isFaulty = Math.random() < 0.12; // 12% chance faulty
            batteries.push({
                id: `BAT-${1000 + i}`,
                name: `Battery ${i}`,
                status: isOnline ? 'Online' : 'Offline',
                faulty: isFaulty,
                network: networks[Math.floor(Math.random() * networks.length)],
                tag: categories[Math.floor(Math.random() * categories.length)],
                lastUpdate: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toLocaleString(),
                speed: isOnline ? Math.floor(Math.random() * 80) : 0,
                distance: isOnline ? Math.floor(Math.random() * 120) : 0,
                address: ['Bangalore', 'Mumbai', 'Pune', 'Chennai', 'Delhi'][Math.floor(Math.random() * 5)],
                planEnds: new Date(Date.now() + Math.random() * 31536000000).toLocaleDateString()
            });
        }
        return batteries;
    },
    
    generateTimeSeriesData: (points = 24, min = 0, max = 100) => {
        let data = [];
        let labels = [];
        let now = new Date();
        for (let i = points; i >= 0; i--) {
            let t = new Date(now.getTime() - i * 3600000); // 1 hour steps
            labels.push(t.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
            let val = Math.floor(Math.random() * (max - min + 1) + min);
            data.push(val);
        }
        return { labels, data };
    }
};

window.mmd = MMD;
