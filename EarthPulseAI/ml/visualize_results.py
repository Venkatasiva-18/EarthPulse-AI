import pandas as pd
import numpy as np
import os
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import GradientBoostingRegressor, GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score, accuracy_score, confusion_matrix, log_loss

def plot_training_deviance(model, X_test, y_test, title, filename):
    test_score = np.zeros((model.n_estimators,), dtype=np.float64)
    for i, y_pred in enumerate(model.staged_predict(X_test)):
        test_score[i] = mean_squared_error(y_test, y_pred)

    plt.figure(figsize=(10, 6))
    plt.title(f'Training vs Validation Deviance - {title}')
    plt.plot(np.arange(model.n_estimators) + 1, model.train_score_, 'b-', label='Training Set Deviance')
    plt.plot(np.arange(model.n_estimators) + 1, test_score, 'r-', label='Test Set Deviance')
    plt.legend(loc='upper right')
    plt.xlabel('Boosting Iterations')
    plt.ylabel('Mean Squared Error')
    plt.grid(True)
    plt.savefig(filename)
    plt.close()

def plot_actual_vs_predicted(y_true, y_pred, title, filename):
    plt.figure(figsize=(10, 6))
    plt.scatter(y_true, y_pred, alpha=0.5)
    plt.plot([y_true.min(), y_true.max()], [y_true.min(), y_true.max()], 'r--', lw=2)
    plt.xlabel('Actual')
    plt.ylabel('Predicted')
    plt.title(f'Actual vs Predicted - {title}')
    plt.grid(True)
    plt.savefig(filename)
    plt.close()

def plot_confusion_matrix(y_true, y_pred, title, filename):
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
    plt.xlabel('Predicted')
    plt.ylabel('Actual')
    plt.title(f'Confusion Matrix - {title}')
    plt.savefig(filename)
    plt.close()

def visualize_aqi():
    print("Visualizing AQI Model...")
    dataset_path = 'EarthPulseAI/ml/aqi_dataset.csv'
    if not os.path.exists(dataset_path): dataset_path = 'ml/aqi_dataset.csv'
    
    data = pd.read_csv(dataset_path)
    X = data.drop('AQI', axis=1)
    y = data['AQI']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = GradientBoostingRegressor(n_estimators=200, learning_rate=0.1, max_depth=4, random_state=42)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    r2 = r2_score(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    print(f"AQI Model - R^2: {r2:.4f}, RMSE: {rmse:.4f}")
    
    os.makedirs('ml/plots', exist_ok=True)
    plot_training_deviance(model, X_test, y_test, 'AQI Forecasting', 'ml/plots/aqi_deviance.png')
    plot_actual_vs_predicted(y_test, y_pred, 'AQI Forecasting', 'ml/plots/aqi_actual_vs_pred.png')

def visualize_industrial_risk():
    print("Visualizing Industrial Risk Model...")
    dataset_path = 'EarthPulseAI/ml/industrial_risk_dataset.csv'
    if not os.path.exists(dataset_path): dataset_path = 'ml/industrial_risk_dataset.csv'
    
    data = pd.read_csv(dataset_path)
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
    print(f"Industrial Risk Model - R^2: {r2:.4f}, RMSE: {rmse:.4f}")
    
    plot_training_deviance(model, X_test, y_test, 'Industrial Risk', 'ml/plots/industrial_risk_deviance.png')
    plot_actual_vs_predicted(y_test, y_pred, 'Industrial Risk', 'ml/plots/industrial_risk_actual_vs_pred.png')

def visualize_water_quality():
    print("Visualizing Water Quality Model...")
    dataset_path = 'EarthPulseAI/ml/water_quality_dataset.csv'
    if not os.path.exists(dataset_path): dataset_path = 'ml/water_quality_dataset.csv'
    
    data = pd.read_csv(dataset_path)
    X = data.drop('Potability', axis=1)
    y = data['Potability']
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, max_depth=3, random_state=42)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Water Quality Model - Accuracy: {accuracy:.4f}")
    
    # Deviance for classification
    test_score = np.zeros((model.n_estimators,), dtype=np.float64)
    for i, y_prob in enumerate(model.staged_predict_proba(X_test)):
        test_score[i] = log_loss(y_test, y_prob)

    plt.figure(figsize=(10, 6))
    plt.title('Training vs Validation Deviance - Water Quality')
    plt.plot(np.arange(model.n_estimators) + 1, model.train_score_, 'b-', label='Training Set Deviance')
    plt.plot(np.arange(model.n_estimators) + 1, test_score, 'r-', label='Test Set Deviance')
    plt.legend(loc='upper right')
    plt.xlabel('Boosting Iterations')
    plt.ylabel('Log Loss')
    plt.grid(True)
    plt.savefig('ml/plots/water_quality_deviance.png')
    plt.close()

    plot_confusion_matrix(y_test, y_pred, 'Water Quality', 'ml/plots/water_quality_confusion_matrix.png')

if __name__ == "__main__":
    visualize_aqi()
    visualize_industrial_risk()
    visualize_water_quality()
    print("All plots generated in ml/plots/ directory.")
