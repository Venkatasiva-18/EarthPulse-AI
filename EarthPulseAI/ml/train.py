import pandas as pd
import numpy as np
import joblib
import os
from sklearn.ensemble import GradientBoostingRegressor, GradientBoostingClassifier
from sklearn.model_selection import train_test_split

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
    
    score = model.score(X_test, y_test)
    
    model_path = 'EarthPulseAI/ml/aqi_model.pkl'
    if not os.path.exists('EarthPulseAI/ml'):
        model_path = 'ml/aqi_model.pkl'
        
    joblib.dump(model, model_path)
    print(f"AQI model trained. R^2 Accuracy Score: {score:.4f} ({(score*100):.2f}%). Saved to {model_path}")

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
    
    score = model.score(X_test, y_test)
    
    model_path = 'EarthPulseAI/ml/industrial_risk_model.pkl'
    if not os.path.exists('EarthPulseAI/ml'):
        model_path = 'ml/industrial_risk_model.pkl'
        
    joblib.dump(model, model_path)
    print(f"Industrial Risk model trained. R^2 Accuracy Score: {score:.4f} ({(score*100):.2f}%). Saved to {model_path}")

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
    
    accuracy = model.score(X_test, y_test)
    
    model_path = 'EarthPulseAI/ml/water_quality_model.pkl'
    if not os.path.exists('EarthPulseAI/ml'):
        model_path = 'ml/water_quality_model.pkl'
        
    joblib.dump(model, model_path)
    print(f"Water Quality model trained. Accuracy Score: {accuracy:.4f} ({(accuracy*100):.2f}%). Saved to {model_path}")

if __name__ == "__main__":
    train_aqi_model()
    train_industrial_risk_model()
    train_water_quality_model()
