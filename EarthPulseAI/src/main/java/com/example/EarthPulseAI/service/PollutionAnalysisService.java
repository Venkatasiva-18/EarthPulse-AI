package com.example.EarthPulseAI.service;

import com.example.EarthPulseAI.model.*;
import com.example.EarthPulseAI.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.*;

@Service
public class PollutionAnalysisService {

    @Autowired
    private RemediableMeasureRepository remediableMeasureRepository;
    
    @Autowired
    private WaterQualityRepository waterQualityRepository;
    
    @Autowired
    private ReportRepository reportRepository;
    
    @Autowired
    private PredictionRepository predictionRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private MLService mlService;

    @Autowired
    private RemediationService remediationService;

    private static final Map<String, String> POLLUTION_TYPE_RECOMMENDATIONS = Map.ofEntries(
        Map.entry("TRAFFIC", "Reduce vehicle usage - use public transportation, carpool, or cycle"),
        Map.entry("INDUSTRIAL", "Support emission reduction regulations and clean energy adoption"),
        Map.entry("CONSTRUCTION", "Avoid construction areas during peak hours and dust storms"),
        Map.entry("AGRICULTURAL", "Support sustainable farming practices and reduce biomass burning"),
        Map.entry("DUST", "Wear N95/N99 masks and limit outdoor activities"),
        Map.entry("SMOKE", "Use air purifiers indoors and avoid outdoor activities"),
        Map.entry("WATER", "Use certified water filters; report illegal discharge into water bodies"),
        Map.entry("SOIL", "Avoid chemical fertilizers; support organic farming and reforestation"),
        Map.entry("NOISE", "Install sound insulation; use ear protection in high-decibel areas"),
        Map.entry("WASTE", "Implement 3Rs (Reduce, Reuse, Recycle); support waste segregation at source")
    );

    private static final Map<String, String> BEHAVIORAL_CHANGES = Map.ofEntries(
        Map.entry("TRAFFIC", "Walk or use bike for short distances; schedule driving outside peak pollution hours"),
        Map.entry("INDUSTRIAL", "Support clean energy initiatives; demand factory emissions accountability"),
        Map.entry("CONSTRUCTION", "Advocate for dust suppression measures and water spraying on sites"),
        Map.entry("AGRICULTURAL", "Promote crop residue management and controlled burning periods"),
        Map.entry("DUST", "Use HEPA filters; keep windows closed during dust storms"),
        Map.entry("SMOKE", "Use indoor air purifiers; apply weatherstripping to windows"),
        Map.entry("WATER", "Reduce plastic use; avoid pouring chemicals down the drain"),
        Map.entry("SOIL", "Practice composting; minimize pesticide use in home gardens"),
        Map.entry("NOISE", "Schedule noisy activities during day hours; support quiet zones"),
        Map.entry("WASTE", "Carry reusable bags; participate in local clean-up drives")
    );

    private static final Map<String, String> IMMEDIATE_ACTIONS = Map.ofEntries(
        Map.entry("TRAFFIC", "Stay indoors; use masks if outdoors; use vehicle air filters"),
        Map.entry("INDUSTRIAL", "Minimize outdoor exposure; increase indoor air filtration"),
        Map.entry("CONSTRUCTION", "Avoid construction zones; wear respiratory protection"),
        Map.entry("AGRICULTURAL", "Close windows; use air purifiers; limit outdoor activities"),
        Map.entry("DUST", "Wear masks; seal windows; use HEPA vacuum cleaners"),
        Map.entry("SMOKE", "Use N95 masks; stay indoors; use air purifiers"),
        Map.entry("WATER", "Boil water before use; avoid contact with contaminated water"),
        Map.entry("SOIL", "Wash hands thoroughly after soil contact; avoid consuming unwashed produce"),
        Map.entry("NOISE", "Use noise-cancelling headphones; move to a quieter area"),
        Map.entry("WASTE", "Secure garbage bins; report illegal dumping; clean up immediate surroundings")
    );

