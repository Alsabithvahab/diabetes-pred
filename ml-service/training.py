import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score
from imblearn.over_sampling import SMOTE
import os

def train_model():
    # Load local dataset
    file_path = "diabetes.csv"
    
    try:
        if os.path.exists(file_path):
            df = pd.read_csv(file_path)
            print(f"Dataset '{file_path}' loaded successfully.")
        else:
            url = "https://raw.githubusercontent.com/jbrownlee/Datasets/master/pima-indians-diabetes.data.csv"
            columns = ['Pregnancies', 'Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI', 'DiabetesPedigreeFunction', 'Age', 'Outcome']
            df = pd.read_csv(url, names=columns)
            print("Remote dataset loaded successfully.")
    except Exception as e:
        print(f"Error loading dataset: {e}")
        return

    df['Genetics'] = (df['DiabetesPedigreeFunction'] > 0.47).astype(int)
    
    # Feature selection: Reduced set (Pregnancies removed)
    features = ['Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI', 'DiabetesPedigreeFunction', 'Age', 'Genetics']
    X = df[features]
    y = df['Outcome']

    # Handling missing values (0s in certain columns are missing)
    cols_with_zeros = ['Glucose', 'BloodPressure', 'SkinThickness', 'Insulin', 'BMI']
    X[cols_with_zeros] = X[cols_with_zeros].replace(0, np.nan)
    X = X.fillna(X.median())

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    smote = SMOTE(random_state=42)
    X_train_res, y_train_res = smote.fit_resample(X_train, y_train)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train_res)
    X_test_scaled = scaler.transform(X_test)

    rf = RandomForestClassifier(n_estimators=100, random_state=42)
    rf.fit(X_train_scaled, y_train_res)
    rf_pred = rf.predict(X_test_scaled)
    rf_acc = accuracy_score(y_test, rf_pred)
    rf_f1 = f1_score(y_test, rf_pred)

    lr = LogisticRegression(random_state=42)
    lr.fit(X_train_scaled, y_train_res)
    lr_pred = lr.predict(X_test_scaled)
    lr_acc = accuracy_score(y_test, lr_pred)
    lr_f1 = f1_score(y_test, lr_pred)

    print(f"Random Forest - Accuracy: {rf_acc:.4f}, F1: {rf_f1:.4f}")
    print(f"Logistic Regression - Accuracy: {lr_acc:.4f}, F1: {lr_f1:.4f}")

    if rf_f1 >= lr_f1:
        best_model = rf
        model_type = "Random Forest"
    else:
        best_model = lr
        model_type = "Logistic Regression"

    print(f"Best model selected: {model_type}")

    model_data = {
        'model': best_model,
        'scaler': scaler,
        'features': features,
        'model_type': model_type,
        'performance': {'accuracy': rf_acc, 'f1': rf_f1},
        'X_train': X_train_res
    }
    
    joblib.dump(model_data, 'model.pkl')
    print("Model saved to model.pkl")

if __name__ == "__main__":
    train_model()
