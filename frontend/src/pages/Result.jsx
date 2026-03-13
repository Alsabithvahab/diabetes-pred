import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import { getHistory } from '../services/api';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

export default function Result() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [history, setHistory] = React.useState([]);
    const [loadingHistory, setLoadingHistory] = React.useState(false);

    React.useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setLoadingHistory(true);
            getHistory().then(res => {
                setHistory(res.data.data);
            }).catch(err => {
                console.error("Failed to fetch history:", err);
            }).finally(() => {
                setLoadingHistory(false);
            });
        }
    }, []);

    if (!state?.result || !state?.input) return null;

    const { probability, risk_level, shap_values, counterfactual, recommendations } = state.result;
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

            {/* Progress Analysis Section */}
            {history.length > 0 && (
                <div className="card progress-card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)', border: '1px solid #bbf7d0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '2rem' }}>📈</div>
                        <div>
                            <h3 style={{ margin: 0, color: '#166534' }}>Health Progress Analysis</h3>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#15803d' }}>Tracking changes compared to your previous assessment</p>
                        </div>
                    </div>

                    {(() => {
                        // Correctly identify the previous record:
                        // If physics[0] matches current, previous is physics[1]
                        const isCurrentInHistory = history[0] && history[0].probability.toFixed(4) === probability.toFixed(4) && history[0].glucose === Number(glucose);
                        const previous = isCurrentInHistory ? history[1] : history[0];
                        
                        if (!previous) {
                            return <p style={{ color: '#64748b', fontStyle: 'italic' }}>This is your first recorded assessment. Subsequent tests will show detailed progress comparisons here.</p>;
                        }

                        const currentProb = (probability * 100);
                        const prevProb = (previous.probability * 100);
                        const diff = currentProb - prevProb;
                        const isImprovement = diff < 0;

                        // Metric differences
                        const glucoseDiff = Number(glucose) - previous.glucose;
                        const bmiDiff = Number(bmi) - previous.bmi;

                        return (
                            <div className="progress-content">
                                <div style={{ marginBottom: '2rem' }}>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: isImprovement ? '#166534' : diff === 0 ? '#475569' : '#991b1b', marginBottom: '0.5rem' }}>
                                        {isImprovement 
                                            ? `✨ Progress Detected! Your risk has improved by ${Math.abs(diff).toFixed(1)}%`
                                            : diff === 0 
                                                ? "Your risk level is stable compared to your last check."
                                                : `📈 Trend Alert: Risk increased by ${diff.toFixed(1)}% since last time.`
                                        }
                                    </div>
                                    <div style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#374151', background: 'rgba(255,255,255,0.5)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                                        <strong>Change Drivers:</strong> {Math.abs(glucoseDiff) > 0 || Math.abs(bmiDiff) > 0 ? (
                                            <>
                                                {glucoseDiff !== 0 && (
                                                    <span>Your Glucose level {glucoseDiff > 0 ? 'increased' : 'decreased'} by {Math.abs(glucoseDiff)} mg/dL. </span>
                                                )}
                                                {bmiDiff !== 0 && (
                                                    <span>Your BMI {bmiDiff > 0 ? 'rose' : 'fell'} by {Math.abs(bmiDiff.toFixed(1))}. </span>
                                                )}
                                                {isImprovement 
                                                    ? "These positive shifts in your metabolic indicators are directly reducing your systemic risk."
                                                    : diff > 0 
                                                        ? "These upward trends in your core metrics are the primary reason for the increased risk probability."
                                                        : "Your metrics have balanced out to maintain a consistent risk level."}
                                            </>
                                        ) : "Your core metrics (Glucose and BMI) are identical to your previous test, resulting in a stable risk profile."}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                    <div className="stat-box" style={{ padding: '1.25rem' }}>
                                        <span className="stat-label">Previous Glucose</span>
                                        <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{previous.glucose} <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>mg/dL</span></span>
                                        <div style={{ fontSize: '0.8rem', color: glucoseDiff < 0 ? '#22c55e' : glucoseDiff > 0 ? '#ef4444' : '#64748b', fontWeight: 700, marginTop: '4px' }}>
                                            {glucoseDiff < 0 ? `↓ ${Math.abs(glucoseDiff)} Better` : glucoseDiff > 0 ? `↑ ${glucoseDiff} Higher` : 'No Change'}
                                        </div>
                                    </div>
                                    <div className="stat-box" style={{ padding: '1.25rem' }}>
                                        <span className="stat-label">Previous BMI</span>
                                        <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{previous.bmi}</span>
                                        <div style={{ fontSize: '0.8rem', color: bmiDiff < 0 ? '#22c55e' : bmiDiff > 0 ? '#ef4444' : '#64748b', fontWeight: 700, marginTop: '4px' }}>
                                            {bmiDiff < 0 ? `↓ ${Math.abs(bmiDiff).toFixed(1)} Reduced` : bmiDiff > 0 ? `↑ ${bmiDiff.toFixed(1)} Increased` : 'Stable'}
                                        </div>
                                    </div>
                                    <div className="stat-box" style={{ padding: '1.25rem', background: 'var(--primary-light)', border: '1px solid var(--primary)' }}>
                                        <span className="stat-label">Previous Risk</span>
                                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: getRiskColorCode(previous.riskLevel) }}>{prevProb.toFixed(0)}%</span>
                                        <div style={{ fontSize: '0.8rem', color: isImprovement ? '#22c55e' : diff > 0 ? '#ef4444' : '#64748b', fontWeight: 700, marginTop: '4px' }}>
                                            {isImprovement ? `↓ ${Math.abs(diff).toFixed(1)}% Improved` : diff > 0 ? `↑ ${diff.toFixed(1)}% Increased` : 'Steady'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}

            <div className="result-grid" style={{ gridTemplateColumns: '1fr' }}>
                {/* Feature Impact Section (SHAP) */}
                <div className="card">
                    <h3>🔍 Risk factors analysis</h3>
                    <div className="shap-list">
                        {(() => {
                            // Map of all possible features to their display labels and input values
                            const featureLabels = {
                                'Glucose': 'Blood Glucose',
                                'BloodPressure': 'Blood Pressure',
                                'BMI': 'Body Mass Index (BMI)',
                                'Age': 'Age',
                                'Genetics': 'Family History',
                                'Insulin': 'Insulin Level'
                            };

                            const featureValues = {
                                'Glucose': `${glucose} mg/dL`,
                                'BloodPressure': `${bloodPressure} mmHg`,
                                'BMI': `${bmi} kg/m²`,
                                'Age': `${age} Years`,
                                'Genetics': genetics === 'Yes' ? 'Present' : 'None',
                                'Insulin': `${insulin || 0} mu U/ml`
                            };

                            // Filter and sort SHAP values by their absolute impact
                            const filteredShap = shap_values.filter(s => !['SkinThickness', 'DiabetesPedigreeFunction'].includes(s.feature));
                            const sortedShap = [...filteredShap].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
                            const totalImpact = sortedShap.reduce((acc, s) => acc + Math.abs(s.value), 0);

                            return sortedShap.map(s => {
                                const percentage = totalImpact > 0 ? ((Math.abs(s.value) / totalImpact) * 100).toFixed(0) : 0;
                                const explanations = {
                                    'Glucose': s.effect === 'Increase'
                                        ? `Your glucose of ${glucose} mg/dL according to your health assessment is higher than the ideal range. Why? Elevated blood sugar levels mean your body is struggling to process glucose, which is a key driver of insulin resistance and long-term diabetes risk.`
                                        : `Your glucose level of ${glucose} mg/dL is within a healthy range. Why? This suggests efficient insulin function and consistent blood sugar management, significantly lowering your overall risk profile.`,
                                    'BloodPressure': s.effect === 'Increase'
                                        ? `A blood pressure of ${bloodPressure} mmHg puts extra strain on your cardiovascular system. Why? Hypertension is strongly linked to metabolic syndrome, which impairs the body's ability to regulate insulin and glucose.`
                                        : `Maintaining your blood pressure at ${bloodPressure} mmHg is excellent for metabolic health. Why? Lower pressure reduces systemic inflammation and supports better pancreatic and vascular function.`,
                                    'BMI': s.effect === 'Increase'
                                        ? `With a BMI of ${bmi} kg/m², your body carries extra adipose tissue. Why? This fat can produce inflammatory markers that block insulin from working correctly at the cellular level, increasing diabetes susceptibility.`
                                        : `Your BMI of ${bmi} kg/m² is in a favorable range. Why? Lower body fat percentages are associated with higher insulin sensitivity, meaning your cells can respond more effectively to the insulin your body produces.`,
                                    'Age': s.effect === 'Increase'
                                        ? `At ${age} years old, your metabolic risk is naturally higher. Why? As we age, the body's natural ability to regulate glucose can decline, and muscle mass (which helps burn glucose) may decrease if not active.`
                                        : `Being ${age} years old is a protective factor. Why? Younger individuals typically have a more resilient metabolism and higher pancreatic capacity to handle glucose loads, reducing baseline risk.`,
                                    'Genetics': genetics === 'Yes'
                                        ? `Having a reported family history of diabetes means you have a genetic predisposition. Why? Inherited genetic markers lower your threshold for other risk factors like diet or sedentary behavior, making you more susceptible.`
                                        : `Having no significant family history is a strong metabolic advantage. Why? It suggests you don't have the inherited genetic markers that typically make a person more susceptible to type 2 diabetes.`,
                                    'Insulin': s.effect === 'Increase'
                                        ? `Your insulin level of ${featureValues['Insulin']} suggests hyperinsulinemia. Why? This often occurs when cells become resistant to insulin, forcing the pancreas to overproduce it to keep blood sugar stable.`
                                        : `An insulin level of ${featureValues['Insulin']} indicates good pancreatic efficiency. Why? It shows your body can manage glucose without overworking the pancreas, a sign of high insulin sensitivity.`,
                                    'SkinThickness': s.effect === 'Increase'
                                        ? `Increased skin fold thickness (${featureValues['SkinThickness']}) can correlate with subcutaneous fat distribution. Why? Excess fat in these areas is often associated with metabolic dysfunction and systemic insulin resistance.`
                                        : `Lower skin fold thickness (${featureValues['SkinThickness']}) is generally favorable. Why? It suggests lower overall body fat and a healthier metabolic profile, reducing the risk of inflammation-driven diabetes.`,
                                    'DiabetesPedigreeFunction': s.effect === 'Increase'
                                        ? `A Genetic Pedigree score of ${featureValues['DiabetesPedigreeFunction']} is relatively high. Why? This complex metric accounts for family history patterns; higher scores indicate a stronger hereditary probability for diabetes development.`
                                        : `A low Pedigree score of ${featureValues['DiabetesPedigreeFunction']} is protective. Why? It indicates a lower mathematical probability of inherited diabetic traits based on family lineage data.`
                                };

                                return (
                                    <div key={s.feature} className="shap-item" style={{ marginBottom: '1.25rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', transition: 'transform 0.2s ease' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                            <div style={{ flex: 1 }}>
                                                <span style={{ fontWeight: 800, color: 'var(--text-dark)', fontSize: '1.1rem', display: 'block' }}>{featureLabels[s.feature] || s.feature}</span>
                                                <span style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 600 }}>Value: {featureValues[s.feature]}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span className={`risk-badge ${s.effect === 'Increase' ? 'risk-low' : 'risk-high'}`} style={{ fontSize: '0.65rem', padding: '4px 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    {s.effect === 'Increase' ? '↑ Increase' : '↓ Decrease'}
                                                </span>
                                                <span style={{
                                                    fontSize: '1.25rem',
                                                    fontWeight: 900,
                                                    color: s.effect === 'Increase' ? '#22c55e' : '#ef4444',
                                                    minWidth: '50px',
                                                    textAlign: 'right'
                                                }}>
                                                    {percentage}%
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ borderTop: '1px solid #edf2f7', paddingTop: '0.75rem' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Medical Reason</span>
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                                                {explanations[s.feature] || "Detailed evaluation of this metric contributes to your overall metabolic risk calculation."}
                                            </p>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>
            </div>

            <div className="result-grid">
                {/* Counterfactuals Section */}
                <div className="card what-if-card">
                    <h3>🧪 Targeted Improvements</h3>
                    <p style={{ fontStyle: 'italic', color: 'var(--primary)', fontWeight: 600, fontSize: '1rem' }}>"{counterfactual}"</p>
                </div>

                {/* Recommendations Section */}
                <div className="card">
                    <h3>📋 Personalized recommendation</h3>
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