    public Map<String, Object> getLocalSummary(Double lat, Double lon) {
        Map<String, Object> summary = new HashMap<>();
        
        // Use a smaller bounding box for immediate surroundings (approx 5km radius)
        Double delta = 0.05; 
        Double minLat = lat - delta;
        Double maxLat = lat + delta;
        Double minLon = lon - delta;
        Double maxLon = lon + delta;
        
        // 1. Air Quality (Latest Prediction)
        List<Prediction> nearbyPredictions = predictionRepository.findByBoundingBox(minLat, maxLat, minLon, maxLon);
        String surroundingsStatus = "IMMEDIATE";

        if (nearbyPredictions.isEmpty()) {
            // Fallback to wider surroundings (approx 20km)
            Double deltaWide = 0.2;
            nearbyPredictions = predictionRepository.findByBoundingBox(lat - deltaWide, lat + deltaWide, lon - deltaWide, lon + deltaWide);
            surroundingsStatus = nearbyPredictions.isEmpty() ? "NONE" : "WIDER_AREA";
        }

        if (!nearbyPredictions.isEmpty()) {
            nearbyPredictions.sort(Comparator.comparing(Prediction::getPredictedFor).reversed());
            summary.put("airQuality", nearbyPredictions.get(0));
        } else {
            // ML Fallback for Air Quality
            LocalDateTime now = LocalDateTime.now();
            Prediction virtualPred = mlService.getPredictionFromML(
                "Estimated Status", 
                now.getHour(), 
                now.getDayOfWeek().getValue(), 
                1, 28.0, 55.0, false, lat, lon
            );
            if (virtualPred != null) {
                summary.put("airQuality", virtualPred);
            }
        }
        
        // 2. Water Quality (Nearby samples)
        List<WaterQualityData> nearbyWater = waterQualityRepository.findByBoundingBox(minLat, maxLat, minLon, maxLon);
        if (nearbyWater.isEmpty()) {
            Double deltaWide = 0.2;
            nearbyWater = waterQualityRepository.findByBoundingBox(lat - deltaWide, lat + deltaWide, lon - deltaWide, lon + deltaWide);
        }
        
        if (!nearbyWater.isEmpty()) {
            nearbyWater.sort(Comparator.comparing(WaterQualityData::getTimestamp).reversed());
            summary.put("waterQuality", nearbyWater.get(0));
        } else {
            // ML Fallback for Water Quality (Standard parameters)
            Map<String, Object> waterAnalysis = mlService.getWaterAnalysisFromML(7.2, 150, 15000, 7.5, 250, 400, 12, 60, 2.5);
            if (waterAnalysis != null) {
                summary.put("estimatedWaterStatus", waterAnalysis);
            }
        }
        
        // 3. Industrial Activity/Risk (Nearby Reports)
        List<Report> nearbyReports = reportRepository.findByBoundingBox(minLat, maxLat, minLon, maxLon);
        if (nearbyReports.isEmpty()) {
            Double deltaWide = 0.2;
            nearbyReports = reportRepository.findByBoundingBox(lat - deltaWide, lat + deltaWide, lon - deltaWide, lon + deltaWide);
        }
        
        Map<String, Long> incidentCounts = new HashMap<>();
        for (String type : Arrays.asList("INDUSTRIAL", "NOISE", "TRAFFIC", "CONSTRUCTION", "SOIL", "WASTE", "AGRICULTURAL")) {
            long count = nearbyReports.stream()
                .filter(r -> type.equalsIgnoreCase(r.getPollutionType()))
                .count();
            incidentCounts.put(type, count);
        }
        summary.put("incidentCounts", incidentCounts);
        
        // Calculate weighted incident impact
        double incidentImpact = nearbyReports.stream()
            .mapToDouble(r -> {
                if (r.getSeverity() == null) return 5.0;
                return switch (r.getSeverity()) {
                    case LOW -> 2.0;
                    case MEDIUM -> 5.0;
                    case HIGH -> 10.0;
                };
            })
            .sum();

        // 4. Noise Pollution (Estimated based on reports)
        double noiseLevel = 40.0 + (incidentCounts.get("INDUSTRIAL") * 5) + (incidentCounts.get("NOISE") * 8) 
                            + (incidentCounts.get("TRAFFIC") * 4) + (incidentCounts.get("CONSTRUCTION") * 6);
        summary.put("noiseLevel", Math.min(100, noiseLevel));
        summary.put("noiseStatus", noiseLevel > 70 ? "HIGH" : noiseLevel > 55 ? "MODERATE" : "LOW");

        // 5. Soil Quality
        double soilHealth = 95.0 - (incidentCounts.get("INDUSTRIAL") * 7) - (incidentCounts.get("SOIL") * 10) 
                            - (incidentCounts.get("WASTE") * 5) - (incidentCounts.get("AGRICULTURAL") * 2);
        summary.put("soilHealthScore", Math.max(0, soilHealth));
        summary.put("soilStatus", soilHealth < 40 ? "CRITICAL" : soilHealth < 75 ? "POOR" : "GOOD");

        // 6. Overall Health Score (Aggregated)
        double healthScore = 100.0;
        
        // Air Quality factor (0-40 points)
        if (summary.containsKey("airQuality")) {
            Prediction p = (Prediction) summary.get("airQuality");
            healthScore -= Math.min(40, (p.getAqiValue() / 7.5));
        } else {
            healthScore -= 5;
        }
        
        // Water Quality factor (0-25 points)
        if (summary.containsKey("waterQuality")) {
            WaterQualityData w = (WaterQualityData) summary.get("waterQuality");
            if (!w.getPotable()) healthScore -= 20;
            else healthScore += 5; // Clean water bonus
        }
        
        // Other factors
        healthScore -= Math.min(20, incidentImpact / 2.0);
        healthScore -= (noiseLevel > 60 ? Math.min(10, (noiseLevel - 60) / 2.0) : 0);
        healthScore -= (soilHealth < 80 ? Math.min(10, (80 - soilHealth) / 2.0) : 0);
        
        // 7. Industrial Risk Analysis (if incidents are high)
        if (incidentCounts.get("INDUSTRIAL") > 0) {
            summary.put("industrialRiskAnalysis", analyzeIndustrialRisk("GENERAL", 
                (double)incidentCounts.get("INDUSTRIAL") * 20.0, 
                500.0, 1000.0, 85.0));
        }
        
        double finalScore = Math.max(0, Math.min(100, healthScore));
        summary.put("overallHealthScore", finalScore);
        summary.put("statusDescription", getStatusDescription(finalScore));
        
        // Detailed health score breakdown
        Map<String, String> healthFactors = new LinkedHashMap<>();
        healthFactors.put("Air Quality", summary.containsKey("airQuality") ? "Analyzed" : "Estimated");
        healthFactors.put("Water Safety", (summary.containsKey("waterQuality") || summary.containsKey("estimatedWaterStatus")) ? "Analyzed" : "Low confidence");
        healthFactors.put("Industrial Presence", incidentCounts.get("INDUSTRIAL") > 2 ? "High Risk" : incidentCounts.get("INDUSTRIAL") > 0 ? "Moderate" : "Low");
        healthFactors.put("Noise Levels", (double)summary.get("noiseLevel") > 75 ? "Disturbing" : "Acceptable");
        summary.put("healthFactors", healthFactors);
        
        // Recommended immediate actions
        List<String> remediations = new ArrayList<>();
        if (finalScore < 85) {
            if (summary.containsKey("airQuality") && ((Prediction)summary.get("airQuality")).getAqiValue() > 100) {
                remediations.add("Wear protective masks (N95/N99) when outdoors.");
            }
            if (summary.containsKey("waterQuality") && !((WaterQualityData)summary.get("waterQuality")).getPotable()) {
                remediations.add("Use water purifiers or boil water before consumption.");
            }
            if (incidentCounts.get("INDUSTRIAL") > 0) {
                remediations.add("Minimize exposure to industrial zones.");
            }
            if ((double)summary.get("noiseLevel") > 65) {
                remediations.add("Use ear protection in high-noise environments.");
            }
            if (incidentCounts.get("WASTE") > 0 || incidentCounts.get("SOIL") > 0) {
                remediations.add("Report illegal waste dumping to local authorities.");
            }
        }
        if (remediations.isEmpty()) {
            remediations.add("Continue current sustainable environmental practices.");
        }
        summary.put("remediations", remediations);
        
        summary.put("locationName", "Your Area");
        summary.put("surroundingsPrecision", surroundingsStatus);
        summary.put("timestamp", LocalDateTime.now());
        
        return summary;
    }

