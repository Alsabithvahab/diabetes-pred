# Diabetes Prediction System (Flattened)

Full-stack production-ready MERN + Python system.

## Structure
- `/backend` - Express API
- `/frontend` - React Dashboard
- `/ml-service` - Python Flask ML Microservice

## Setup
1. **ML**: `cd ml-service` -> `pip install -r requirements.txt` -> `python app.py`
2. **Backend**: `cd backend` -> `npm i` -> `node server.js`
3. **Frontend**: `cd frontend` -> `npm start`

## Model
- Random Forest (Acc: 74.7%, F1: 0.67)
- Includes SHAP, LIME, and Counterfactuals.
