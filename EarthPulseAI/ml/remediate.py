import sys
import json
import re

def analyze_description_nlp(description):
    if not description:
        return []
    
    # NLP-lite: Keyword-based suggestion refinement
    nlp_suggestions = []
    
    keywords = {
        "health": ["breathing", "cough", "asthma", "eye", "skin", "rash", "health", "sick"],
        "construction": ["dust", "cement", "construction", "building", "digging"],
        "industrial": ["smoke", "chemical", "smell", "factory", "industrial", "toxic"],
        "water_health": ["stomach", "drinking", "fever", "diarrhea"],
        "noise_health": ["sleep", "headache", "concentration", "ear"]
    }

    # Search for health-related concerns in the description
    found_categories = []
    for category, terms in keywords.items():
        if any(term in description.lower() for term in terms):
            found_categories.append(category)

    if "health" in found_categories or "breathing" in description.lower():
        nlp_suggestions.append("Immediate consultation with a healthcare professional is recommended for respiratory symptoms.")
    
    if "construction" in found_categories:
        nlp_suggestions.append("The detected construction dust requires specialized fine-particle filtering masks (N95 or higher).")

    if "industrial" in found_categories:
        nlp_suggestions.append("Alert local environmental authorities about potential chemical emissions immediately.")

    if "water_health" in found_categories:
        nlp_suggestions.append("Cease all use of local water for consumption until professional testing is completed.")

    return nlp_suggestions

def get_remediation_measures(pollution_type, severity, description=""):
    pollution_type = pollution_type.upper()
    severity = severity.upper()

    # Base measures (same as before)
    measures = {
        "AIR": {
            "LOW": {
                "recommendedActions": "Monitor air quality levels; use public transport if possible.",
                "behavioralChanges": "Reduce outdoor activities during peak traffic hours.",
                "immediateActions": "Close windows during high traffic periods; plant indoor air-purifying plants.",
                "impactScore": 20
            },
            "MEDIUM": {
                "recommendedActions": "Wear masks outdoors; avoid high-traffic areas.",
                "behavioralChanges": "Use air purifiers at home; switch to eco-friendly fuels.",
                "immediateActions": "Limit intense outdoor physical activities; keep indoor environments well-ventilated.",
                "impactScore": 50
            },
            "HIGH": {
                "recommendedActions": "Stay indoors as much as possible; use N95 masks if going out.",
                "behavioralChanges": "Strictly follow local air quality advisories; advocate for stricter emission controls.",
                "immediateActions": "Use high-efficiency air filtration systems; avoid all outdoor exertion.",
                "impactScore": 90
            }
        },
        "WATER": {
            "LOW": {
                "recommendedActions": "Boil water before drinking; avoid direct contact with stagnant water.",
                "behavioralChanges": "Dispose of household waste properly; minimize use of chemical fertilizers.",
                "immediateActions": "Use simple water filters; check local water supply reports.",
                "impactScore": 25
            },
            "MEDIUM": {
                "recommendedActions": "Use advanced water purification (RO/UV); report local water contamination sources.",
                "behavioralChanges": "Install water-saving fixtures; participate in local water body cleanup drives.",
                "immediateActions": "Strictly avoid using contaminated water for cooking; notify neighbors about risks.",
                "impactScore": 60
            },
            "HIGH": {
                "recommendedActions": "Use only certified bottled water; avoid any contact with local water sources.",
                "behavioralChanges": "Implement industrial-grade water treatment; demand immediate government intervention.",
                "immediateActions": "Decontaminate storage tanks; use water treatment tablets for emergency needs.",
                "impactScore": 95
            }
        },
        "SOIL": {
            "LOW": {
                "recommendedActions": "Practice composting; avoid using chemical pesticides in small gardens.",
                "behavioralChanges": "Switch to organic gardening practices; ensure proper waste segregation.",
                "immediateActions": "Remove visible debris from soil; add organic matter to improve soil health.",
                "impactScore": 15
            },
            "MEDIUM": {
                "recommendedActions": "Conduct soil testing; use bio-fertilizers; plant soil-remediating vegetation.",
                "behavioralChanges": "Avoid disposal of hazardous chemicals in the backyard; support sustainable farming.",
                "immediateActions": "Restrict access to contaminated areas; use mulching to prevent erosion.",
                "impactScore": 45
            },
            "HIGH": {
                "recommendedActions": "Professional soil remediation required; avoid growing food in contaminated soil.",
                "behavioralChanges": "Strictly regulate industrial waste disposal; implement large-scale phytoremediation.",
                "immediateActions": "Isolate the site; prevent runoff to water bodies; consult environmental experts.",
                "impactScore": 85
            }
        },
        "NOISE": {
            "LOW": {
                "recommendedActions": "Install sound-absorbing curtains; maintain vehicles to reduce noise.",
                "behavioralChanges": "Lower the volume of electronics; avoid unnecessary honking.",
                "immediateActions": "Use earplugs in noisy environments; close doors and windows to dampen sound.",
                "impactScore": 10
            },
            "MEDIUM": {
                "recommendedActions": "Use double-glazed windows; plant noise-buffering trees/hedges.",
                "behavioralChanges": "Schedule noisy activities during non-rest hours; use noise-canceling headphones.",
                "immediateActions": "Identify and isolate noise sources; use acoustic barriers.",
                "impactScore": 30
            },
            "HIGH": {
                "recommendedActions": "Relocate from extremely noisy areas; install industrial-grade soundproofing.",
                "behavioralChanges": "Advocate for noise-free zones; strictly enforce local noise ordinances.",
                "immediateActions": "Wear high-quality ear protection; seek professional noise level assessments.",
                "impactScore": 70
            }
        }
    }

    # Default measures if type or severity not found
    default_type = measures.get(pollution_type, measures["AIR"])
    result = default_type.get(severity, default_type["MEDIUM"]).copy()
    
    # NLP Enhancement
    nlp_additions = analyze_description_nlp(description)
    if nlp_additions:
        result["recommendedActions"] += " " + " ".join(nlp_additions)
        result["impactScore"] = min(100, result["impactScore"] + 5)
    
    return result

if __name__ == "__main__":
    try:
        if len(sys.argv) > 2:
            pollution_type = sys.argv[1]
            severity = sys.argv[2]
            description = " ".join(sys.argv[3:]) if len(sys.argv) > 3 else ""
            
            result = get_remediation_measures(pollution_type, severity, description)
            print(json.dumps(result))
        else:
            print(json.dumps({"error": "Insufficient arguments"}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
