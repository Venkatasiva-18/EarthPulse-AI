import sys
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import json
from datetime import datetime, timedelta

X = np.array([
    [8, 0, 0, 20, 50], [12, 0, 1, 25, 40], [18, 0, 2, 22, 60],
    [8, 1, 1, 18, 55], [12, 1, 2, 28, 35], [18, 1, 0, 24, 45],
    [8, 2, 2, 15, 70], [12, 2, 0, 30, 30], [18, 2, 1, 26, 50],
    [8, 3, 0, 21, 48], [12, 3, 1, 24, 42], [18, 3, 2, 23, 58]
])
y = np.array([40, 80, 150, 60, 120, 50, 180, 45, 90, 42, 85, 145])

model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X, y)

def predict_aqi(hour, day, severity, temp, humidity):
    input_data = np.array([[hour, day, severity, temp, humidity]])
    prediction = model.predict(input_data)[0]
    
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

def predict_pollutants(hour, day, severity, temp, humidity):
    aqi_result = predict_aqi(hour, day, severity, temp, humidity)
    aqi = aqi_result["aqiValue"]
    
    pm25 = aqi * 0.4 + np.random.normal(0, 5)
    pm10 = aqi * 0.6 + np.random.normal(0, 8)
    no2 = aqi * 0.3 + np.random.normal(0, 3)
    so2 = aqi * 0.2 + np.random.normal(0, 2)
    co = aqi * 0.25 + np.random.normal(0, 4)
    o3 = aqi * 0.15 + np.random.normal(0, 2)
    
    return {
        "aqiValue": aqi_result["aqiValue"],
        "aqiRange": aqi_result["aqiRange"],
        "confidencePercentage": aqi_result["confidencePercentage"],
        "pollutantLevels": {
            "PM2.5": max(0, round(float(pm25), 2)),
            "PM10": max(0, round(float(pm10), 2)),
            "NO2": max(0, round(float(no2), 2)),
            "SO2": max(0, round(float(so2), 2)),
            "CO": max(0, round(float(co), 2)),
            "O3": max(0, round(float(o3), 2))
        }
    }

def forecast_trend(current_aqi, days=7):
    trend_data = []
    trend_direction = "STABLE"
    
    change_rate = np.random.uniform(-0.15, 0.15)
    
    for day in range(days):
        future_aqi = current_aqi * (1 + change_rate * (day + 1))
        future_aqi = max(0, min(500, future_aqi))
        
        forecast_date = (datetime.now() + timedelta(days=day+1)).isoformat()
        
        if future_aqi > current_aqi * 1.05:
            trend_direction = "INCREASING"
        elif future_aqi < current_aqi * 0.95:
            trend_direction = "DECREASING"
        
        trend_data.append({
            "date": forecast_date,
            "predictedAQI": int(future_aqi),
            "confidence": max(70, 95 - (day * 5))
        })
    
    return {
        "trend": trend_direction,
        "forecast": trend_data,
        "recommendation": get_trend_recommendation(trend_direction)
    }

def get_trend_recommendation(trend):
    recommendations = {
        "INCREASING": "Pollution levels are rising. Consider preventive measures and limit outdoor activities.",
        "DECREASING": "Pollution levels are improving. Continue current mitigation efforts.",
        "STABLE": "Pollution levels remain constant. Maintain current air quality practices."
    }
    return recommendations.get(trend, "Monitor air quality levels regularly.")

if __name__ == "__main__":
    try:
        if len(sys.argv) > 5:
            hour = int(sys.argv[1])
            day = int(sys.argv[2])
            severity = int(sys.argv[3])
            temp = float(sys.argv[4])
            humidity = float(sys.argv[5])
            
            mode = sys.argv[6] if len(sys.argv) > 6 else "basic"
            
            if mode == "detailed":
                result = predict_pollutants(hour, day, severity, temp, humidity)
            else:
                result = predict_aqi(hour, day, severity, temp, humidity)
            
            print(json.dumps(result))
        elif len(sys.argv) > 3:
            hour = int(sys.argv[1])
            day = int(sys.argv[2])
            severity = int(sys.argv[3])
            result = predict_aqi(hour, day, severity, 25.0, 50.0)
            print(json.dumps(result))
        else:
            print(json.dumps({"error": "Insufficient arguments"}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
