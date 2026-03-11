package com.example.EarthPulseAI.controller;

import com.example.EarthPulseAI.model.*;
import com.example.EarthPulseAI.service.PollutionAnalysisService;
import com.example.EarthPulseAI.service.PredictionService;
import com.example.EarthPulseAI.service.MLService;
import com.example.EarthPulseAI.service.UserService;
import com.example.EarthPulseAI.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/pollution")
@RequiredArgsConstructor
public class PollutionAnalysisController {
    
    private final PollutionAnalysisService pollutionAnalysisService;
    private final PredictionService predictionService;
    private final ReportService reportService;
    private final MLService mlService;
    private final UserService userService;

    @GetMapping("/hotspots")
    public ResponseEntity<Map<String, Object>> getPollutionHotspots(
            @RequestParam(defaultValue = "BOTH") String filterType) {
        List<Prediction> predictions = predictionService.getAllRecentPredictions();
        Map<String, Object> hotspots = pollutionAnalysisService.getPollutionHotspots(predictions, filterType);
        return ResponseEntity.ok(hotspots);
    }

    @GetMapping("/hotspots/location/{location}")
    public ResponseEntity<List<Prediction>> getLocationHotspot(@PathVariable String location) {
        List<Prediction> predictions = predictionService.getPredictionsByLocation(location);
        return ResponseEntity.ok(predictions);
    }

    @GetMapping("/hotspots/bbox")
    public ResponseEntity<List<Prediction>> getHotspotsByBoundingBox(
            @RequestParam Double minLat,
            @RequestParam Double maxLat,
            @RequestParam Double minLon,
            @RequestParam Double maxLon) {
        List<Prediction> predictions = predictionService.getPredictionsByBoundingBox(minLat, maxLat, minLon, maxLon);
        return ResponseEntity.ok(predictions);
    }

    @GetMapping("/trend/forecast/{location}")
    public ResponseEntity<String> getTrendForecast(@PathVariable String location) {
        List<Prediction> predictions = predictionService.getRecentPredictionsForLocation(location);
        String analysis = pollutionAnalysisService.generateTrendAnalysis(predictions);
        return ResponseEntity.ok(analysis);
    }

    @GetMapping("/critical-zones")
    public ResponseEntity<List<Prediction>> getCriticalPollutionZones(
            @RequestParam(defaultValue = "150") Integer threshold) {
        List<Prediction> criticalPredictions = predictionService.getCriticalPredictions(threshold);
        return ResponseEntity.ok(criticalPredictions);
    }

