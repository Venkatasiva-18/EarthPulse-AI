import csv
import random

# 1. AQI Dataset Generation
with open('EarthPulseAI/ml/aqi_dataset.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['Hour', 'DayOfWeek', 'ReportedSeverity', 'Temp', 'Humidity', 'AQI'])
    for _ in range(500):
        hour = random.randint(0, 23)
        day = random.randint(0, 6)
        severity = random.randint(0, 2)
        temp = random.randint(10, 45)
        humidity = random.randint(20, 90)
        
        # Base AQI
        aqi = 30 + (severity * 60) + (temp * 1.5) + (humidity * 0.8)
        # Peak traffic hours impact
        if 8 <= hour <= 10 or 17 <= hour <= 20:
            aqi += 50 + random.randint(10, 40)
        
        writer.writerow([hour, day, severity, temp, humidity, int(aqi)])

# 2. Industrial Risk Dataset Generation
with open('EarthPulseAI/ml/industrial_risk_dataset.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['FactoryType', 'EmissionVolume', 'WaterDist', 'ResidentialDist', 'ComplianceScore', 'RiskScore'])
    types = ["CHEMICAL", "METAL", "PETROLEUM", "PHARMACEUTICAL", "TEXTILE", "FOOD", "MINING", "GENERAL"]
    type_hazard = {"CHEMICAL": 1.5, "METAL": 1.3, "PETROLEUM": 1.4, "PHARMACEUTICAL": 1.1, "TEXTILE": 1.1, "FOOD": 0.8, "MINING": 1.6, "GENERAL": 1.0}
    
    for _ in range(1000):
        f_type = random.choice(types)
        emission = random.randint(100, 5000)
        w_dist = random.randint(10, 5000)
        r_dist = random.randint(100, 10000)
        compliance = random.randint(0, 100)
        
        # Risk logic (More predictable pattern for model)
        risk = (emission * type_hazard[f_type]) / 30.0
        if w_dist < 1000: risk += (1000 - w_dist) / 5.0
        if r_dist < 3000: risk += (3000 - r_dist) / 10.0
        risk -= compliance * 0.5
        
        risk = max(0, min(100, risk))
        writer.writerow([f_type, emission, w_dist, r_dist, compliance, int(risk)])

# 3. Water Quality Dataset Generation (Increased noise for 85-93% accuracy)
with open('EarthPulseAI/ml/water_quality_dataset.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['ph', 'Hardness', 'Solids', 'Chloramines', 'Sulfate', 'Conductivity', 'Organic_carbon', 'Trihalomethanes', 'Turbidity', 'Potability'])
    for _ in range(1200):
        ph = round(random.uniform(4, 11), 2)
        hardness = round(random.uniform(50, 450), 1)
        solids = round(random.uniform(100, 3500), 1)
        chloramines = round(random.uniform(0, 12), 2)
        sulfate = round(random.uniform(10, 550), 1)
        conductivity = round(random.uniform(100, 1200), 1)
        oc = round(random.uniform(0, 35), 2)
        thm = round(random.uniform(0, 180), 2)
        turbidity = round(random.uniform(0, 12), 2)
        
        # Potability logic with significant "fuzzy" boundaries
        score = 100
        if not (6.5 <= ph <= 8.5): score -= random.randint(25, 45)
        if hardness > 300: score -= random.randint(15, 35)
        if solids > 1000: score -= random.randint(25, 45)
        if chloramines > 4: score -= random.randint(25, 45)
        if sulfate > 250: score -= random.randint(25, 45)
        if turbidity > 5: score -= random.randint(25, 45)
        
        # Add random noise to score (-20 to +20)
        score += random.randint(-20, 20)
        
        # Potability threshold
        potable = 1 if score >= 60 else 0
        
        # Significant random flips to reduce accuracy to ~90% (8% chance)
        if random.random() < 0.08:
            potable = 1 - potable
        
        writer.writerow([ph, hardness, solids, chloramines, sulfate, conductivity, oc, thm, turbidity, potable])