    private String getStatusDescription(double score) {
        if (score >= 85) return "Pristine: Your area has excellent environmental conditions.";
        if (score >= 70) return "Good: Generally safe environmental conditions with minor issues.";
        if (score >= 55) return "Fair: Some pollution detected. Moderate precautions advised.";
        if (score >= 40) return "Poor: Significant environmental concerns. Limit outdoor exposure.";
        return "Critical: Severe environmental degradation. Take immediate precautions.";
    }

    public RemediableMeasure generateRemediableMeasures(Report report, User user) {
        // Try to generate using ML-based RemediationService first
        try {
            RemediableMeasure mlMeasure = remediationService.generateRemediationForReport(report);
            if (mlMeasure != null) {
                // Notify user
                if (user != null) {
                    notificationService.createNotification(user, 
                        "New AI-generated remediable measures available for your " + report.getPollutionType() + " report.", 
                        "INFO");
                }
                return mlMeasure;
            }
        } catch (Exception e) {
            System.err.println("ML Remediation failed, falling back to rule-based: " + e.getMessage());
        }

        // Fallback to original rule-based logic
        RemediableMeasure measure = new RemediableMeasure();
        measure.setUser(user);
        measure.setReport(report);
        
        String pollutionType = normalizePollutionType(report.getPollutionType());
        measure.setPollutionType(pollutionType);
        measure.setUserActivity(extractActivity(report));
        
        measure.setRecommendedActions(POLLUTION_TYPE_RECOMMENDATIONS.getOrDefault(pollutionType, getDefaultRecommendation(pollutionType)));
        measure.setBehavioralChanges(BEHAVIORAL_CHANGES.getOrDefault(pollutionType, getDefaultBehavioralChange(pollutionType)));
        measure.setImmediateActions(IMMEDIATE_ACTIONS.getOrDefault(pollutionType, "Follow air quality alerts; wear masks; minimize outdoor exposure"));
        
        measure.setImpactScore(calculateImpactScore(report.getSeverity(), pollutionType));
        measure.setCreatedAt(LocalDateTime.now());
        measure.setValidUntil(LocalDateTime.now().plusDays(30));
        measure.setStatus(RemediableMeasure.Status.ACTIVE);
        measure.setUserComplianceCount(0);
        
        RemediableMeasure saved = remediableMeasureRepository.save(measure);

        // Notify user
        if (user != null) {
            notificationService.createNotification(user, 
                "New AI-generated remediable measures available for your " + report.getPollutionType() + " report.", 
                "INFO");
        }

        return saved;
    }

