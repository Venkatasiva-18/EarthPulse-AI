import sys
import numpy as np
from sklearn.ensemble import RandomForestClassifier
import json
import os

# Simulated Training Data for Water Potability
X = np.array([
    [7.0, 150, 500, 2.0, 100, 400, 10, 50, 2.5],
    [8.5, 200, 800, 3.5, 150, 500, 15, 70, 4.0],
    [5.0, 300, 1200, 5.0, 300, 600, 20, 90, 6.0],
    [6.5, 100, 300, 1.0, 50, 300, 5, 30, 1.5],
    [9.5, 350, 1500, 6.0, 400, 700, 25, 110, 7.5],
    [7.5, 180, 600, 2.5, 120, 450, 12, 60, 3.0],
    [4.0, 400, 2000, 8.0, 500, 800, 30, 130, 10.0],
    [8.0, 120, 400, 1.5, 80, 350, 8, 40, 2.0]
])
y = np.array([1, 1, 0, 1, 0, 1, 0, 1])

# Load from dataset if available
dataset_path = "ml/water_quality_dataset.csv"
if not os.path.exists(dataset_path):
    dataset_path = "EarthPulseAI/ml/water_quality_dataset.csv"

if os.path.exists(dataset_path):
    try:
        data = np.genfromtxt(dataset_path, delimiter=',', skip_header=1)
        if data.shape[0] > 0:
            X = data[:, :-1]
            y = data[:, -1]
    except:
        pass

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, y)

def analyze_water(ph, hardness, solids, chloramines, sulfate, conductivity, organic_carbon, trihalomethanes, turbidity):
    features = np.array([[ph, hardness, solids, chloramines, sulfate, conductivity, organic_carbon, trihalomethanes, turbidity]])
    prediction = model.predict(features)[0]
    probability = model.predict_proba(features)[0][1] # Probability of being potable
    
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
