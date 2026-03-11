import csv
import random

def generate_nlp_dataset():
    # Categories and associated phrases/terms
    symptoms = [
        "severe coughing", "shortness of breath", "persistent asthma attacks", 
        "itchy skin rashes", "constant headaches", "burning eyes", 
        "nausea and dizziness", "stomach cramps", "frequent diarrhea", 
        "throat irritation", "lung congestion", "chronic fatigue",
        "difficulty breathing", "allergic reactions", "eye inflammation"
    ]
    
    sources = [
        "nearby chemical factory", "massive construction site", "local industrial plant",
        "heavy vehicle traffic", "waste incineration facility", "coal-fired power plant",
        "mining operations", "sewage treatment leak", "illegal dumping ground",
        "unregulated agricultural runoff", "petrochemical refinery", "metal processing unit",
        "manufacturing hub", "urban transportation hub", "commercial boiler exhaust"
    ]
    
    hazards = [
        "toxic chemical emissions", "hazardous fine dust particles", "noxious smoke clouds",
        "dangerous noise levels", "contaminated water supply", "polluted soil beds",
        "smog-filled atmosphere", "particulate matter spikes", "radioactive waste leak",
        "heavy metal leaching", "harmful ozone levels", "carbon monoxide buildup",
        "sulfur dioxide stench", "microplastic contamination", "pathogen-rich runoff"
    ]
    
    fillers = [
        "Residents are reporting", "We have observed", "There is a noticeable increase in",
        "The community is facing", "Investigations reveal", "Satellite data shows",
        "Sensor alerts indicate", "Citizens are complaining about", "Experts warn of",
        "Recent samples show", "Local news reported on", "Emergency services responded to"
    ]
    
    data = []
    
    # Common typos for noise
    typos = {"breathing": "brething", "chemical": "chemcal", "factory": "fctory", "hazardous": "hazrdous", "pollution": "pllution"}

    for _ in range(1200): # Increased samples
        # Randomly decide which labels this sample will have
        has_symptom = random.choice([0, 1])
        has_source = random.choice([0, 1])
        has_hazard = random.choice([0, 1])
        
        # Ensure at least one label is active occasionally, or sometimes none
        if has_symptom == 0 and has_source == 0 and has_hazard == 0:
            if random.random() < 0.7: # 70% chance to force at least one
                choice = random.randint(0, 2)
                if choice == 0: has_symptom = 1
                elif choice == 1: has_source = 1
                else: has_hazard = 1
        
        parts = [random.choice(fillers)]
        
        selected_symptom = random.choice(symptoms) if has_symptom else None
        selected_source = random.choice(sources) if has_source else None
        selected_hazard = random.choice(hazards) if has_hazard else None
        
        content_parts = []
        if selected_symptom: 
            s = selected_symptom
            # Introduce random typos occasionally
            for word, typo in typos.items():
                if word in s and random.random() < 0.15:
                    s = s.replace(word, typo)
            content_parts.append(s)
            
        if selected_hazard: content_parts.append(selected_hazard)
        if selected_source: content_parts.append(f"from the {selected_source}")
        
        if not content_parts:
            parts.append("normal environmental conditions with no major issues reported.")
        else:
            parts.append(" " + " and ".join(content_parts) + ".")
            
        description = " ".join(parts).replace("  ", " ").strip()
        
        # Add random extra words for noise
        if random.random() < 0.3:
            noise_words = ["maybe", "I think", "possibly", "somehow", "actually", "like"]
            description += " " + random.choice(noise_words)
            
        # Realistic label flips (2% chance to have a wrong label)
        if random.random() < 0.02:
            target_flip = random.randint(0, 2)
            if target_flip == 0: has_symptom = 1 - has_symptom
            elif target_flip == 1: has_source = 1 - has_source
            else: has_hazard = 1 - has_hazard

        data.append([description, has_symptom, has_source, has_hazard])

    dataset_path = 'EarthPulseAI/ml/nlp_dataset.csv'
    with open(dataset_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Description', 'HealthSymptom', 'PollutionSource', 'EnvironmentalHazard'])
        writer.writerows(data)
    
    print(f"Generated {len(data)} samples in {dataset_path}")

if __name__ == "__main__":
    generate_nlp_dataset()
