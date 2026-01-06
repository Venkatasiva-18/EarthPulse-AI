package com.example.EarthPulseAI.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

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
    private Integer aqiValue;
    
    @Enumerated(EnumType.STRING)
    private AQIRange aqiRange;
    
    private Double confidencePercentage;
    private LocalDateTime predictedFor;

    public enum AQIRange {
        GOOD, MODERATE, POOR, SEVERE
    }
}
