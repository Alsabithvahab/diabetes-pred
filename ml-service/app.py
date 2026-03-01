from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import shap
import lime
import lime.lime_tabular
import os

app = Flask(__name__)
CORS(app)

MODEL_PATH = 'model.pkl'
if os.path.exists(MODEL_PATH):
    model_data = joblib.load(MODEL_PATH)
    model = model_data['model']
    scaler = model_data['scaler']
    features = model_data['features']
    X_train = model_data['X_train']
else:
    model = None

def get_recommendations(data):
    recs = {
        "Diet": [],
        "Exercise": [],
        "Lifestyle": []
    }
    age = data.get('Age', 0)
    bmi = data.get('BMI', 0)
    glucose = data.get('Glucose', 0)
    bp = data.get('BloodPressure', 0)
    genetics = data.get('Genetics', 0)

    # Diet Recommendations
    if glucose > 140:
        recs["Diet"].append(f"Your glucose ({glucose} mg/dL) is high. Prioritize low-glycemic foods like leafy greens, legumes, and whole grains.")
        recs["Diet"].append("Strictly limit sugary beverages and refined white flour products.")
    elif glucose > 100:
        recs["Diet"].append("Monitor carbohydrate portions and choose complex carbs over simple sugars.")
    
    if bp > 90:
        recs["Diet"].append("Incorporate the DASH diet (Dietary Approaches to Stop Hypertension), focusing on fruits, vegetables, and low-fat dairy.")
        recs["Diet"].append("Limit sodium (salt) intake to less than 2,300 mg per day.")

    # Exercise Recommendations
    if bmi > 25:
        recs["Exercise"].append(f"With a BMI of {bmi}, aim for 150-300 minutes of moderate-intensity aerobic activity per week.")
        recs["Exercise"].append("Include strength training twice a week to improve metabolic rate.")
    else:
        recs["Exercise"].append("Keep up a regular routine of 30 minutes of daily physical activity.")

    # Lifestyle & Medical
    if genetics == 1:
        recs["Lifestyle"].append("High genetic risk detected. Ensure clinical screenings are done every 3-6 months.")
    
    if bp > 90:
        recs["Lifestyle"].append("Practice stress-management techniques like yoga or deep breathing to help manage blood pressure.")
    
    if age > 45:
        recs["Lifestyle"].append("Regular cardiovascular health checks are vital above age 45.")

    # Flatten categories for display
    final_recs = []
    for cat, items in recs.items():
        for item in items:
            final_recs.append(f"[{cat}] {item}")
            
    if not final_recs:
        final_recs.append("[Lifestyle] You're doing great! Boost your metabolic health further by staying hydrated and ensuring 7-8 hours of quality sleep.")
        final_recs.append("[Diet] Focus on a diverse range of colorful vegetables to maximize micronutrient intake.")
        
    return final_recs

def get_counterfactuals(data):
    changes = {}
    if data.get('BMI', 0) > 30: changes['BMI'] = 24.9
    if data.get('Glucose', 0) > 140: changes['Glucose'] = 110
    if data.get('BloodPressure', 0) > 90: changes['BloodPressure'] = 80
    if not changes:
        if data.get('Glucose', 0) > 100:
            return "Preventative Tip: Maintaining your Glucose below 100 mg/dL can further shield you from long-term risk.", {}
        if data.get('BMI', 0) > 25:
            return "Preventative Tip: Aiming for a BMI below 25 will significantly strengthen your metabolic resilience.", {}
        return "Excellent! Your current metrics are in the ideal range. Focus on consistency to stay in this healthy zone.", {}

    cf_data = data.copy()
    for feat, val in changes.items(): cf_data[feat] = val
    cf_df = pd.DataFrame([cf_data])[features]
    cf_scaled = scaler.transform(cf_df)
    cf_prob = model.predict_proba(cf_scaled)[0][1]
    new_risk = "Low" if cf_prob < 0.3 else "Medium" if cf_prob < 0.6 else "High"
    msg = f"Targeted Action: If you reduce {', '.join([f'{k} to {v}' for k, v in changes.items()])}, your risk category would drop to {new_risk}."
    return msg, changes

@app.route('/predict', methods=['POST'])
def predict():
    if model is None: return jsonify({"error": "Model not loaded"}), 500
    data = request.json
    
    # Extract full feature set
    input_data = {
        'Glucose': data.get('glucose', 0),
        'BloodPressure': data.get('bloodPressure', 0),
        'SkinThickness': data.get('skinThickness', 0),
        'Insulin': data.get('insulin', 0),
        'BMI': data.get('bmi', 0),
        'DiabetesPedigreeFunction': data.get('diabetesPedigreeFunction', 0.5),
        'Age': data.get('age', 0),
        'Genetics': 1 if data.get('genetics') == 'Yes' else 0
    }
    
    df_input = pd.DataFrame([input_data])[features]
    X_scaled = scaler.transform(df_input)
    prob = model.predict_proba(X_scaled)[0][1]
    risk_level = "Low" if prob < 0.3 else "Medium" if prob < 0.6 else "High"
    
    explainer = shap.TreeExplainer(model) if hasattr(model, 'estimators_') else shap.LinearExplainer(model, X_train)
    shap_values = explainer.shap_values(X_scaled)
    
    print(f"SHAP values type: {type(shap_values)}")
    if isinstance(shap_values, list):
        print(f"SHAP values as list, length: {len(shap_values)}")
        current_shap = shap_values[1][0] if len(shap_values) > 1 else shap_values[0][0]
    elif hasattr(shap_values, 'shape'):
        print(f"SHAP values shape: {shap_values.shape}")
        if len(shap_values.shape) == 3: # (samples, features, classes) or (classes, samples, features)
            # Try to determine which dimension is classes (usually 2 for binary)
            if shap_values.shape[0] == 2: # (classes, samples, features)
                current_shap = shap_values[1][0]
            else: # (samples, features, classes)
                current_shap = shap_values[0, :, 1]
        else:
            current_shap = shap_values[0]
    else:
        current_shap = shap_values

    # Convert to list of floats
    if hasattr(current_shap, 'tolist'):
        current_shap = current_shap.tolist()
    
    print(f"Current SHAP after processing: {current_shap}")
    
    shap_summary = []
    for f, v in zip(features, current_shap):
        val = v[0] if isinstance(v, (list, np.ndarray)) else v
        shap_summary.append({
            "feature": f, 
            "value": float(val), 
            "effect": "Increase" if val > 0 else "Decrease"
        })

    lime_explainer = lime.lime_tabular.LimeTabularExplainer(
        X_train.values, 
        feature_names=features, 
        class_names=['No', 'Yes'], 
        mode='classification'
    )
    exp = lime_explainer.explain_instance(X_scaled[0], model.predict_proba, num_features=len(features))
    lime_explanation = [{"feature": x[0], "weight": x[1]} for x in exp.as_list()]

    cf_message, _ = get_counterfactuals(input_data)
    recs = get_recommendations(input_data)

    return jsonify({
        "probability": float(prob), 
        "risk_level": risk_level,
        "shap_values": shap_summary, 
        "lime_explanation": lime_explanation,
        "counterfactual": cf_message, 
        "recommendations": recs
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
