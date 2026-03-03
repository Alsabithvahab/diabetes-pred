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
        name: '', location: '', age: '',
        glucose: '', bloodPressure: '', insulin: '', genetics: 'No',
        height: '', weight: ''
    });
    useEffect(() => {
        const detectLocation = async () => {
            // Try high-precision browser geolocation first
            if (navigator.geolocation) {
                console.log("Requesting high-accuracy GPS location...");
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;
                        try {
                            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                            const data = await res.json();

                            // Try to get the most specific location info possible
                            const city = data.city || data.locality || data.localityInfo?.administrative?.find(a => a.adminLevel === 4)?.name || '';
                            const state = data.principalSubdivision || data.region || '';
                            const detailedLoc = city ? `${city}, ${state}` : state;

                            setForm(prev => ({ ...prev, location: detailedLoc }));
                            console.log("SUCCESS: Exact GPS Location detected:", detailedLoc);
                        } catch (err) {
                            console.error("Reverse geocoding failed:", err);
                            setForm(prev => ({ ...prev, location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
                        }
                    },
                    async (error) => {
                        if (error.code === 1) {
                            console.warn("User DENIED location permission. Falling back to IP.");
                            alert("To get your EXACT location for the assessment, please allow location access in your browser settings.");
                        } else {
                            console.warn("Geolocation failed (timeout/unavailable). Code:", error.code, "Message:", error.message);
                        }

                        // Fallback to IP-based detection
                        try {
                            console.log("Attempting IP-based location fallback...");
                            const res = await fetch('https://ipapi.co/json/');
                            const data = await res.json();
                            if (data.region) {
                                const fallbackLoc = data.city ? `${data.city}, ${data.region}` : data.region;
                                setForm(prev => ({ ...prev, location: fallbackLoc }));
                                console.log("IP Fallback Location detected (less accurate):", fallbackLoc);
                            }
                        } catch (ipErr) {
                            console.error("IP detection fallback failed:", ipErr);
                        }
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                );
            } else {
                console.error("Geolocation is NOT supported by this browser.");
            }
        };
        detectLocation();
    }, []);

    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const heightInMeters = Number(form.height) / 100;
        const calculatedBmi = Number(form.weight) / (heightInMeters * heightInMeters);

        try {
            const res = await submitPrediction({
                ...form,
                age: Number(form.age),
                glucose: Number(form.glucose),
                bloodPressure: Number(form.bloodPressure),
                insulin: Number(form.insulin),
                skinThickness: 0,
                bmi: Number(calculatedBmi.toFixed(1)),
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
                            <label className="form-label">🩸 Glucose (mg/dL)</label>
                            <input name="glucose" type="number" placeholder="70-200" onChange={handle} required />
                        </div>

                        <div className="form-group">
                            <label className="form-label">❤️ Blood Pressure (mmHg)</label>
                            <input name="bloodPressure" type="number" placeholder="60-120" onChange={handle} required />
                        </div>

                        <div className="form-group">
                            <label className="form-label">📏 Height (cm)</label>
                            <input name="height" type="number" placeholder="e.g. 170" onChange={handle} required />
                        </div>

                        <div className="form-group">
                            <label className="form-label">⚖️ Weight (kg)</label>
                            <input name="weight" type="number" placeholder="e.g. 70" onChange={handle} required />
                        </div>


                        <div className="form-group">
                            <label className="form-label">💉 Insulin (mu U/ml)</label>
                            <input name="insulin" type="number" placeholder="0-846" onChange={handle} required />
                        </div>


                        <div className="form-group">
                            <label className="form-label">📅 Age</label>
                            <input name="age" type="number" placeholder="Enter your age" onChange={handle} required />
                        </div>

                        <div className="form-group family-history-group" style={{ marginTop: '1rem' }}>
                            <label className="form-label">🧬 Family history of diabetes?</label>
                            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input type="radio" name="genetics" value="Yes" onChange={handle} /> Yes
                                </label>
                                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input type="radio" name="genetics" value="No" defaultChecked onChange={handle} /> No
                                </label>
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
        </div >
    );
}
