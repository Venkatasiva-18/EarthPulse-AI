package com.example.EarthPulseAI.service;

import com.example.EarthPulseAI.model.*;
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
    private final NotificationService notificationService;

    public User registerUser(User userDto) {
        if (userRepository.findByUsername(userDto.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.findByEmail(userDto.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }
        
        User user = new User();

        // Copy fields from DTO to entity
        user.setUsername(userDto.getUsername());
        user.setName(userDto.getName());
        user.setEmail(userDto.getEmail());
        user.setMobile(userDto.getMobile());
        user.setCountry(userDto.getCountry());
        user.setState(userDto.getState());
        user.setDistrict(userDto.getDistrict());
        user.setMandal(userDto.getMandal());
        user.setVillage(userDto.getVillage());
        user.setAddress(userDto.getAddress());
        user.setLatitude(userDto.getLatitude());
        user.setLongitude(userDto.getLongitude());
        user.setRole(userDto.getRole());
        user.setProfilePicture(userDto.getProfilePicture());
        
        if (user.getRole() == User.Role.AUTHORITY || user.getRole() == User.Role.MODERATOR || user.getRole() == User.Role.ADMINISTRATOR) {
            user.setDepartment(userDto.getDepartment() != null ? userDto.getDepartment() : "");
            user.setDesignation(userDto.getDesignation() != null ? userDto.getDesignation() : "officer");
        } else {
            user.setCredibilityScore(userDto.getCredibilityScore() != null ? userDto.getCredibilityScore() : 0);
        }
        
        // Ensure default values for numeric fields
        if (user.getLatitude() == null) {
            user.setLatitude(20.5937);
        }
        if (user.getLongitude() == null) {
            user.setLongitude(78.9629);
        }

        System.out.println("Saving user to DB: " + user.getUsername());
        user.setPassword(passwordEncoder.encode(userDto.getPassword()));
        try {
            User savedUser = userRepository.save(user);
            System.out.println("User saved successfully with ID: " + savedUser.getId());
            
            // Welcome notification
            notificationService.createNotification(savedUser, 
                "Welcome to EarthPulse AI, " + savedUser.getName() + "! We're glad to have you on board.", 
                "INFO");
                
            return savedUser;
        } catch (Exception e) {
            System.err.println("DB Save Error: " + e.getMessage());
            throw new RuntimeException("Error saving user: " + e.getMessage());
        }
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found with username: " + username));
    }

    public java.util.List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public java.util.List<User> getAllUsersVisibleTo(User currentUser) {
        if (currentUser.getRole() == User.Role.ADMINISTRATOR) {
            return userRepository.findAll();
        } else if (currentUser.getRole() == User.Role.MODERATOR) {
            // Moderators see Authority and Citizens of their respective state
            return userRepository.findByStateAndRoleIn(
                currentUser.getState(), 
                java.util.Arrays.asList(User.Role.AUTHORITY, User.Role.CITIZEN)
            );
        } else if (currentUser.getRole() == User.Role.AUTHORITY) {
            // Authorities see Citizens of their respective district
            return userRepository.findByDistrictAndRole(
                currentUser.getDistrict(), 
                User.Role.CITIZEN
            );
        }
        return new java.util.ArrayList<>();
    }

    public User updateUserRole(Long userId, User.Role role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        user.setRole(role);
        return userRepository.save(user);
    }

    public void deleteUser(Long userId) {
        userRepository.deleteById(userId);
    }

    public User updateOfficerDesignation(Long userId, String designation) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        
        if (user.getRole() != User.Role.AUTHORITY && user.getRole() != User.Role.MODERATOR && user.getRole() != User.Role.ADMINISTRATOR) {
            throw new RuntimeException("User is not an officer/authority");
        }
        
        user.setDesignation(designation != null && !designation.isEmpty() ? designation : "officer");
        return userRepository.save(user);
    }

    public User updateUserProfile(String username, User updateDto) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (updateDto.getName() != null) user.setName(updateDto.getName());
        if (updateDto.getMobile() != null) user.setMobile(updateDto.getMobile());
        if (updateDto.getAddress() != null) user.setAddress(updateDto.getAddress());
        if (updateDto.getVillage() != null) user.setVillage(updateDto.getVillage());
        if (updateDto.getMandal() != null) user.setMandal(updateDto.getMandal());
        if (updateDto.getDistrict() != null) user.setDistrict(updateDto.getDistrict());
        if (updateDto.getState() != null) user.setState(updateDto.getState());
        if (updateDto.getProfilePicture() != null) user.setProfilePicture(updateDto.getProfilePicture());
        
        if (updateDto.getPassword() != null && !updateDto.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(updateDto.getPassword()));
        }
        
        return userRepository.save(user);
    }
}
