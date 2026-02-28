import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { submitPrediction } from '../services/api';

const FeatureCard = ({ icon, title, description }) => (
    <div className="feature-card">
        <div className="feature-icon-container">{icon}</div>
        <h3>{title}</h3>
        <p>{description}</p>
    </div>
);

const CookieBanner = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            const timer = setTimeout(() => setVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookie-consent', 'true');
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div className="cookie-banner">
            <div className="cookie-content">
                <p>
                    We use cookies to enhance your development experience and keep your data secure. <a href="#">Privacy Policy</a>
                </p>
            </div>
            <div className="cookie-actions">
                <button className="cookie-btn-accept" onClick={handleAccept}>Accept all</button>
                <button className="cookie-btn-manage">Manage preferences</button>
            </div>
        </div>
    );
};

export default function Home() {
    const [form, setForm] = useState({
        name: '', location: '', age: '', pregnancies: '0',
        glucose: '', bloodPressure: '', insulin: '', genetics: 'No'
    });
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await submitPrediction({
                ...form,
                age: Number(form.age),
                pregnancies: Number(form.pregnancies),
                glucose: Number(form.glucose),
                bloodPressure: Number(form.bloodPressure),
                insulin: Number(form.insulin),
                skinThickness: 0,
                bmi: 25.0,
                diabetesPedigreeFunction: 0.47
            });
            navigate('/result', { state: { result: res.data.data, input: form } });
        } catch (err) {
            alert('Prediction failed. Ensure the ML microservice and Backend are running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '3rem 1rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div className="form-header">
                <h1>Health Assessment Form</h1>
                <p>Enter your health metrics for comprehensive diabetes risk prediction</p>
            </div>

            <div className="card">
                <form onSubmit={onSubmit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">👤 Full Name</label>
                            <input name="name" placeholder="Enter your name" onChange={handle} required />
                        </div>

                        <div className="form-group">
                            <label className="form-label">📍 Location</label>
                            <select name="location" onChange={handle} required>
                                <option value="">Select location</option>
                                <option value="New York">New York</option>
                                <option value="London">London</option>
                                <option value="Mumbai">Mumbai</option>
                                <option value="Tokyo">Tokyo</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">🤰 Pregnancies</label>
                            <input name="pregnancies" type="number" placeholder="0-17" min="0" onChange={handle} required />
                        </div>

                        <div className="form-group">
                            <label className="form-label">🩸 Glucose (mg/dL)</label>
                            <input name="glucose" type="number" placeholder="70-200" onChange={handle} required />
                        </div>

                        <div className="form-group">
                            <label className="form-label">❤️ Blood Pressure (mmHg)</label>
                            <input name="bloodPressure" type="number" placeholder="60-120" onChange={handle} required />
                        </div>


                        <div className="form-group">
                            <label className="form-label">💉 Insulin (mu U/ml)</label>
                            <input name="insulin" type="number" placeholder="0-846" onChange={handle} required />
                        </div>


                        <div className="form-group">
                            <label className="form-label">📅 Age</label>
                            <input name="age" type="number" placeholder="21-81" onChange={handle} required />
                        </div>

                        <div className="form-group" style={{ gridColumn: 'span 2', marginTop: '1rem', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <label className="form-label">🧬 Family history of diabetes?</label>
                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                <label style={{ cursor: 'pointer' }}><input type="radio" name="genetics" value="Yes" onChange={handle} /> Yes</label>
                                <label style={{ cursor: 'pointer' }}><input type="radio" name="genetics" value="No" defaultChecked onChange={handle} /> No</label>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '2.5rem' }}>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} disabled={loading}>
                            {loading ? 'Analyzing...' : '⚡ Analyze Diabetes Risk'}
                        </button>
                    </div>
                </form>
            </div>

            <section className="features-section">
                <div className="features-grid">
                    <FeatureCard
                        icon="🧠"
                        title="ML Prediction"
                        description="Random Forest model trained on PIMA dataset with SMOTE balancing for accurate risk assessment."
                    />
                    <FeatureCard
                        icon="🔍"
                        title="Explainable AI"
                        description="SHAP & LIME explanations provide deep insights into the factors contributing to your risk score."
                    />
                    <FeatureCard
                        icon="🔄"
                        title="Counterfactuals"
                        description="Understand the minimal changes needed in your metrics to significantly lower your diabetes risk profile."
                    />
                </div>

                <div className="dashboard-footer">
                    <Link to="/dashboard" className="dashboard-link">
                        View Risk Monitoring Dashboard &rarr;
                    </Link>
                </div>
            </section>

            <CookieBanner />
        </div>
    );
}
