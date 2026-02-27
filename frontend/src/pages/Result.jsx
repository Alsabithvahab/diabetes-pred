import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Result() {
    const { state } = useLocation();
    const navigate = useNavigate();
    if (!state?.result) return null;
    const { probability, risk_level, shap_values, counterfactual, recommendations } = state.result;

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h1>Assessment Result</h1>
            <div className="card" style={{ textAlign: 'center' }}>
                <h2>Risk Level: <span className={`risk-${risk_level.toLowerCase()}`}>{risk_level}</span></h2>
                <p>Probability: {(probability * 100).toFixed(1)}%</p>
            </div>
            <div className="card">
                <h3>Feature Importance (SHAP)</h3>
                {shap_values.map(s => (
                    <div key={s.feature} style={{ display: 'flex', justifyContent: 'space-between', margin: '0.5rem 0' }}>
                        <span>{s.feature}</span>
                        <span className={s.effect === 'Increase' ? 'risk-high' : 'risk-low'}>{s.effect}</span>
                    </div>
                ))}
            </div>
            <div className="card">
                <h3>Recommendations</h3>
                <ul>{recommendations.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </div>
            {counterfactual && <div className="card"><h3>What-if Analysis</h3><p>{counterfactual}</p></div>}
            <button className="btn btn-primary" onClick={() => navigate('/')}>New Prediction</button>
        </div>
    );
}
