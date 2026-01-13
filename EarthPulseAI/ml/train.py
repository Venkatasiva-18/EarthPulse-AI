import sys
import os
from datetime import datetime

def record_feedback(pollution_type, hour, day, severity, temp, humidity, wind_speed, actual_value):
    feedback_file = f"ml/feedback_data_{pollution_type.lower()}.csv"
    
    try:
        with open(feedback_file, "a") as f:
            timestamp = datetime.now().isoformat()
            data_line = f"{timestamp},{hour},{day},{severity},{temp},{humidity},{wind_speed},{actual_value}\n"
            f.write(data_line)
        return True
    except Exception as e:
        print(f"Error recording feedback: {e}", file=sys.stderr)
        return False

if __name__ == "__main__":
    if len(sys.argv) > 8:
        pollution_type = sys.argv[1]
        hour = sys.argv[2]
        day = sys.argv[3]
        severity = sys.argv[4]
        temp = sys.argv[5]
        humidity = sys.argv[6]
        wind_speed = sys.argv[7]
        actual_value = sys.argv[8]
        
        success = record_feedback(pollution_type, hour, day, severity, temp, humidity, wind_speed, actual_value)
        
        if success:
            print(f"Feedback recorded for {pollution_type}: {actual_value}")
        else:
            print(f"Failed to record feedback for {pollution_type}", file=sys.stderr)
    else:
        print("Insufficient arguments for training feedback")
