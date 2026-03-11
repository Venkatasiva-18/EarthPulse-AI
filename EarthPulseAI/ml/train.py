import pandas as pd
import numpy as np
import joblib
import os
import json
from sklearn.ensemble import GradientBoostingRegressor, GradientBoostingClassifier
from sklearn.model_selection import train_test_split

from sklearn.metrics import mean_squared_error, r2_score, accuracy_score

def train_aqi_model():
    dataset_path = 'EarthPulseAI/ml/aqi_dataset.csv'
    if not os.path.exists(dataset_path):
        dataset_path = 'ml/aqi_dataset.csv'
    
    data = pd.read_csv(dataset_path)
    X = data.drop('AQI', axis=1)
    y = data['AQI']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Using Gradient Boosting for better accuracy
    model = GradientBoostingRegressor(n_estimators=200, learning_rate=0.1, max_depth=4, random_state=42)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    r2 = r2_score(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    
    model_data = {
        'model': model,
        'r2': r2,
        'rmse': rmse
    }
    
    model_path = 'EarthPulseAI/ml/aqi_model.pkl'
    if not os.path.exists('EarthPulseAI/ml'):
        model_path = 'ml/aqi_model.pkl'
        
    joblib.dump(model_data, model_path)
    print(f"AQI model trained. R^2: {r2:.4f}, RMSE: {rmse:.4f}. Saved to {model_path}")
    update_accuracy_json("AQI Forecasting Model", f"{(r2*100):.2f}% (R^2: {r2:.4f}, RMSE: {rmse:.2f})")

def train_industrial_risk_model():
    dataset_path = 'EarthPulseAI/ml/industrial_risk_dataset.csv'
    if not os.path.exists(dataset_path):
        dataset_path = 'ml/industrial_risk_dataset.csv'
    
    data = pd.read_csv(dataset_path)
    
    # Factory Type Encoding
    type_map = {"GENERAL": 0, "CHEMICAL": 1, "METAL": 2, "PETROLEUM": 3, "PHARMACEUTICAL": 4, "TEXTILE": 5, "FOOD": 6, "MINING": 7}
    data['FactoryType'] = data['FactoryType'].map(type_map)
    
    X = data.drop('RiskScore', axis=1)
    y = data['RiskScore']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = GradientBoostingRegressor(n_estimators=200, learning_rate=0.1, max_depth=4, random_state=42)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    r2 = r2_score(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    
    model_data = {
        'model': model,
        'r2': r2,
        'rmse': rmse
    }
    
    model_path = 'EarthPulseAI/ml/industrial_risk_model.pkl'
    if not os.path.exists('EarthPulseAI/ml'):
        model_path = 'ml/industrial_risk_model.pkl'
        
    joblib.dump(model_data, model_path)
    print(f"Industrial Risk model trained. R^2: {r2:.4f}, RMSE: {rmse:.4f}. Saved to {model_path}")
    update_accuracy_json("Industrial Risk Profiler", f"{(r2*100):.2f}% (R^2: {r2:.4f}, RMSE: {rmse:.2f})")

def train_water_quality_model():
    dataset_path = 'EarthPulseAI/ml/water_quality_dataset.csv'
    if not os.path.exists(dataset_path):
        dataset_path = 'ml/water_quality_dataset.csv'
    
    data = pd.read_csv(dataset_path)
    X = data.drop('Potability', axis=1)
    y = data['Potability']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, max_depth=3, random_state=42)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    model_data = {
        'model': model,
        'accuracy': accuracy
    }
    
    model_path = 'EarthPulseAI/ml/water_quality_model.pkl'
    if not os.path.exists('EarthPulseAI/ml'):
        model_path = 'ml/water_quality_model.pkl'
        
    joblib.dump(model_data, model_path)
    print(f"Water Quality model trained. Accuracy: {accuracy:.4f}. Saved to {model_path}")
    update_accuracy_json("Water Quality Analyzer", f"{(accuracy*100):.2f}%")

def update_accuracy_json(model_name, accuracy_str):
    accuracy_file = 'EarthPulseAI/ml/model_accuracies.json'
    if not os.path.exists(accuracy_file):
        accuracy_file = 'ml/model_accuracies.json'
    
    if os.path.exists(accuracy_file):
        try:
            with open(accuracy_file, 'r') as f:
                accuracies = json.load(f)
            
            accuracies[model_name] = accuracy_str
            
            with open(accuracy_file, 'w') as f:
                json.dump(accuracies, f, indent=4)
        except Exception as e:
            print(f"Error updating model_accuracies.json: {str(e)}")

from train_nlp import train_nlp_model

if __name__ == "__main__":
    train_aqi_model()
    train_industrial_risk_model()
    train_water_quality_model()
    train_nlp_model()
