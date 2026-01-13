package com.example.EarthPulseAI.service;

import com.example.EarthPulseAI.model.WaterQualityData;
import com.example.EarthPulseAI.repository.WaterQualityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WaterQualityService {
    private final WaterQualityRepository waterQualityRepository;
    private final NotificationService notificationService;

    public WaterQualityData analyzeWaterQuality(WaterQualityData data) {
        double score = 100.0;
        
        // Simple logic based on WHO guidelines
        if (data.getPh() < 6.5 || data.getPh() > 8.5) score -= 15;
        if (data.getHardness() > 250) score -= 10;
        if (data.getSolids() > 1000) score -= 20;
        if (data.getChloramines() > 4) score -= 10;
        if (data.getSulfate() > 250) score -= 15;
        if (data.getTurbidity() > 5) score -= 10;
        
        data.setPotabilityScore(Math.max(0, score));
        data.setPotable(score > 60);
        data.setTimestamp(LocalDateTime.now());
        
        WaterQualityData saved = waterQualityRepository.save(data);

        // Notify user
        if (saved.getUser() != null) {
            String message = saved.getPotable() 
                ? "Water quality analysis complete. Your water is POTABLE (Score: " + saved.getPotabilityScore() + ")"
                : "ALERT: Water quality analysis complete. Your water is NOT POTABLE (Score: " + saved.getPotabilityScore() + ")";
            String type = saved.getPotable() ? "INFO" : "WARNING";
            notificationService.createNotification(saved.getUser(), message, type);
        }

        return saved;
    }

    public List<WaterQualityData> getLocationHistory(String district) {
        return waterQualityRepository.findByDistrict(district);
    }
}
