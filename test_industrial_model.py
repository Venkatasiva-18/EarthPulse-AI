import sys
import os
import json

# Add the directory to path so we can import industrial_risk
sys.path.append('EarthPulseAI/ml')
import industrial_risk

def test_model():
    # Test cases: factory_type, emission, water_dist, residential_dist, compliance
    test_cases = [
        ("CHEMICAL", 4000, 500, 1000, 20),
        ("GENERAL", 1000, 4000, 8000, 90),
        ("MINING", 5000, 100, 500, 5),
        ("FOOD", 500, 5000, 10000, 95)
    ]
    
    print(f"{'Type':<15} {'Emission':<10} {'W_Dist':<10} {'R_Dist':<10} {'Comp':<10} {'Score':<10} {'Level':<10}")
    print("-" * 80)
    
    for tc in test_cases:
        result = industrial_risk.analyze_industrial_risk(*tc)
        print(f"{tc[0]:<15} {tc[1]:<10} {tc[2]:<10} {tc[3]:<10} {tc[4]:<10} {result['riskScore']:<10} {result['riskLevel']:<10}")

if __name__ == "__main__":
    test_model()
