package com.example.EarthPulseAI.service;

import com.example.EarthPulseAI.model.User;
import com.example.EarthPulseAI.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User registerUser(User user) {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }
        
        // Ensure default values for numeric fields
        if (user.getCredibilityScore() == null) {
            user.setCredibilityScore(0);
        }
        if (user.getLatitude() == null) {
            user.setLatitude(20.5937);
        }
        if (user.getLongitude() == null) {
            user.setLongitude(78.9629);
        }

        System.out.println("Saving user to DB: " + user.getUsername());
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        try {
            User savedUser = userRepository.save(user);
            System.out.println("User saved successfully with ID: " + savedUser.getId());
            return savedUser;
        } catch (Exception e) {
            System.err.println("DB Save Error: " + e.getMessage());
            throw new RuntimeException("Error saving user: " + e.getMessage());
        }
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }
}
