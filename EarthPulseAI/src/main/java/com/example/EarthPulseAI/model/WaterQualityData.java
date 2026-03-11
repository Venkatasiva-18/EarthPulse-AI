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
@Table(name = "water_quality_data")
public class WaterQualityData {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String address;
    private String state;
    private String district;
    private String mandal;
    private String village;
    private Double latitude;
    private Double longitude;
    
    // Potability parameters
    private Double ph;
    private Double hardness;
    private Double solids;
    private Double chloramines;
    private Double sulfate;
    private Double conductivity;
    private Double organicCarbon;
    private Double trihalomethanes;
    private Double turbidity;
    
    private Boolean potable;
    private Double potabilityScore;
    private String status;
    
    private LocalDateTime timestamp;
    
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}
