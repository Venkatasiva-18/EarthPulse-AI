package com.example.EarthPulseAI.service;

import com.example.EarthPulseAI.model.Prediction;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.util.Map;

import java.util.HashMap;

@Service
@RequiredArgsConstructor
public class MLService {
    private final PredictionService predictionService;
    private final ObjectMapper mapper = new ObjectMapper();

    private String getPythonCommand() {
        return System.getProperty("os.name").toLowerCase().contains("win") ? "py" : "python3";
    }

    private String getScriptPath(String scriptName) {
        String path = "ml/" + scriptName;
        if (!new java.io.File(path).exists()) {
            path = "EarthPulseAI/ml/" + scriptName;
        }
        return path;
    }

    public Prediction getPredictionFromML(String location, int hour, int day, int severity, double temp, double humidity, boolean detailed, Double lat, Double lon) {
        try {
            String scriptPath = getScriptPath("predict.py");
            
            ProcessBuilder processBuilder = new ProcessBuilder(getPythonCommand(), scriptPath, 
                    String.valueOf(hour), String.valueOf(day), String.valueOf(severity),
                    String.valueOf(temp), String.valueOf(humidity),
                    detailed ? "detailed" : "basic");
            
            String output = executeProcess(processBuilder);
            if (output == null) return null;
            
            Map<String, Object> resultMap = mapper.readValue(output, Map.class);
            if (resultMap.containsKey("error")) return null;

            Prediction prediction = new Prediction();
            prediction.setLocation(location);
            prediction.setLatitude(lat);
            prediction.setLongitude(lon);
            
            prediction.setAqiValue(((Number) resultMap.getOrDefault("aqiValue", 0)).intValue());
            prediction.setAqiRange(Prediction.AQIRange.valueOf((String) resultMap.getOrDefault("aqiRange", "MODERATE")));
            prediction.setConfidencePercentage(((Number) resultMap.getOrDefault("confidencePercentage", 0.0)).doubleValue());
            
            if (resultMap.containsKey("pollutantLevels")) {
                prediction.setPollutantLevelsMap((Map<String, Double>) resultMap.get("pollutantLevels"));
            }
            
            prediction.setPredictedFor(LocalDateTime.now());
            prediction.setTrend(Prediction.TrendDirection.STABLE);

            return predictionService.savePrediction(prediction);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public Map<String, Object> getWaterAnalysisFromML(double ph, double hardness, double solids, double chloramines, 
                                                    double sulfate, double conductivity, double organicCarbon, 
                                                    double trihalomethanes, double turbidity) {
        try {
            String scriptPath = getScriptPath("water_quality.py");
            ProcessBuilder pb = new ProcessBuilder(getPythonCommand(), scriptPath,
                String.valueOf(ph), String.valueOf(hardness), String.valueOf(solids),
                String.valueOf(chloramines), String.valueOf(sulfate), String.valueOf(conductivity),
                String.valueOf(organicCarbon), String.valueOf(trihalomethanes), String.valueOf(turbidity));
            
            String output = executeProcess(pb);
            if (output == null) return null;
            return mapper.readValue(output, Map.class);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public Map<String, Object> getIndustrialRiskFromML(String factoryType, double emissionVolume, 
                                                     double waterDist, double residentialDist, double compliance) {
        try {
            String scriptPath = getScriptPath("industrial_risk.py");
            ProcessBuilder pb = new ProcessBuilder(getPythonCommand(), scriptPath,
                factoryType, String.valueOf(emissionVolume), String.valueOf(waterDist), 
                String.valueOf(residentialDist), String.valueOf(compliance));
            
            String output = executeProcess(pb);
            if (output == null) return null;
            return mapper.readValue(output, Map.class);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    private String executeProcess(ProcessBuilder pb) throws Exception {
        pb.redirectErrorStream(false);
        Process process = pb.start();

        BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
        String line;
        String output = null;
        while ((line = reader.readLine()) != null) {
            if (line.trim().startsWith("{")) {
                output = line;
            }
        }
        process.waitFor();
        return output;
    }

    public void provideFeedback(int hour, int day, int severity, double temp, double humidity, int actualAqi) {
        try {
            String scriptPath = getScriptPath("train.py");
            ProcessBuilder processBuilder = new ProcessBuilder(getPythonCommand(), scriptPath, 
                    String.valueOf(hour), String.valueOf(day), String.valueOf(severity),
                    String.valueOf(temp), String.valueOf(humidity), String.valueOf(actualAqi));
            processBuilder.start();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
