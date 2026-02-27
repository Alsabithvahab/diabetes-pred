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
    recs = []
    age = data.get('Age', 0)
    bmi = data.get('BMI', 0)
    glucose = data.get('Glucose', 0)
    bp = data.get('BloodPressure', 0)
    genetics = data.get('Genetics', 0)

    if bmi > 30:
        recs.append("Focus on a calorie-controlled diet and aim for at least 150 minutes of moderate intensity exercise per week.")
    elif bmi > 25:
        recs.append("Incorporate light physical activity and monitor your portion sizes.")
    if glucose > 140:
        recs.append("Reduce intake of refined sugars and simple carbohydrates.")
    if bp > 90:
        recs.append("Monitor sodium intake and incorporate stress-reduction techniques.")
    if genetics == 1:
        recs.append("Due to family history, schedule regular blood sugar screenings every 3 months.")
    if age > 45:
        recs.append("Over 45? Ensure regular cardiovascular checkups.")
    if not recs:
        recs.append("Maintain your current healthy lifestyle.")
    return recs

def get_counterfactuals(data):
    changes = {}
    if data.get('BMI', 0) > 30: changes['BMI'] = 24.9
    if data.get('Glucose', 0) > 140: changes['Glucose'] = 110
    if data.get('BloodPressure', 0) > 90: changes['BloodPressure'] = 80
    if not changes: return "Healthy profile detected.", {}

    cf_data = data.copy()
    for feat, val in changes.items(): cf_data[feat] = val
    cf_df = pd.DataFrame([cf_data])[features]
    cf_scaled = scaler.transform(cf_df)
    cf_prob = model.predict_proba(cf_scaled)[0][1]
    new_risk = "Low" if cf_prob < 0.3 else "Medium" if cf_prob < 0.6 else "High"
    msg = f"If {', '.join([f'{k} reduces to {v}' for k, v in changes.items()])}, risk drops to {new_risk}."
    return msg, changes

@app.route('/predict', methods=['POST'])
def predict():
    if model is None: return jsonify({"error": "Model not loaded"}), 500
    data = request.json
    
    # Extract full feature set
    input_data = {
        'Pregnancies': data.get('pregnancies', 0),
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
