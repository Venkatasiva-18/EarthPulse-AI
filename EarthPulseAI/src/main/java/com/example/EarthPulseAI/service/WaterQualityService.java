package com.example.EarthPulseAI.service;

import com.example.EarthPulseAI.model.WaterQualityData;
import com.example.EarthPulseAI.repository.WaterQualityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WaterQualityService {
    private final WaterQualityRepository waterQualityRepository;
    private final NotificationService notificationService;
    private final MLService mlService;

    public WaterQualityData analyzeWaterQuality(WaterQualityData data) {
        double ph = data.getPh() != null ? data.getPh() : 7.0;
        double hardness = data.getHardness() != null ? data.getHardness() : 150.0;
        double solids = data.getSolids() != null ? data.getSolids() : 500.0;
        double chloramines = data.getChloramines() != null ? data.getChloramines() : 2.0;
        double sulfate = data.getSulfate() != null ? data.getSulfate() : 100.0;
        double conductivity = data.getConductivity() != null ? data.getConductivity() : 400.0;
        double organicCarbon = data.getOrganicCarbon() != null ? data.getOrganicCarbon() : 10.0;
        double trihalomethanes = data.getTrihalomethanes() != null ? data.getTrihalomethanes() : 50.0;
        double turbidity = data.getTurbidity() != null ? data.getTurbidity() : 2.5;

        Map<String, Object> mlResult = mlService.getWaterAnalysisFromML(
            ph, hardness, solids, chloramines, sulfate, conductivity,
            organicCarbon, trihalomethanes, turbidity
        );

        if (mlResult != null && mlResult.get("potabilityScore") != null) {
            data.setPotabilityScore(((Number) mlResult.get("potabilityScore")).doubleValue());
        } else {
            // Fallback to strict scientific logic if ML fails
            double score = 100.0;
            boolean critical = false;
            
            if (ph < 6.0 || ph > 9.2) { score -= 40; critical = true; }
            else if (ph < 6.5 || ph > 8.5) { score -= 10; }
            
            if (hardness > 300) { score -= 30; critical = true; }
            else if (hardness > 200) { score -= 5; }
            
            if (solids > 1000) { score -= 40; critical = true; }
            else if (solids > 500) { score -= 10; }
            
            if (chloramines > 4) { score -= 40; critical = true; }
            else if (chloramines > 2) { score -= 5; }
            
            if (sulfate > 250) { score -= 40; critical = true; }
            else if (sulfate > 200) { score -= 5; }
            
            if (turbidity > 10) { score -= 40; critical = true; }
            else if (turbidity > 5) { score -= 10; }
            
            if (organicCarbon > 35) { score -= 40; critical = true; }
            else if (organicCarbon > 20) { score -= 10; }
            
            if (trihalomethanes > 200) { score -= 40; critical = true; }
            else if (trihalomethanes > 120) { score -= 10; }
            
            if (critical) {
                data.setPotabilityScore(Math.min(35.0, score));
            } else {
                data.setPotabilityScore(Math.max(0, score));
            }
        }

        // Apply Nuanced Status based on Score
        double score = data.getPotabilityScore();
        if (score >= 90) {
            data.setStatus("EXCELLENT");
            data.setPotable(true);
        } else if (score >= 75) {
            data.setStatus("GOOD");
            data.setPotable(true);
        } else if (score >= 60) {
            data.setStatus("ACCEPTABLE");
            data.setPotable(true); 
        } else if (score >= 40) {
            data.setStatus("POOR");
            data.setPotable(false);
        } else if (score >= 36) {
            data.setStatus("UNSAFE");
            data.setPotable(false);
        } else {
            data.setStatus("CRITICAL");
            data.setPotable(false);
        }
        
        data.setTimestamp(LocalDateTime.now());
        
        String statusLabel = data.getStatus();
        WaterQualityData saved;
        try {
            saved = waterQualityRepository.save(data);
        } catch (Exception e) {
            System.err.println("Error saving water quality data (potentially missing status column): " + e.getMessage());
            // Fallback: clear status and try again if it's a schema issue
            data.setStatus(null);
            saved = waterQualityRepository.save(data);
            // Re-set for response
            saved.setStatus(statusLabel);
        }

        // Notify user
        if (saved.getUser() != null) {
            String finalStatus = saved.getStatus() != null ? saved.getStatus() : statusLabel;
            String message = "Water quality analysis complete. Status: " + finalStatus + " (Score: " + saved.getPotabilityScore() + ")";
            if (finalStatus.equals("ACCEPTABLE")) {
                message += ". Safe but treatment (boiling/filtration) recommended.";
            } else if (finalStatus.equals("POOR") || finalStatus.equals("UNSAFE")) {
                message = "ALERT: " + message + ". Unsafe for direct consumption!";
            } else if (finalStatus.equals("CRITICAL")) {
                message = "CRITICAL HAZARD: " + message + ". Toxic or dangerous levels detected! Do not consume.";
            }
            
            String type = (score >= 75) ? "INFO" : (score >= 60) ? "INFO" : "WARNING";
            notificationService.createNotification(saved.getUser(), message, type);
        }

        return saved;
    }

    public List<WaterQualityData> getLocationHistory(String district) {
        return waterQualityRepository.findByDistrict(district);
    }
}