    public List<RemediableMeasure> getUserRecommendations(User user) {
        LocalDateTime now = LocalDateTime.now();
        return remediableMeasureRepository.findByUserAndValidUntilAfterOrderByCreatedAtDescIdDesc(user, now);
    }

    public String generateTrendAnalysis(List<Prediction> predictions) {
        if (predictions.isEmpty()) {
            return "Insufficient data for trend analysis";
        }

        predictions.sort(Comparator.comparing(Prediction::getPredictedFor));
        
        double avgAQI = predictions.stream()
            .mapToInt(Prediction::getAqiValue)
            .average()
            .orElse(0);
        
        int minAQI = predictions.stream()
            .mapToInt(Prediction::getAqiValue)
            .min()
            .orElse(0);
        
        int maxAQI = predictions.stream()
            .mapToInt(Prediction::getAqiValue)
            .max()
            .orElse(0);
        
        Prediction.TrendDirection trend = determineTrend(predictions);
        
        StringBuilder analysis = new StringBuilder();
        analysis.append(String.format("Average AQI: %.1f | Min: %d | Max: %d | Trend: %s\n", avgAQI, minAQI, maxAQI, trend));
        
        if (trend == Prediction.TrendDirection.INCREASING) {
            analysis.append("⚠️ WARNING: Pollution levels are INCREASING. Take preventive measures.");
        } else if (trend == Prediction.TrendDirection.DECREASING) {
            analysis.append("✓ GOOD: Pollution levels are DECREASING. Continue current practices.");
        } else {
            analysis.append("→ STABLE: Pollution levels remain stable. Maintain current mitigation efforts.");
        }
        
        return analysis.toString();
    }

