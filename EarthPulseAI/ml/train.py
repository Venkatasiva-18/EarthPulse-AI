import sys
import os

# Simulated training/feedback collection
if __name__ == "__main__":
    if len(sys.argv) > 6:
        hour = sys.argv[1]
        day = sys.argv[2]
        severity = sys.argv[3]
        temp = sys.argv[4]
        humidity = sys.argv[5]
        actual_aqi = sys.argv[6]
        
        data_line = f"{hour},{day},{severity},{temp},{humidity},{actual_aqi}\n"
        
        # Append to a data file for future retraining
        with open("ml/feedback_data.csv", "a") as f:
            f.write(data_line)
        
        print(f"Feedback recorded: {data_line.strip()}")
    else:
        print("Insufficient arguments for training feedback")
