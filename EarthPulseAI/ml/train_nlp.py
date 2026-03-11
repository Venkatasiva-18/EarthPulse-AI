import pandas as pd
import joblib
import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.multioutput import MultiOutputClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import os

def train_nlp_model():
    dataset_path = 'EarthPulseAI/ml/nlp_dataset.csv'
    if not os.path.exists(dataset_path):
        dataset_path = 'ml/nlp_dataset.csv'
        
    data = pd.read_csv(dataset_path)
    X = data['Description']
    y = data[['HealthSymptom', 'PollutionSource', 'EnvironmentalHazard']]
    
    # Text Vectorization
    vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
    X_vec = vectorizer.fit_transform(X)
    
    # Multi-label classification
    X_train, X_test, y_train, y_test = train_test_split(X_vec, y, test_size=0.2, random_state=42)
    
    forest = RandomForestClassifier(n_estimators=100, random_state=42)
    model = MultiOutputClassifier(forest, n_jobs=-1)
    
    model.fit(X_train, y_train)
    
    # Evaluation
    y_pred = model.predict(X_test)
    
    # Calculate exact accuracy for all labels being correct
    exact_accuracy = accuracy_score(y_test, y_pred)
    
    print(f"NLP Model Training Completed.")
    print(f"Real Exact Accuracy Score (all labels match): {exact_accuracy:.4f} ({(exact_accuracy*100):.2f}%)")
    
    # Classification report for each label
    labels = ['HealthSymptom', 'PollutionSource', 'EnvironmentalHazard']
    for i, label in enumerate(labels):
        label_acc = accuracy_score(y_test.iloc[:, i], y_pred[:, i])
        print(f"Accuracy for {label}: {label_acc:.4f}")

    # Save vectorizer and model
    model_data = {
        'vectorizer': vectorizer,
        'model': model,
        'labels': labels,
        'accuracy': exact_accuracy
    }
    
    model_path = 'EarthPulseAI/ml/nlp_model.pkl'
    if not os.path.exists('EarthPulseAI/ml'):
        model_path = 'ml/nlp_model.pkl'
        
    joblib.dump(model_data, model_path)
    print(f"Saved NLP model and vectorizer to {model_path}")
    
    # Update model_accuracies.json
    accuracy_file = 'EarthPulseAI/ml/model_accuracies.json'
    if not os.path.exists(accuracy_file):
        accuracy_file = 'ml/model_accuracies.json'
    
    if os.path.exists(accuracy_file):
        try:
            with open(accuracy_file, 'r') as f:
                accuracies = json.load(f)
            
            accuracies["NLP Description Analyzer"] = f"{(exact_accuracy*100):.2f}%"
            
            with open(accuracy_file, 'w') as f:
                json.dump(accuracies, f, indent=4)
            print(f"Updated {accuracy_file} with NLP model accuracy.")
        except Exception as e:
            print(f"Error updating model_accuracies.json: {str(e)}")

if __name__ == "__main__":
    train_nlp_model()
