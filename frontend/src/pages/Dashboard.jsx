import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { getHistory, getAnalytics } from '../services/api';
Chart.register(...registerables);

export default function Dashboard() {
    const [history, setHistory] = useState([]);
    const [analytics, setAnalytics] = useState([]);

    useEffect(() => {
        getHistory().then(res => setHistory(res.data.data));
        getAnalytics().then(res => setAnalytics(res.data.data));
    }, []);

    const data = {
        labels: analytics.map(a => a._id || 'Unknown'),
        datasets: [{ label: 'Users per Location', data: analytics.map(a => a.count), backgroundColor: '#1a6fc4' }]
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <h1>System Dashboard</h1>
            <div className="card"><Bar data={data} /></div>
            <div className="card">
                <h3>History</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ borderBottom: '1px solid var(--border)' }}><th>Name</th><th>Location</th><th>Risk</th><th>Prob</th></tr></thead>
                    <tbody>
                        {history.map(h => (
                            <tr key={h._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '0.5rem' }}>{h.name}</td>
                                <td>{h.location}</td>
                                <td><span className={`risk-${h.riskLevel.toLowerCase()}`}>{h.riskLevel}</span></td>
                                <td>{(h.probability * 100).toFixed(0)}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
