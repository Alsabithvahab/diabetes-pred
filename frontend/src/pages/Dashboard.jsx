import React, { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { getHistory, getAnalytics } from '../services/api';
Chart.register(...registerables);

export default function Dashboard() {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        getHistory().then(res => setHistory(res.data.data));
    }, []);


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
            },
            {
                label: 'BP',
                data: [...history].reverse().map(h => h.bloodPressure),
                borderColor: '#8b5cf6',
                backgroundColor: 'transparent',
                tension: 0.4,
                yAxisID: 'y1'
            },
            {
                label: 'Insulin',
                data: [...history].reverse().map(h => h.insulin),
                borderColor: '#ec4899',
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
                title: { display: true, text: 'Value (mg/dL, mmHg, µU/mL, kg/m²)' },
                grid: { drawOnChartArea: false }
            }
        }
    };

    const latest = history[0];
    const previous = history[1];
    const first = history[history.length - 1];

    const getTrendMessage = () => {
        if (!previous) return "First assessment completed.";
        const diffFromPrev = (latest.probability - previous.probability) * 100;
        const diffFromFirst = (latest.probability - first.probability) * 100;
        
        if (diffFromFirst < -5) return `✨ Remarkable improvement! Your risk has dropped by ${Math.abs(diffFromFirst).toFixed(1)}% since your first assessment.`;
        if (diffFromPrev < -5) return `✅ Great progress! Risk decreased by ${Math.abs(diffFromPrev).toFixed(1)}% since last check.`;
        if (diffFromFirst > 5) return `⚠️ Your risk has increased by ${diffFromFirst.toFixed(1)}% compared to your starting point.`;
        return "Stable: Your metabolic risk remains consistent.";
    };

    return (
        <div style={{ padding: '3rem 1rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div className="result-header">
                <h1>Health Monitoring Dashboard</h1>
                <p>Track your diabetes risk and metabolic trends over time</p>
            </div>

            {!latest ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem', background: '#fff', border: '1px dashed var(--border)' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📋</div>
                    <h2 style={{ color: 'var(--text-dark)', marginBottom: '1rem' }}>No Assessments Found</h2>
                    <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto 2rem', lineHeight: '1.6' }}>
                        Your health monitoring history is currently empty. Complete your first assessment to start tracking your metabolic trends and risk factors.
                    </p>
                    <button className="btn btn-primary" onClick={() => window.location.href = '/'}>
                        🚀 Take Your First Assessment
                    </button>
                </div>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                        {/* Primary Progress Card */}
                        <div className="card progress-card" style={{ 
                            background: 'linear-gradient(135deg, #1a365d 0%, #2d3748 100%)', 
                            color: 'white',
                            border: 'none',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                            flex: 2
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <h3 style={{ color: '#63b3ed', marginTop: 0 }}>🛡️ Health Security Baseline</h3>
                                    <p style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.5rem 0' }}>{getTrendMessage()}</p>
                                    <p style={{ fontSize: '0.9rem', color: '#a0aec0', lineHeight: '1.5', margin: '0.5rem 0 0' }}>
                                        {!previous 
                                            ? "This is your baseline assessment. Continue tracking to see how your metabolic resilience evolves over time."
                                            : latest.probability < previous.probability 
                                                ? "Your metabolic resilience is improving! This trend suggests your lifestyle adjustments are working effectively to regulate blood sugar and weight."
                                                : latest.probability > previous.probability
                                                    ? "Increasing risk factors detected. Focus on moderating glycemic intake and maintaining consistent activity levels to restore your baseline."
                                                    : "Your health signature is holding steady. Consistent monitoring will help you identify subtle shifts before they become long-term trends."
                                        }
                                    </p>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                    <div className="stat-pill" style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem 1rem', borderRadius: '12px' }}>
                                        <span style={{ display: 'block', fontSize: '0.7rem', color: '#a0aec0' }}>Initial Risk</span>
                                        <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>{(first.probability * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="stat-pill" style={{ 
                                        background: (latest.probability - first.probability) <= 0 ? 'rgba(72, 187, 120, 0.2)' : 'rgba(245, 101, 101, 0.2)', 
                                        padding: '0.75rem 1rem', 
                                        borderRadius: '12px',
                                        border: `1px solid ${(latest.probability - first.probability) <= 0 ? '#48bb78' : '#f56565'}`
                                    }}>
                                        <span style={{ display: 'block', fontSize: '0.7rem', color: '#a0aec0' }}>Lifetime Shift</span>
                                        <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                                            {latest.probability - first.probability > 0 ? '+' : ''}{((latest.probability - first.probability) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    {previous && (
                                        <div className="stat-pill" style={{ 
                                            background: (latest.probability - previous.probability) <= 0 ? 'rgba(99, 179, 237, 0.2)' : 'rgba(237, 137, 54, 0.2)', 
                                            padding: '0.75rem 1rem', 
                                            borderRadius: '12px',
                                            border: `1px solid ${(latest.probability - previous.probability) <= 0 ? '#63b3ed' : '#ed8936'}`
                                        }}>
                                            <span style={{ display: 'block', fontSize: '0.7rem', color: '#a0aec0' }}>Recent Change</span>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                                                {latest.probability - previous.probability > 0 ? '+' : ''}{((latest.probability - previous.probability) * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Quick Vitality Metric Card */}
                        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', background: '#fff' }}>
                            <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase' }}>Metabolic Vitality</span>
                            <div style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--primary)', margin: '0.5rem 0' }}>
                                {Math.max(0, 100 - (latest.probability * 100 + (latest.glucose > 140 ? 10 : 0))).toFixed(0)}
                            </div>
                            <span style={{ fontSize: '0.9rem', color: (latest.probability - first.probability) <= 0 ? 'var(--low)' : 'var(--high)', fontWeight: 700 }}>
                                {(latest.probability - first.probability) <= 0 ? '▲ Improving' : '▼ Action Required'}
                            </span>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                Calculated baseline for overall glycemic resilience.
                            </p>
                        </div>
                    </div>

                    <div className="card" style={{ marginBottom: '2.5rem' }}>
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>📅</span> Probability & Metabolic Trend
                        </h3>
                        <div style={{ height: '350px' }}>
                            <Line data={trendData} options={trendOptions} />
                        </div>
                    </div>

                    <div className="card">
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>📜</span> Detailed Assessment History
                        </h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                                        <th style={{ padding: '1rem' }}>Date</th>
                                        <th style={{ padding: '1rem' }}>Glucose</th>
                                        <th style={{ padding: '1rem' }}>BP</th>
                                        <th style={{ padding: '1rem' }}>Insulin</th>
                                        <th style={{ padding: '1rem' }}>BMI</th>
                                        <th style={{ padding: '1rem' }}>Risk Level</th>
                                        <th style={{ padding: '1rem' }}>Probability</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map(h => (
                                        <tr key={h._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                            <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{new Date(h.date).toLocaleDateString()}</td>
                                            <td style={{ padding: '1rem' }}>{h.glucose} mg/dL</td>
                                            <td style={{ padding: '1rem' }}>{h.bloodPressure} mmHg</td>
                                            <td style={{ padding: '1rem' }}>{h.insulin || 'N/A'} µU/mL</td>
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
                </>
            )}
        </div>
    );
}
