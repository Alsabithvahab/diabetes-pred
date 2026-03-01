import React, { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
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

    const locationData = {
        labels: analytics.map(a => a._id || 'Unknown'),
        datasets: [{ label: 'Users per Location', data: analytics.map(a => a.count), backgroundColor: '#1a6fc4', borderRadius: 5 }]
    };

    const trendData = {
        labels: [...history].reverse().map(h => new Date(h.date).toLocaleDateString()),
        datasets: [
            {
                label: 'Risk %',
                data: [...history].reverse().map(h => (h.probability * 100).toFixed(1)),
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                fill: true,
                tension: 0.4,
                yAxisID: 'y'
            },
            {
                label: 'Glucose',
                data: [...history].reverse().map(h => h.glucose),
                borderColor: '#3b82f6',
                backgroundColor: 'transparent',
                borderDash: [5, 5],
                tension: 0.4,
                yAxisID: 'y1'
            },
            {
                label: 'BMI',
                data: [...history].reverse().map(h => h.bmi),
                borderColor: '#10b981',
                backgroundColor: 'transparent',
                tension: 0.4,
                yAxisID: 'y1'
            }
        ]
    };

    const trendOptions = {
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: { display: true, text: 'Risk Probability (%)' }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: { display: true, text: 'Value (mg/dL or kg/m²)' },
                grid: { drawOnChartArea: false }
            }
        }
    };

    const latest = history[0];
    const previous = history[1];

    const getTrendMessage = () => {
        if (!previous) return "First assessment completed.";
        const diff = (latest.probability - previous.probability) * 100;
        if (diff > 5) return `⚠️ Risk increased by ${diff.toFixed(1)}% since last check.`;
        if (diff < -5) return `✅ Risk decreased by ${Math.abs(diff).toFixed(1)}%! Great progress.`;
        return "Stable: Risk level remains consistent.";
    };

    return (
        <div style={{ padding: '3rem 1rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div className="result-header">
                <h1>Health Monitoring Dashboard</h1>
                <p>Track your diabetes risk and metabolic trends over time</p>
            </div>

            {latest && (
                <div className="card" style={{ marginBottom: '2rem', borderLeft: '5px solid var(--primary)' }}>
                    <h3>📈 Risk Trend Analysis</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <p style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>{getTrendMessage()}</p>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
                                Current: <strong>{(latest.probability * 100).toFixed(0)}%</strong> ({latest.riskLevel}) |
                                Previous: <strong>{previous ? (previous.probability * 100).toFixed(0) : 'N/A'}%</strong>
                            </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span className={`risk-badge risk-${latest.riskLevel.toLowerCase()}`} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
                                {latest.riskLevel} Risk
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <div className="result-grid" style={{ marginBottom: '2rem' }}>
                <div className="card">
                    <h3>📊 Usage by Location</h3>
                    <div style={{ height: '250px' }}>
                        <Bar data={locationData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>
                <div className="card">
                    <h3>📅 Probability Trend</h3>
                    <div style={{ height: '250px' }}>
                        <Line data={trendData} options={trendOptions} />
                    </div>
                </div>
            </div>

            <div className="card">
                <h3>📜 Assessment History</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem' }}>Date</th>
                                <th style={{ padding: '1rem' }}>Glucose</th>
                                <th style={{ padding: '1rem' }}>BMI</th>
                                <th style={{ padding: '1rem' }}>Risk Level</th>
                                <th style={{ padding: '1rem' }}>Probability</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map(h => (
                                <tr key={h._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{new Date(h.date).toLocaleDateString()}</td>
                                    <td style={{ padding: '1rem' }}>{h.glucose} mg/dL</td>
                                    <td style={{ padding: '1rem' }}>{h.bmi}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span className={`risk-badge risk-${h.riskLevel.toLowerCase()}`} style={{ fontSize: '0.75rem' }}>
                                            {h.riskLevel}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: 600 }}>{(h.probability * 100).toFixed(0)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
