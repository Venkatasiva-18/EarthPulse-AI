package com.example.EarthPulseAI.service;

import com.example.EarthPulseAI.model.Prediction;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MLService {
    private final PredictionService predictionService;

    public Prediction getPredictionFromML(String location, int hour, int day, int severity, double temp, double humidity) {
        try {
            String pythonCmd = System.getProperty("os.name").toLowerCase().contains("win") ? "py" : "python3";
            
            // Check potential script locations
            String scriptPath = "ml/predict.py";
            if (!new java.io.File(scriptPath).exists()) {
                scriptPath = "EarthPulseAI/ml/predict.py";
            }
            
            ProcessBuilder processBuilder = new ProcessBuilder(pythonCmd, scriptPath, 
                    String.valueOf(hour), String.valueOf(day), String.valueOf(severity),
                    String.valueOf(temp), String.valueOf(humidity));
            processBuilder.redirectErrorStream(false);
            Process process = processBuilder.start();

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            BufferedReader errorReader = new BufferedReader(new InputStreamReader(process.getErrorStream()));
            
            String line;
            String output = null;
            while ((line = reader.readLine()) != null) {
                if (line.trim().startsWith("{")) {
                    output = line;
                }
                System.out.println("ML Out: " + line);
            }

            String errorLine;
            while ((errorLine = errorReader.readLine()) != null) {
                System.err.println("ML Err: " + errorLine);
            }

            int exitCode = process.waitFor();
            if (exitCode != 0 || output == null) {
                System.err.println("ML Process failed with exit code: " + exitCode);
                return null;
            }
            
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> resultMap = mapper.readValue(output, Map.class);

            if (resultMap.containsKey("error")) {
                System.err.println("ML Error from script: " + resultMap.get("error"));
                return null;
            }

            Prediction prediction = new Prediction();
            prediction.setLocation(location);
            
            Object aqiValue = resultMap.get("aqiValue");
            if (aqiValue != null) {
                prediction.setAqiValue(((Number) aqiValue).intValue());
            } else {
                prediction.setAqiValue(0);
            }

            Object aqiRange = resultMap.get("aqiRange");
            if (aqiRange != null) {
                prediction.setAqiRange(Prediction.AQIRange.valueOf((String) aqiRange));
            } else {
                prediction.setAqiRange(Prediction.AQIRange.MODERATE);
            }

            Object confidence = resultMap.get("confidencePercentage");
            if (confidence != null) {
                prediction.setConfidencePercentage(((Number) confidence).doubleValue());
            } else {
                prediction.setConfidencePercentage(0.0);
            }
            
            prediction.setPredictedFor(LocalDateTime.now());

            return predictionService.savePrediction(prediction);

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
    public void provideFeedback(int hour, int day, int severity, double temp, double humidity, int actualAqi) {
        try {
            String pythonCmd = System.getProperty("os.name").toLowerCase().contains("win") ? "py" : "python3";
            
            String scriptPath = "ml/train.py";
            if (!new java.io.File(scriptPath).exists()) {
                scriptPath = "EarthPulseAI/ml/train.py";
            }

            ProcessBuilder processBuilder = new ProcessBuilder(pythonCmd, scriptPath, 
                    String.valueOf(hour), String.valueOf(day), String.valueOf(severity),
                    String.valueOf(temp), String.valueOf(humidity), String.valueOf(actualAqi));
            processBuilder.start();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
