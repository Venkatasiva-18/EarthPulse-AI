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
@Table(name = "reports")
public class Report {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String address;
    private String state;
    private String city;
    private String village;
    private Double latitude;
    private Double longitude;
    
    private LocalDateTime timestamp;
    
    private String pollutionType;
    
    @Enumerated(EnumType.STRING)
    private Severity severity;

    private String description;
    private String mediaUrl;

    private Integer upvotes = 0;
    private Double confidenceScore = 0.0;
    private Boolean verified = false;
    private Boolean anonymous = false;
    
    @Enumerated(EnumType.STRING)
    private ReportStatus status = ReportStatus.SUBMITTED;
    
    private String authorityRemarks;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    public enum Severity {
        LOW, MEDIUM, HIGH
    }

    public enum ReportStatus {
        SUBMITTED, UNDER_REVIEW, ACTION_TAKEN, CLOSED
    }
}
