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
@Table(name = "notifications")
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String message;
    private String type; // e.g., "INFO", "WARNING", "CRITICAL"
    private LocalDateTime timestamp;
    private boolean readStatus = false;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}
