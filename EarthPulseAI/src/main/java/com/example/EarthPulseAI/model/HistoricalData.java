package com.example.EarthPulseAI.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "historical_data")
public class HistoricalData {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String location;
    private Double latitude;
    private Double longitude;
    
    private Integer avgAqi;
    private Double pm25;
    private Double pm10;
    private Double no2;
    
    private LocalDate recordDate;
    
    @Column(name = "data_year")
    private Integer year;
    
    @Column(name = "data_month")
    private Integer month;
}
