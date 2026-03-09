package com.example.EarthPulseAI.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

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
    private String country;
    private String district;
    private String mandal;
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

    @ManyToMany
    @JoinTable(
        name = "report_upvotes",
        joinColumns = @JoinColumn(name = "report_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private Set<User> upvotedByUsers = new HashSet<>();

    public enum Severity {
        LOW, MEDIUM, HIGH
    }

    public enum ReportStatus {
        SUBMITTED, UNDER_REVIEW, ACTION_TAKEN, CLOSED
    }
}
