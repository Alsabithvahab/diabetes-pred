import React from 'react';

export default function About() {
    return (
        <div style={{ padding: '3rem 1rem', maxWidth: '800px', margin: '0 auto' }}>
            <div className="form-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1>About DiabetesAI</h1>
                <p>Empowering individuals with AI-driven health insights</p>
            </div>

            <div className="card" style={{ marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Our Mission</h2>
                <p style={{ lineHeight: '1.6', color: 'var(--text-muted)' }}>
                    DiabetesAI is a cutting-edge platform designed to help people assess their risk of diabetes using advanced machine learning.
                    Our goal is to provide accessible, accurate, and explainable health predictions to encourage early intervention and proactive health management.
                </p>
            </div>

            <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <div className="card">
                    <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        🧠 <span style={{ color: 'var(--text-dark)' }}>The Technology</span>
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                        We utilize a Random Forest classifier trained on the PIMA Indians Diabetes Database. To ensure accuracy, we apply SMOTE (Synthetic Minority Over-sampling Technique) to handle class imbalance, resulting in a robust and reliable prediction model.
                    </p>
                </div>

                <div className="card">
                    <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        🔍 <span style={{ color: 'var(--text-dark)' }}>Explainability</span>
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                        We believe that AI should not be a "black box." Our platform integrates SHAP and LIME to explain exactly why a certain risk level was predicted, highlighting the key features—like glucose levels or BMI—that contributed to the result.
                    </p>
                </div>
            </div>

            <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    &copy; 2026 DiabetesAI Project. Built for health awareness and early detection.
                </p>
            </div>
        </div>
    );
}
