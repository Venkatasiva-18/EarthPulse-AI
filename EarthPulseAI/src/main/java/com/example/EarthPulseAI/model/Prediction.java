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
    
    @Enumerated(EnumType.STRING)
    private TrendDirection trend;
    
    private Double confidencePercentage;
    
    private LocalDateTime predictedFor;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @Column(columnDefinition = "JSON")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private String pollutantLevels;

    public enum AQIRange {
        GOOD, MODERATE, POOR, SEVERE
    }

    public enum TrendDirection {
        INCREASING, DECREASING, STABLE
    }
    
    @com.fasterxml.jackson.annotation.JsonProperty("pollutantLevels")
    public Map<String, Double> getPollutantLevelsMap() {
        try {
            if (pollutantLevels == null) return new java.util.HashMap<>();
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(pollutantLevels, java.util.HashMap.class);
        } catch (Exception e) {
            return new java.util.HashMap<>();
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
