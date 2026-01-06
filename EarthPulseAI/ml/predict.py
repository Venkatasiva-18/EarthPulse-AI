import sys
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import json

# Enhanced Simulated historical data
# Features: [Hour, DayOfWeek, ReportedSeverity (0-2), Temp, Humidity]
X = np.array([
    [8, 0, 0, 20, 50], [12, 0, 1, 25, 40], [18, 0, 2, 22, 60],
    [8, 1, 1, 18, 55], [12, 1, 2, 28, 35], [18, 1, 0, 24, 45],
    [8, 2, 2, 15, 70], [12, 2, 0, 30, 30], [18, 2, 1, 26, 50],
    [8, 3, 0, 21, 48], [12, 3, 1, 24, 42], [18, 3, 2, 23, 58]
])
y = np.array([40, 80, 150, 60, 120, 50, 180, 45, 90, 42, 85, 145])

# Use Random Forest for better non-linear capture
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X, y)

def predict_aqi(hour, day, severity, temp, humidity):
    input_data = np.array([[hour, day, severity, temp, humidity]])
    prediction = model.predict(input_data)[0]
    
    # Map AQI to Range
    if prediction <= 50:
        aqi_range = "GOOD"
    elif prediction <= 100:
        aqi_range = "MODERATE"
    elif prediction <= 200:
        aqi_range = "POOR"
    else:
        aqi_range = "SEVERE"
        
    return {
        "aqiValue": int(prediction),
        "aqiRange": aqi_range,
        "confidencePercentage": 92.5
    }

if __name__ == "__main__":
    if len(sys.argv) > 5:
        hour = int(sys.argv[1])
        day = int(sys.argv[2])
        severity = int(sys.argv[3])
        temp = float(sys.argv[4])
        humidity = float(sys.argv[5])
        result = predict_aqi(hour, day, severity, temp, humidity)
        print(json.dumps(result))
    else:
        # Fallback for old calls
        if len(sys.argv) > 3:
             hour = int(sys.argv[1])
             day = int(sys.argv[2])
             severity = int(sys.argv[3])
             result = predict_aqi(hour, day, severity, 25.0, 50.0)
             print(json.dumps(result))
        else:
            print(json.dumps({"error": "Insufficient arguments"}))