    public Map<String, Object> getPollutionHotspots(List<Prediction> predictions, String filterType) {
        Map<String, Object> result = new LinkedHashMap<>();
        List<Map<String, Object>> hotspots = new ArrayList<>();
        Set<String> seenLocations = new HashSet<>();
        
        for (Prediction pred : predictions) {
            // Basic filtering logic: in a real app this might be more complex
            // based on LOCATION or POLLUTANT specific criteria
            if (!seenLocations.contains(pred.getLocation())) {
                boolean include = true;
                if ("LOCATION".equalsIgnoreCase(filterType)) {
                    // Only show hotspots with significant AQI (> 100)
                    include = pred.getAqiValue() > 100;
                } else if ("POLLUTANT".equalsIgnoreCase(filterType)) {
                    // Only show hotspots where specific pollutant data is dominant or interesting
                    // For example, if CO or NO2 levels are specifically high
                    Map<String, Double> pollutants = pred.getPollutantLevelsMap();
                    include = pollutants != null && pollutants.size() > 0 && 
                             pollutants.values().stream().anyMatch(v -> v > 50);
                }
                
                if (include) {
                    seenLocations.add(pred.getLocation());
                    
                    Map<String, Object> hotspot = new HashMap<>();
                    hotspot.put("name", pred.getLocation());
                    hotspot.put("latitude", pred.getLatitude());
                    hotspot.put("longitude", pred.getLongitude());
                    hotspot.put("aqiValue", pred.getAqiValue());
                    hotspot.put("aqiRange", pred.getAqiRange());
                    hotspot.put("trend", pred.getTrend());
                    hotspot.put("confidence", pred.getConfidencePercentage());
                    hotspot.put("pollutants", pred.getPollutantLevelsMap());
                    
                    hotspots.add(hotspot);
                }
            }
        }
        
        result.put("hotspots", hotspots);
        return result;
    }

    private Prediction.TrendDirection determineTrend(List<Prediction> predictions) {
        if (predictions.size() < 2) return Prediction.TrendDirection.STABLE;
        
        int firstHalf = 0, secondHalf = 0;
        int mid = predictions.size() / 2;
        
        for (int i = 0; i < mid; i++) {
            firstHalf += predictions.get(i).getAqiValue();
        }
        for (int i = mid; i < predictions.size(); i++) {
            secondHalf += predictions.get(i).getAqiValue();
        }
        
        double firstAvg = (double) firstHalf / mid;
        double secondAvg = (double) secondHalf / (predictions.size() - mid);
        
        double change = ((secondAvg - firstAvg) / firstAvg) * 100;
        
        if (change > 5) return Prediction.TrendDirection.INCREASING;
        else if (change < -5) return Prediction.TrendDirection.DECREASING;
        else return Prediction.TrendDirection.STABLE;
    }

