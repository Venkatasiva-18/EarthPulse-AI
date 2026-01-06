package com.example.EarthPulseAI.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    private String name;

    @Column(nullable = false)
    private String password;

    @Column(unique = true, nullable = false)
    private String email;

    private String mobile;

    private String country;
    private String state;
    private String district;
    private String mandal;
    private String village;
    private String address;

    @Column(nullable = false)
    private Double latitude;
    @Column(nullable = false)
    private Double longitude;

    @Column(nullable = false)
    private Integer credibilityScore = 0;

    @Enumerated(EnumType.STRING)
    private Role role;

    public enum Role {
        CITIZEN, MODERATOR, ADMINISTRATOR, AUTHORITY
    }
}
