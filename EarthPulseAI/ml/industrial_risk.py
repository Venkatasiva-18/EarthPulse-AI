import sys
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import json
import os

# Simulated Training Data for Industrial Risk
X = np.array([
    [1, 1000, 500, 2000, 90],
    [2, 2000, 200, 1500, 70],
    [3, 5000, 100, 3000, 50],
    [4, 800, 1000, 5000, 95],
    [1, 3000, 50, 1000, 40],
    [0, 500, 2000, 8000, 85],
    [2, 4000, 300, 500, 30],
    [3, 1500, 800, 4000, 75]
])
y = np.array([30, 60, 85, 20, 90, 10, 95, 45])

# Load from dataset if available
dataset_path = "ml/industrial_risk_dataset.csv"
if not os.path.exists(dataset_path):
    dataset_path = "EarthPulseAI/ml/industrial_risk_dataset.csv"

if os.path.exists(dataset_path):
    try:
        # Load and encode factory type
        type_map = {"GENERAL": 0, "CHEMICAL": 1, "METAL": 2, "PETROLEUM": 3, "PHARMACEUTICAL": 4}
        with open(dataset_path, 'r') as f:
            lines = f.readlines()[1:] # skip header
            data_X = []
            data_y = []
            for line in lines:
                parts = line.strip().split(',')
                if len(parts) == 6:
                    t_enc = type_map.get(parts[0].upper(), 0)
                    row = [t_enc] + [float(x) for x in parts[1:5]]
                    data_X.append(row)
                    data_y.append(float(parts[5]))
            if data_X:
                X = np.array(data_X)
                y = np.array(data_y)
    except:
        pass

model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X, y)

def analyze_industrial_risk(factory_type, emission_volume, water_dist, residential_dist, compliance):
    type_map = {"GENERAL": 0, "CHEMICAL": 1, "METAL": 2, "PETROLEUM": 3, "PHARMACEUTICAL": 4}
    type_encoded = type_map.get(factory_type.upper(), 0)
    
    features = np.array([[type_encoded, emission_volume, water_dist, residential_dist, compliance]])
    prediction = model.predict(features)[0]
    
    risk_level = "LOW"
    if prediction > 75:
        risk_level = "EXTREME"
    elif prediction > 50:
        risk_level = "HIGH"
    elif prediction > 25:
        risk_level = "MODERATE"
        
    return {
        "riskScore": round(float(prediction), 2),
        "riskLevel": risk_level,
        "toxicReleaseIntensity": round(float(emission_volume * 0.85), 2),
        "mitigationPriority": "IMMEDIATE" if prediction > 50 else "ROUTINE"
    }

if __name__ == "__main__":
    try:
        if len(sys.argv) > 5:
            factory_type = sys.argv[1]
            emission_volume = float(sys.argv[2])
            water_dist = float(sys.argv[3])
            residential_dist = float(sys.argv[4])
            compliance = float(sys.argv[5])
            
            result = analyze_industrial_risk(factory_type, emission_volume, water_dist, residential_dist, compliance)
            print(json.dumps(result))
        else:
            print(json.dumps({"error": "Insufficient arguments"}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