    @PostMapping("/recommendations/generate")
    public ResponseEntity<RemediableMeasure> generateRemediableMeasures(
            @RequestParam Long reportId,
            Authentication authentication) {
        try {
            Report report = reportService.getReportById(reportId);
            User user = userService.getUserByUsername(authentication.getName());
            
            RemediableMeasure measure = pollutionAnalysisService.generateRemediableMeasures(report, user);
            return ResponseEntity.ok(measure);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/recommendations/user")
    public ResponseEntity<List<RemediableMeasure>> getUserRecommendations(
            Authentication authentication) {
        try {
            User user = userService.getUserByUsername(authentication.getName());
            List<RemediableMeasure> recommendations = pollutionAnalysisService.getUserRecommendations(user);
            return ResponseEntity.ok(recommendations);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/map-data")
    public ResponseEntity<Map<String, Object>> getMapData(
            @RequestParam(defaultValue = "ALL") String pollutantType,
            @RequestParam(defaultValue = "7") Integer days) {
        try {
            List<Prediction> predictions = predictionService.getAllRecentPredictions();
            
            Map<String, Object> mapData = new HashMap<>();
            
            // Current Predictions (Hotspots)
            List<Map<String, Object>> hotspots = new ArrayList<>();
            Set<String> seenLocations = new HashSet<>();
            
            for (Prediction pred : predictions) {
                if (!seenLocations.contains(pred.getLocation())) {
                    seenLocations.add(pred.getLocation());
                    
                    Map<String, Object> hotspot = new HashMap<>();
                    hotspot.put("name", pred.getLocation());
                    hotspot.put("latitude", pred.getLatitude());
                    hotspot.put("longitude", pred.getLongitude());
                    hotspot.put("aqiValue", pred.getAqiValue());
                    hotspot.put("aqiRange", pred.getAqiRange());
                    hotspot.put("type", "AIR");
                    hotspot.put("color", getColorForAQI(pred.getAqiRange()));
                    
                    hotspots.add(hotspot);
                }
            }
            
            // Verified User Reports
            List<Report> verifiedReports = reportService.getVerifiedReports();
            List<Map<String, Object>> reports = new ArrayList<>();
            for (Report report : verifiedReports) {
                Map<String, Object> reportData = new HashMap<>();
                reportData.put("id", report.getId());
                reportData.put("type", report.getPollutionType());
                reportData.put("latitude", report.getLatitude());
                reportData.put("longitude", report.getLongitude());
                reportData.put("severity", report.getSeverity());
                reportData.put("description", report.getDescription());
                reportData.put("color", getColorForPollutionType(report.getPollutionType()));
                
                reports.add(reportData);
            }
            
            mapData.put("hotspots", hotspots);
            mapData.put("verifiedReports", reports);
            mapData.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.ok(mapData);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/pollutant-comparison/{location}")
    public ResponseEntity<Map<String, Object>> getPollutantComparison(
            @PathVariable String location) {
        try {
            List<Prediction> predictions = predictionService.getRecentPredictionsForLocation(location);
            
            Map<String, Object> comparison = new HashMap<>();
            Map<String, List<Double>> pollutantData = new HashMap<>();
            
            for (Prediction pred : predictions) {
                Map<String, Double> pollutants = pred.getPollutantLevelsMap();
                for (String pollutant : pollutants.keySet()) {
                    pollutantData.computeIfAbsent(pollutant, k -> new ArrayList<>())
                        .add(pollutants.get(pollutant));
                }
            }
            
            Map<String, Map<String, Double>> stats = new HashMap<>();
            for (String pollutant : pollutantData.keySet()) {
                List<Double> values = pollutantData.get(pollutant);
                double avg = values.stream().mapToDouble(Double::doubleValue).average().orElse(0);
                double min = values.stream().mapToDouble(Double::doubleValue).min().orElse(0);
                double max = values.stream().mapToDouble(Double::doubleValue).max().orElse(0);
                
                Map<String, Double> pollutantStats = new HashMap<>();
                pollutantStats.put("average", avg);
                pollutantStats.put("minimum", min);
                pollutantStats.put("maximum", max);
                
                stats.put(pollutant, pollutantStats);
            }
            
            comparison.put("location", location);
            comparison.put("pollutantStats", stats);
            comparison.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.ok(comparison);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/industrial/risk-analysis")
    public ResponseEntity<Map<String, Object>> analyzeIndustrialRisk(
            @RequestParam String type,
            @RequestParam Double emission,
            @RequestParam(defaultValue = "500") Double waterDist,
            @RequestParam(defaultValue = "2000") Double residentialDist,
            @RequestParam(defaultValue = "90") Double compliance) {
        return ResponseEntity.ok(pollutionAnalysisService.analyzeIndustrialRisk(type, emission, waterDist, residentialDist, compliance));
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getLocalSummary(
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lon,
            Authentication authentication) {
        
        if (lat == null || lon == null) {
            User user = userService.getUserByUsername(authentication.getName());
            lat = user.getLatitude();
            lon = user.getLongitude();
        }
        
        return ResponseEntity.ok(pollutionAnalysisService.getLocalSummary(lat, lon));
    }

    @GetMapping("/environmental-data")
    public ResponseEntity<Map<String, Object>> getEnvironmentalData(Authentication authentication) {
        User user = userService.getUserByUsername(authentication.getName());
        return ResponseEntity.ok(pollutionAnalysisService.getAllEnvironmentalData(user));
    }

    @PostMapping("/retrain")
    public ResponseEntity<Map<String, String>> retrainModels(Authentication authentication) {
        User user = userService.getUserByUsername(authentication.getName());
        if (user.getRole() != User.Role.ADMINISTRATOR && user.getRole() != User.Role.AUTHORITY) {
            return ResponseEntity.status(403).body(Map.of("message", "Only administrators can trigger retraining"));
        }
        
        boolean success = mlService.retrainModels();
        if (success) {
            return ResponseEntity.ok(Map.of("message", "Model retraining triggered successfully"));
        } else {
            return ResponseEntity.status(500).body(Map.of("message", "Model retraining failed"));
        }
    }

    private String getColorForAQI(Prediction.AQIRange range) {
        if (range == null) return "#808080"; // Gray
        switch (range) {
            case GOOD: return "#00E400"; // Green
            case MODERATE: return "#FFFF00"; // Yellow
            case POOR: return "#FF7E00"; // Orange
            case SEVERE: return "#FF0000"; // Red
            default: return "#808080";
        }
    }

    private String getColorForPollutionType(String type) {
        if (type == null) return "#808080";
        switch (type.toUpperCase()) {
            case "AIR": return "#00E400";
            case "WATER": return "#0000FF"; // Blue
            case "INDUSTRIAL": return "#A52A2A"; // Brown
            case "NOISE": return "#800080"; // Purple
            case "SOIL": return "#8B4513"; // Saddle Brown
            default: return "#FF0000"; // Default Red
        }
    }
}
