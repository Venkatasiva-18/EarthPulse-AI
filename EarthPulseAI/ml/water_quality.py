import sys
import numpy as np
import joblib
import json
import os
import csv
import pandas as pd
import warnings

# Suppress sklearn feature names warning
warnings.filterwarnings("ignore", category=UserWarning)

def get_paths():
    model_path = 'EarthPulseAI/ml/water_quality_model.pkl'
    dataset_path = 'EarthPulseAI/ml/water_quality_dataset.csv'
    if not os.path.exists(model_path):
        model_path = 'ml/water_quality_model.pkl'
        dataset_path = 'ml/water_quality_dataset.csv'
    return model_path, dataset_path

def calculate_wqi_score(ph, hardness, solids, chloramines, sulfate, conductivity, organic_carbon, trihalomethanes, turbidity):
    # Heuristic scoring based on WHO/BIS standards (Updated for realistic assessment)
    scores = []
    is_critical = False
    
    # pH (6.5-8.5 is ideal: 100; permissible 6.0-9.2)
    if 6.5 <= ph <= 8.5: scores.append(100)
    elif 6.0 <= ph <= 9.2: scores.append(85)
    else: 
        scores.append(max(0, 100 - abs(ph - 7.5) * 20))
        if ph < 4.5 or ph > 10.5: is_critical = True 
    
    # Hardness (< 200 mg/L is desirable, 300-600 is permissible)
    if hardness <= 200: scores.append(100)
    elif hardness <= 500: scores.append(80)
    else: 
        scores.append(max(0, 100 - (hardness - 500) * 0.1))
        if hardness > 1000: is_critical = True
    
    # Solids/TDS (< 500 desirable, < 1000 permissible, < 2000 acceptable)
    if solids <= 500: scores.append(100)
    elif solids <= 1000: scores.append(85)
    elif solids <= 2000: scores.append(70)
    else: 
        scores.append(max(0, 70 - (solids - 2000) * 0.05))
        if solids > 3500: is_critical = True 
    
    # Chloramines (< 4 ppm is safe)
    if chloramines <= 4: scores.append(100)
    elif chloramines <= 6: scores.append(70)
    else: 
        scores.append(max(0, 70 - (chloramines - 6) * 20))
        if chloramines > 10: is_critical = True
    
    # Sulfate (< 250 mg/L safe, < 400 permissible)
    if sulfate <= 250: scores.append(100)
    elif sulfate <= 400: scores.append(80)
    else: 
        scores.append(max(0, 80 - (sulfate - 400) * 0.2))
        if sulfate > 600: is_critical = True
    
    # Conductivity (< 800-1000 typical, 1500 permissible)
    if conductivity <= 1000: scores.append(100)
    elif conductivity <= 2000: scores.append(80)
    else: 
        scores.append(max(0, 80 - (conductivity - 2000) * 0.02))
        if conductivity > 4000: is_critical = True
    
    # Organic Carbon (ideally < 10, permissible < 20)
    if organic_carbon <= 10: scores.append(100)
    elif organic_carbon <= 20: scores.append(85)
    else: 
        scores.append(max(0, 85 - (organic_carbon - 20) * 5))
        if organic_carbon > 35: is_critical = True
    
    # Trihalomethanes (< 80 desirable, < 120 permissible)
    if trihalomethanes <= 80: scores.append(100)
    elif trihalomethanes <= 120: scores.append(80)
    else: 
        scores.append(max(0, 80 - (trihalomethanes - 120) * 2))
        if trihalomethanes > 200: is_critical = True
    
    # Turbidity (< 5 NTU safe, < 10 permissible)
    if turbidity <= 5: scores.append(100)
    elif turbidity <= 10: scores.append(75)
    else: 
        scores.append(max(0, 75 - (turbidity - 10) * 10))
        if turbidity > 20: is_critical = True
    
    final_avg = sum(scores) / len(scores)
    
    # Only force "Critical Hazard" if parameters are truly toxic/extreme
    if is_critical:
        return min(35.0, final_avg)
    
    return final_avg

def analyze_water(ph, hardness, solids, chloramines, sulfate, conductivity, organic_carbon, trihalomethanes, turbidity):
    model_path, dataset_path = get_paths()
    
    # Create DataFrame to match feature names if possible or use array
    cols = ['ph', 'Hardness', 'Solids', 'Chloramines', 'Sulfate', 'Conductivity', 'Organic_carbon', 'Trihalomethanes', 'Turbidity']
    features_df = pd.DataFrame([[ph, hardness, solids, chloramines, sulfate, conductivity, organic_carbon, trihalomethanes, turbidity]], 
                               columns=cols)
    
    wqi_score = calculate_wqi_score(ph, hardness, solids, chloramines, sulfate, conductivity, organic_carbon, trihalomethanes, turbidity)
    
    if os.path.exists(model_path):
        try:
            model_data = joblib.load(model_path)
            if isinstance(model_data, dict):
                model = model_data.get('model')
            else:
                model = model_data
            
            prediction = model.predict(features_df)[0]
            probability = model.predict_proba(features_df)[0][1]
            
            # Use a hybrid approach for the score: ML probability + WQI score
            # Trust WQI more as it's more scientific and predictable for the user
            if wqi_score < 60:
                # If heuristic says it's unsafe/critical, ML can only marginally adjust the score
                # but cannot push it into the "Potable" category (>= 60)
                final_score = min(59.9, (wqi_score * 0.85) + (probability * 100 * 0.15))
            else:
                # If heuristic says it's safe, ML probability confirms or slightly adjusts it
                final_score = (wqi_score * 0.8) + (probability * 100 * 0.2)
            
            # A result is potable if it meets the scientific threshold
            is_potable = final_score >= 60.0
        except:
            is_potable = wqi_score >= 60.0
            final_score = wqi_score
    else:
        # Fallback
        is_potable = wqi_score >= 60.0
        final_score = wqi_score
    
    # Append to dataset
    try:
        with open(dataset_path, 'a', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([ph, hardness, solids, chloramines, sulfate, conductivity, organic_carbon, trihalomethanes, turbidity, 1 if is_potable else 0])
    except:
        pass
    
    return {
        "potable": bool(is_potable),
        "potabilityScore": round(float(final_score), 2)
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
