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
@Table(name = "remediable_measures")
public class RemediableMeasure {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
    
    @ManyToOne
    @JoinColumn(name = "report_id")
    private Report report;
    
    private String pollutionType;
    
    private String userActivity;
    
    @Column(columnDefinition = "TEXT")
    private String recommendedActions;
    
    @Column(columnDefinition = "TEXT")
    private String behavioralChanges;
    
    @Column(columnDefinition = "TEXT")
    private String immediateActions;
    
    private Integer impactScore;
    
    private LocalDateTime createdAt;
    private LocalDateTime validUntil;
    
    @Enumerated(EnumType.STRING)
    private Status status;
    
    private Integer userComplianceCount = 0;

    public enum Status {
        ACTIVE, REVIEWED, ARCHIVED
    }
}
