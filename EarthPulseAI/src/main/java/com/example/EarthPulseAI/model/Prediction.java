package com.example.EarthPulseAI.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "predictions")
public class Prediction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String location;
    private String state;
    private String district;
    private Double latitude;
    private Double longitude;
    
    private Integer aqiValue;
    
    @Enumerated(EnumType.STRING)
    private AQIRange aqiRange;
    
    @Column(columnDefinition = "JSON")
    private String pollutantLevels;
    
    private Double confidencePercentage;
    private LocalDateTime predictedFor;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @Enumerated(EnumType.STRING)
    private TrendDirection trend;

    public enum AQIRange {
        GOOD, MODERATE, POOR, SEVERE
    }
    
    public enum TrendDirection {
        INCREASING, DECREASING, STABLE
    }
    
    public Map<String, Double> getPollutantLevelsMap() {
        try {
            if (pollutantLevels == null) return new HashMap<>();
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(pollutantLevels, HashMap.class);
        } catch (Exception e) {
            return new HashMap<>();
        }
    }
    
    public void setPollutantLevelsMap(Map<String, Double> map) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            this.pollutantLevels = mapper.writeValueAsString(map);
        } catch (Exception e) {
            this.pollutantLevels = "{}";
        }
    }
}
