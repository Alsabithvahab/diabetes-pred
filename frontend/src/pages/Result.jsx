import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

export default function Result() {
    const { state } = useLocation();
    const navigate = useNavigate();

    if (!state?.result || !state?.input) return null;

    const { probability, risk_level, shap_values, lime_explanation, counterfactual, recommendations } = state.result;
    const { name, age, location, height, weight, glucose, bloodPressure, insulin, genetics } = state.input;

    const heightInMeters = Number(height) / 100;
    const bmi = (Number(weight) / (heightInMeters * heightInMeters)).toFixed(1);

    const getRiskColorCode = (level) => {
        switch (level.toLowerCase()) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            default: return '#22c55e';
        }
    };

    const getRiskColorNamespace = (level) => {
        switch (level.toLowerCase()) {
            case 'high': return 'high';
            case 'medium': return 'medium';
            default: return 'low';
        }
    };

    const chartData = {
        labels: ['Risk', 'Healthy'],
        datasets: [
            {
                data: [probability * 100, 100 - (probability * 100)],
                backgroundColor: [getRiskColorCode(risk_level), '#e2e8f0'],
                borderWidth: 0,
                cutout: '80%',
            },
        ],
    };

    const chartOptions = {
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
        },
        maintainAspectRatio: false,
    };

    return (
        <div style={{ padding: '3rem 1rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div className="result-header">
                <h1>Assessment Report</h1>
                <p>Comprehensive diabetes risk analysis based on your health metrics</p>
            </div>

            <div className="result-grid">
                {/* Patient Overview Section */}
                <div className="card">
                    <h3>👤 Patient Overview</h3>
                    <div className="metrics-summary">
                        <div className="metric-item">
                            <span className="metric-label">Name</span>
                            <span className="metric-value">{name}</span>
                        </div>
                        <div className="metric-item">
                            <span className="metric-label">Age</span>
                            <span className="metric-value">{age} Years</span>
                        </div>
                        <div className="metric-item">
                            <span className="metric-label">BMI</span>
                            <span className="metric-value">{bmi} kg/m²</span>
                        </div>
                    </div>
                </div>

                {/* Risk Assessment Section with Graph */}
                <div className="card">
                    <h3>⚡ Risk Assessment</h3>
                    <div style={{ position: 'relative', height: '180px', margin: '1rem 0' }}>
                        <Doughnut data={chartData} options={chartOptions} />
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -15%)',
                            textAlign: 'center'
                        }}>
                            <span style={{ fontSize: '1.5rem', fontWeight: 800, display: 'block', color: 'var(--text-dark)' }}>
                                {(probability * 100).toFixed(0)}%
                            </span>
                            <span className={`risk-badge risk-${getRiskColorNamespace(risk_level)}`} style={{ fontSize: '0.7rem' }}>
                                {risk_level}
                            </span>
                        </div>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                        Probability of diabetes based on clinical indicators.
                    </p>
                </div>
            </div>

            <div className="result-grid">
                {/* Feature Impact Section (SHAP) */}
                <div className="card">
                    <h3>🔍 Why did I get this result?</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                        The model analyzed your indicators. Here's how each factor contributed to your risk assessment.
                    </p>
                    <div className="shap-list">
                        {shap_values
                            .filter(s => s.feature !== 'SkinThickness' && s.feature !== 'DiabetesPedigreeFunction' && s.feature !== 'Insulin')
                            .map(s => {
                                const featureLabels = {
                                    'Glucose': 'Blood Glucose',
                                    'BloodPressure': 'Blood Pressure',
                                    'BMI': 'Body Mass Index (BMI)',
                                    'Age': 'Age',
                                    'Genetics': 'Family History'
                                };

                                return (
                                    <div key={s.feature} className="shap-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{featureLabels[s.feature] || s.feature}</span>
                                        <span className={`risk-badge ${s.effect === 'Increase' ? 'risk-high' : 'risk-low'}`} style={{ fontSize: '0.65rem' }}>
                                            {s.effect === 'Increase' ? '↑ Increases Risk' : '↓ Reduces Risk'}
                                        </span>
                                    </div>
                                );
                            })}
                    </div>
                </div>

                {/* Instance Explanation (LIME) */}
                <div className="card">
                    <h3>📊 Specific Indicators</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                        The most significant factors in <strong>your</strong> prediction and their relative impact.
                    </p>
                    <div className="recommendations-list">
                        {lime_explanation
                            ?.filter(item => !item.feature.includes('DiabetesPedigreeFunction') && !item.feature.includes('SkinThickness'))
                            ?.slice(0, 5)
                            .map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', padding: '0.5rem', background: '#f8fafc', borderRadius: '6px' }}>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-dark)', fontWeight: 500 }}>{item.feature}</span>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold',
                                        color: item.weight > 0 ? '#ef4444' : '#22c55e'
                                    }}>
                                        {item.weight > 0 ? '+' : ''}{(item.weight * 100).toFixed(1)}% Impact
                                    </span>
                                </div>
                            ))}
                    </div>
                </div>
            </div>

            <div className="result-grid">
                {/* Counterfactuals Section */}
                <div className="card what-if-card">
                    <h3>🧪 How to Reduce Your Risk</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Targeted improvements to lower your risk level:</p>
                    <p style={{ fontStyle: 'italic', color: 'var(--primary)', fontWeight: 600, fontSize: '1rem' }}>"{counterfactual}"</p>
                </div>

                {/* Recommendations Section */}
                <div className="card">
                    <h3>📋 Personalized Plan</h3>
                    <div className="recommendations-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
                        {['Diet', 'Exercise', 'Lifestyle'].map(category => {
                            const items = recommendations.filter(r => r.startsWith(`[${category}]`));
                            if (items.length === 0) return null;

                            const icons = { 'Diet': '🥗', 'Exercise': '🏃', 'Lifestyle': '🧘' };
                            const colors = { 'Diet': '#3b82f6', 'Exercise': '#10b981', 'Lifestyle': '#f59e0b' };

                            return (
                                <div key={category} style={{ borderLeft: `4px solid ${colors[category]}`, paddingLeft: '1rem' }}>
                                    <h4 style={{ color: colors[category], marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {icons[category]} {category}
                                    </h4>
                                    <div className="recommendations-list">
                                        {items.map((r, i) => (
                                            <div key={i} className="recommendation-item" style={{ marginBottom: '0.6rem', fontSize: '0.85rem' }}>
                                                {r.replace(`[${category}] `, '')}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                        {recommendations.every(r => !r.includes('[')) && (
                            <div className="recommendation-item">
                                <span className="recommendation-icon">💡</span>
                                <span style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{recommendations[0]}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                <button className="btn btn-primary" style={{ padding: '1rem 3rem' }} onClick={() => navigate('/')}>
                    🔄 Start New Assessment
                </button>
            </div>
        </div>
    );
}
