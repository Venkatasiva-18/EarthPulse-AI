import sys
import numpy as np
import joblib
import json
import os
import csv

def get_paths():
    model_path = 'EarthPulseAI/ml/water_quality_model.pkl'
    dataset_path = 'EarthPulseAI/ml/water_quality_dataset.csv'
    if not os.path.exists(model_path):
        model_path = 'ml/water_quality_model.pkl'
        dataset_path = 'ml/water_quality_dataset.csv'
    return model_path, dataset_path

def analyze_water(ph, hardness, solids, chloramines, sulfate, conductivity, organic_carbon, trihalomethanes, turbidity):
    model_path, dataset_path = get_paths()
    features = np.array([[ph, hardness, solids, chloramines, sulfate, conductivity, organic_carbon, trihalomethanes, turbidity]])
    
    if os.path.exists(model_path):
        model = joblib.load(model_path)
        prediction = model.predict(features)[0]
        probability = model.predict_proba(features)[0][1]
    else:
        # Fallback
        prediction = 1 if 6.5 <= ph <= 8.5 and solids < 1000 else 0
        probability = 0.8 if prediction == 1 else 0.2
    
    # Append to dataset
    try:
        with open(dataset_path, 'a', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([ph, hardness, solids, chloramines, sulfate, conductivity, organic_carbon, trihalomethanes, turbidity, int(prediction)])
    except:
        pass
    
    return {
        "potable": bool(prediction == 1),
        "potabilityScore": round(float(probability * 100), 2)
    }

if __name__ == "__main__":
    try:
        if len(sys.argv) > 9:
            ph = float(sys.argv[1])
            hardness = float(sys.argv[2])
            solids = float(sys.argv[3])
            chloramines = float(sys.argv[4])
            sulfate = float(sys.argv[5])
            conductivity = float(sys.argv[6])
            organic_carbon = float(sys.argv[7])
            trihalomethanes = float(sys.argv[8])
            turbidity = float(sys.argv[9])
            
            result = analyze_water(ph, hardness, solids, chloramines, sulfate, conductivity, organic_carbon, trihalomethanes, turbidity)
            print(json.dumps(result))
        else:
            print(json.dumps({"error": "Insufficient arguments"}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
