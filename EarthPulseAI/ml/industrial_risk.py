import sys
import numpy as np
import joblib
import json
import os
import csv

def get_paths():
    model_path = 'EarthPulseAI/ml/industrial_risk_model.pkl'
    dataset_path = 'EarthPulseAI/ml/industrial_risk_dataset.csv'
    if not os.path.exists(model_path):
        model_path = 'ml/industrial_risk_model.pkl'
        dataset_path = 'ml/industrial_risk_dataset.csv'
    return model_path, dataset_path

def analyze_industrial_risk(factory_type, emission_volume, water_dist, residential_dist, compliance):
    model_path, dataset_path = get_paths()
    
    type_map = {"GENERAL": 0, "CHEMICAL": 1, "METAL": 2, "PETROLEUM": 3, "PHARMACEUTICAL": 4, "TEXTILE": 5, "FOOD": 6, "MINING": 7}
    type_encoded = type_map.get(factory_type.upper(), 0)
    
    features = np.array([[type_encoded, emission_volume, water_dist, residential_dist, compliance]])
    
    if os.path.exists(model_path):
        model_data = joblib.load(model_path)
        if isinstance(model_data, dict):
            model = model_data.get('model')
        else:
            model = model_data
        prediction = model.predict(features)[0]
    else:
        # Fallback
        prediction = (emission_volume / 50.0) - (compliance * 0.2)
    
    # Clamp prediction between 0 and 100
    prediction = max(0, min(100, prediction))
    
    # Append to dataset
    try:
        with open(dataset_path, 'a', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([factory_type.upper(), int(emission_volume), int(water_dist), int(residential_dist), int(compliance), int(prediction)])
    except:
        pass
    
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
