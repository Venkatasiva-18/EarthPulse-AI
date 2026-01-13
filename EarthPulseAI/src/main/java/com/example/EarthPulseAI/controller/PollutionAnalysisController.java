package com.example.EarthPulseAI.controller;

import com.example.EarthPulseAI.model.*;
import com.example.EarthPulseAI.service.PollutionAnalysisService;
import com.example.EarthPulseAI.service.PredictionService;
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
            
            List<Map<String, Object>> locations = new ArrayList<>();
            Set<String> seenLocations = new HashSet<>();
            
            for (Prediction pred : predictions) {
                if (!seenLocations.contains(pred.getLocation())) {
                    seenLocations.add(pred.getLocation());
                    
                    Map<String, Object> location = new HashMap<>();
                    location.put("name", pred.getLocation());
                    location.put("latitude", pred.getLatitude());
                    location.put("longitude", pred.getLongitude());
                    location.put("aqiValue", pred.getAqiValue());
                    location.put("aqiRange", pred.getAqiRange());
                    location.put("confidence", pred.getConfidencePercentage());
                    location.put("pollutants", pred.getPollutantLevelsMap());
                    location.put("trend", pred.getTrend());
                    
                    locations.add(location);
                }
            }
            
            mapData.put("hotspots", locations);
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
            @RequestParam Double emission) {
        return ResponseEntity.ok(pollutionAnalysisService.analyzeIndustrialRisk(type, emission));
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getLocalSummary(
            @RequestParam Double lat,
            @RequestParam Double lon) {
        return ResponseEntity.ok(pollutionAnalysisService.getLocalSummary(lat, lon));
    }

    @GetMapping("/environmental-data")
    public ResponseEntity<Map<String, Object>> getEnvironmentalData(Authentication authentication) {
        User user = userService.getUserByUsername(authentication.getName());
        return ResponseEntity.ok(pollutionAnalysisService.getAllEnvironmentalData(user));
    }
}
