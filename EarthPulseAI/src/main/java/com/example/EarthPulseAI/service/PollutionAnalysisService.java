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
        
        // Use a small bounding box (approx 10km radius)
        Double delta = 0.1; 
        Double minLat = lat - delta;
        Double maxLat = lat + delta;
        Double minLon = lon - delta;
        Double maxLon = lon + delta;
        
        // 1. Air Quality (Latest Prediction)
        List<Prediction> nearbyPredictions = predictionRepository.findByBoundingBox(minLat, maxLat, minLon, maxLon);
        if (!nearbyPredictions.isEmpty()) {
            nearbyPredictions.sort(Comparator.comparing(Prediction::getPredictedFor).reversed());
            summary.put("airQuality", nearbyPredictions.get(0));
        }
        
        // 2. Water Quality (Nearby samples)
        List<WaterQualityData> nearbyWater = waterQualityRepository.findByBoundingBox(minLat, maxLat, minLon, maxLon);
        if (!nearbyWater.isEmpty()) {
            nearbyWater.sort(Comparator.comparing(WaterQualityData::getTimestamp).reversed());
            summary.put("waterQuality", nearbyWater.get(0));
        }
        
        // 3. Industrial Activity/Risk (Nearby Reports)
        List<Report> nearbyReports = reportRepository.findByBoundingBox(minLat, maxLat, minLon, maxLon);
        long industrialReports = nearbyReports.stream()
                .filter(r -> "INDUSTRIAL".equalsIgnoreCase(r.getPollutionType()))
                .count();
        summary.put("industrialIncidentCount", industrialReports);
        
        // 4. Noise Pollution (Estimated based on reports and simulated traffic density)
        double noiseLevel = 40.0 + (industrialReports * 5); // Base 40dB + industrial impact
        summary.put("noiseLevel", Math.min(100, noiseLevel));
        summary.put("noiseStatus", noiseLevel > 70 ? "HIGH" : noiseLevel > 55 ? "MODERATE" : "LOW");

        // 5. Soil Quality (Estimated based on industrial presence and waste reports)
        double soilHealth = 90.0 - (industrialReports * 10);
        summary.put("soilHealthScore", Math.max(0, soilHealth));
        summary.put("soilStatus", soilHealth < 40 ? "CRITICAL" : soilHealth < 70 ? "POOR" : "GOOD");

        // 6. Overall Health Score (Enhanced)
        double healthScore = 100.0;
        if (summary.containsKey("airQuality")) {
            Prediction p = (Prediction) summary.get("airQuality");
            healthScore -= (p.getAqiValue() / 5.0);
        }
        if (summary.containsKey("waterQuality")) {
            WaterQualityData w = (WaterQualityData) summary.get("waterQuality");
            if (!w.getPotable()) healthScore -= 20;
        }
        healthScore -= (industrialReports * 5);
        healthScore -= (noiseLevel > 60 ? (noiseLevel - 60) / 2 : 0);
        healthScore -= (soilHealth < 80 ? (80 - soilHealth) / 2 : 0);
        
        summary.put("overallHealthScore", Math.max(0, healthScore));
        summary.put("locationName", "Your Area");
        summary.put("timestamp", LocalDateTime.now());
        
        return summary;
    }

    public RemediableMeasure generateRemediableMeasures(Report report, User user) {
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
        return remediableMeasureRepository.findByUserAndValidUntilAfter(user, now);
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
        Map<String, Object> hotspots = new LinkedHashMap<>();
        
        if ("LOCATION".equalsIgnoreCase(filterType)) {
            Map<String, List<Prediction>> byLocation = new HashMap<>();
            for (Prediction p : predictions) {
                byLocation.computeIfAbsent(p.getLocation(), k -> new ArrayList<>()).add(p);
            }
            hotspots.put("hotspots_by_location", byLocation);
        } else if ("POLLUTANT".equalsIgnoreCase(filterType)) {
            Map<String, List<Prediction>> byPollutant = new HashMap<>();
            for (Prediction p : predictions) {
                Map<String, Double> pollutants = p.getPollutantLevelsMap();
                for (String pollutant : pollutants.keySet()) {
                    byPollutant.computeIfAbsent(pollutant, k -> new ArrayList<>()).add(p);
                }
            }
            hotspots.put("hotspots_by_pollutant", byPollutant);
        } else {
            Map<String, List<Prediction>> byLocation = new HashMap<>();
            Map<String, List<Prediction>> byPollutant = new HashMap<>();
            
            for (Prediction p : predictions) {
                byLocation.computeIfAbsent(p.getLocation(), k -> new ArrayList<>()).add(p);
                Map<String, Double> pollutants = p.getPollutantLevelsMap();
                for (String pollutant : pollutants.keySet()) {
                    byPollutant.computeIfAbsent(pollutant, k -> new ArrayList<>()).add(p);
                }
            }
            
            hotspots.put("hotspots_by_location", byLocation);
            hotspots.put("hotspots_by_pollutant", byPollutant);
        }
        
        return hotspots;
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

    public Map<String, Object> analyzeIndustrialRisk(String factoryType, double emissionVolume) {
        Map<String, Object> risk = new HashMap<>();
        
        // Inspired by US EPA TRI Program
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
