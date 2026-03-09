package com.example.EarthPulseAI.service;

import com.example.EarthPulseAI.model.RemediableMeasure;
import com.example.EarthPulseAI.model.Report;
import com.example.EarthPulseAI.repository.RemediableMeasureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RemediationService {
    private final RemediableMeasureRepository remediableMeasureRepository;
    private final MLService mlService;

    public RemediableMeasure generateRemediationForReport(Report report) {
        Map<String, Object> remediationData = mlService.getRemediationFromML(
            report.getPollutionType(), 
            report.getSeverity().name(),
            report.getDescription()
        );

        if (remediationData == null || remediationData.containsKey("error")) {
            return null;
        }

        RemediableMeasure measure = new RemediableMeasure();
        measure.setReport(report);
        measure.setUser(report.getUser());
        measure.setPollutionType(report.getPollutionType());
        
        measure.setRecommendedActions((String) remediationData.get("recommendedActions"));
        measure.setBehavioralChanges((String) remediationData.get("behavioralChanges"));
        measure.setImmediateActions((String) remediationData.get("immediateActions"));
        measure.setImpactScore((Integer) remediationData.get("impactScore"));
        
        measure.setCreatedAt(LocalDateTime.now());
        measure.setValidUntil(LocalDateTime.now().plusDays(7));
        measure.setStatus(RemediableMeasure.Status.ACTIVE);
        measure.setUserComplianceCount(0);

        return remediableMeasureRepository.save(measure);
    }
}
