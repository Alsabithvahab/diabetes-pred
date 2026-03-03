import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip as ChartTooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    ChartTooltip,
    Legend
);

export default function Dashboard() {
    const { logoutUser, user } = useAuth();
    const navigate = useNavigate();
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchAllPredictions = async () => {
            try {
                const token = localStorage.getItem('admin_token');
                const res = await axios.get('http://localhost:5001/api/predictions/all', {
                    headers: { 'x-auth-token': token }
                });
                setPredictions(res.data.data);
                setLoading(false);
            } catch (err) {
                console.error("Fetch All Error:", err);
                setError(err.response?.data?.message || err.message);
                setLoading(false);
            }
        };
        fetchAllPredictions();
    }, []);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedPredictions = useMemo(() => {
        let sortableItems = [...predictions];
        if (searchTerm) {
            sortableItems = sortableItems.filter(p =>
                (p.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.name || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                let valA = a[sortConfig.key];
                let valB = b[sortConfig.key];

                if (sortConfig.key === 'userId') {
                    valA = a.userId?.email || '';
                    valB = b.userId?.email || '';
                }

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [predictions, sortConfig, searchTerm]);

    const locationAnalytics = useMemo(() => {
        const stats = {};
        predictions.forEach(p => {
            const loc = p.location || 'Unknown';
            if (!stats[loc]) {
                stats[loc] = { total: 0, names: new Set() };
            }
            stats[loc].total += 1;
            // Count by unique name per location
            const name = p.name || 'Anonymous';
            stats[loc].names.add(name);
        });

        // Sort by number of unique names
        const filtered = Object.entries(stats)
            .sort((a, b) => b[1].names.size - a[1].names.size);

        return {
            labels: filtered.map(([loc]) => loc.split(',')[0]),
            datasets: [
                {
                    label: 'Number of Users',
                    data: filtered.map(([, s]) => s.names.size),
                    backgroundColor: '#3b82f6',
                    borderRadius: 6
                }
            ]
        };
    }, [predictions]);


    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: false },
        },
        scales: {
            x: {
                grid: { display: false },
                title: { display: true, text: 'Locations', font: { weight: 'bold' } }
            },
            y: {
                beginAtZero: true,
                ticks: { stepSize: 1 },
                title: { display: true, text: 'Number of Users', font: { weight: 'bold' } }
            },
        },
    };


    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this record?")) return;

        try {
            const token = localStorage.getItem('admin_token');
            await axios.delete(`http://localhost:5001/api/predictions/all/${id}`, {
                headers: { 'x-auth-token': token }
            });
            setPredictions(prev => prev.filter(p => p._id !== id));
        } catch (err) {
            console.error("Delete Error:", err);
            alert("Delete failed: " + (err.response?.data?.message || err.message));
        }
    };

    const handleLogout = () => {
        logoutUser();
        navigate('/login');
    };

    if (loading) return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading Admin Panel...</div>;
    if (error) return <div style={{ padding: '3rem', textAlign: 'center', color: 'red' }}>Error: {error}</div>;

    const SortIcon = ({ column }) => {
        if (sortConfig.key !== column) return <span style={{ opacity: 0.3 }}>⇅</span>;
        return <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
    };

    return (
        <div style={{ padding: '0 1rem 3rem', maxWidth: '1200px', margin: '0 auto' }}>
            <div className="result-header">
                <h1>Admin Insight: Health Hotspots</h1>
                <p>Geographical diabetes risk analysis and patient oversight</p>
            </div>

            {/* Top Analytics Cards */}
            <div style={{ marginBottom: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                    <h4 style={{ margin: '0', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Total Assessments</h4>
                    <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>{predictions.length}</h2>
                    <p style={{ margin: '0', fontSize: '0.85rem' }}>Across {new Set(predictions.map(p => p.location || 'Unknown')).size} locations</p>
                </div>
                <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
                    <h4 style={{ margin: '0', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>High Risk Alerts</h4>
                    <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0', color: '#ef4444' }}>
                        {predictions.filter(p => p.riskLevel === 'High').length}
                    </h2>
                    <p style={{ margin: '0', fontSize: '0.85rem' }}>Requires medical attention</p>
                </div>
                <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
                    <h4 style={{ margin: '0', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Active Locations</h4>
                    <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>
                        {locationAnalytics.labels.length}
                    </h2>
                    <p style={{ margin: '0', fontSize: '0.85rem' }}>Across all regions</p>
                </div>
            </div>

            {/* Location Analytics Graph Section */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    📊 Usage Analytics: System Reach
                </h3>
                <div style={{ height: '350px' }}>
                    {locationAnalytics.labels.length > 0 ? (
                        <Bar data={locationAnalytics} options={chartOptions} />
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                            No data available yet
                        </div>
                    )}
                </div>
            </div>


            {/* Detailed Assessments Table Section */}
            <div className="card">
                <div className="dashboard-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h3 style={{ margin: 0 }}>Patient Oversight & Records</h3>
                    <div className="search-container" style={{ width: '100%', maxWidth: '300px' }}>
                        <input
                            type="text"
                            placeholder="Search patient or location..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid var(--border)', width: '100%' }}
                        />
                    </div>
                </div>


                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                                <th style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('date')}>Date <SortIcon column="date" /></th>
                                <th style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('name')}>Patient <SortIcon column="name" /></th>
                                <th style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('location')}>Location <SortIcon column="location" /></th>
                                <th style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('riskLevel')}>Risk <SortIcon column="riskLevel" /></th>
                                <th style={{ padding: '1rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedPredictions.map((p) => (
                                <tr key={p._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{new Date(p.date).toLocaleDateString()}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.userId?.email || 'N/A'}</div>
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.9rem' }}>📍 {p.location}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span className={`risk-badge risk-${p.riskLevel?.toLowerCase()}`}>
                                            {p.riskLevel}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <button
                                            onClick={() => handleDelete(p._id)}
                                            className="btn btn-danger"
                                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