    public Map<String, Object> analyzeIndustrialRisk(String factoryType, double emissionVolume, 
                                                     double waterDist, double residentialDist, double compliance) {
        Map<String, Object> mlRisk = mlService.getIndustrialRiskFromML(factoryType, emissionVolume, waterDist, residentialDist, compliance);
        if (mlRisk != null) {
            return mlRisk;
        }

        // Fallback logic
        Map<String, Object> risk = new HashMap<>();
        
        double hazardFactor = switch (factoryType.toUpperCase()) {
            case "CHEMICAL" -> 2.5;
            case "METAL" -> 2.0;
            case "PETROLEUM" -> 2.2;
            case "PHARMACEUTICAL" -> 1.5;
            default -> 1.0;
        };
        
        double riskScore = (emissionVolume * hazardFactor) / 10.0;
        risk.put("riskLevel", riskScore > 75 ? "EXTREME" : riskScore > 50 ? "HIGH" : riskScore > 25 ? "MODERATE" : "LOW");
        risk.put("riskScore", Math.min(100, riskScore));
        risk.put("toxicReleaseIntensity", emissionVolume * 0.8);
        risk.put("mitigationPriority", riskScore > 50 ? "IMMEDIATE" : "ROUTINE");
        
        return risk;
    }

    public Map<String, Object> getAllEnvironmentalData(User currentUser) {
        Map<String, Object> data = new HashMap<>();
        
        if (currentUser.getRole() == User.Role.ADMINISTRATOR) {
            data.put("waterSamples", waterQualityRepository.findAll());
            data.put("predictions", predictionRepository.findAll());
        } else if (currentUser.getRole() == User.Role.MODERATOR) {
            data.put("waterSamples", waterQualityRepository.findByState(currentUser.getState()));
            data.put("predictions", predictionRepository.findByState(currentUser.getState()));
        } else if (currentUser.getRole() == User.Role.AUTHORITY) {
            data.put("waterSamples", waterQualityRepository.findByDistrict(currentUser.getDistrict()));
            data.put("predictions", predictionRepository.findByDistrict(currentUser.getDistrict()));
        } else {
            data.put("waterSamples", new ArrayList<>());
            data.put("predictions", new ArrayList<>());
        }
        
        return data;
    }

    private int calculateImpactScore(Report.Severity severity, String pollutionType) {
        int baseScore = switch (severity) {
            case LOW -> 20;
            case MEDIUM -> 50;
            case HIGH -> 80;
        };
        
        int typeMultiplier = switch (pollutionType) {
            case "TRAFFIC" -> 1;
            case "INDUSTRIAL" -> 3;
            case "CONSTRUCTION" -> 1;
            case "AGRICULTURAL" -> 2;
            case "DUST" -> 1;
            case "SMOKE" -> 2;
            case "WATER" -> 3;
            case "SOIL" -> 2;
            case "NOISE" -> 1;
            case "WASTE" -> 2;
            default -> 1;
        };
        
        return baseScore * typeMultiplier;
    }

    private String extractActivity(Report report) {
        String description = report.getDescription();
        if (description == null || description.isEmpty()) {
            return "Pollution Detection";
        }
        return description.substring(0, Math.min(50, description.length()));
    }

    private String normalizePollutionType(String type) {
        if (type == null) return "GENERAL";
        return type.toUpperCase().trim();
    }

    private String getDefaultRecommendation(String type) {
        return String.format("Address %s pollution: Reduce emissions, use protective equipment, and support regulatory compliance.", type.toLowerCase());
    }

    private String getDefaultBehavioralChange(String type) {
        return String.format("Minimize exposure to %s sources; support community awareness and clean practices.", type.toLowerCase());
    }
}
