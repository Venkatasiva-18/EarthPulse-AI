package com.example.EarthPulseAI.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@Table(name = "guest_upvotes", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"report_id", "ip_address"})
})
public class GuestUpvote {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "report_id")
    private Report report;

    private String ipAddress;
    
    private LocalDateTime timestamp;

    public GuestUpvote(Report report, String ipAddress) {
        this.report = report;
        this.ipAddress = ipAddress;
        this.timestamp = LocalDateTime.now();
    }
}
