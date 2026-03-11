package com.example.EarthPulseAI.service;

import com.example.EarthPulseAI.model.*;
import com.example.EarthPulseAI.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;
    private final EmailService emailService;
    
    private static final java.util.Map<String, User> pendingRegistrations = new java.util.concurrent.ConcurrentHashMap<>();

    public User registerUser(User userDto) {
        if (userDto.getEmail() == null) throw new RuntimeException("Email is required");
        // Aggressive trimming and lowercase for consistency
        String trimmedEmail = userDto.getEmail().trim().replaceAll("[\\p{Z}\\s]", "").toLowerCase();
        
        if (userRepository.findByUsername(userDto.getUsername().trim()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.findByEmailIgnoreCase(trimmedEmail).isPresent()) {
            throw new RuntimeException("Email already exists in our records. Please login.");
        }
        
        User user = new User();
        user.setUsername(userDto.getUsername().trim());
        user.setName(userDto.getName());
        user.setEmail(trimmedEmail);
        user.setMobile(userDto.getMobile());
        user.setCountry(userDto.getCountry());
        user.setState(userDto.getState());
        user.setDistrict(userDto.getDistrict());
        user.setMandal(userDto.getMandal());
        user.setVillage(userDto.getVillage());
        user.setAddress(userDto.getAddress());
        user.setLatitude(userDto.getLatitude() != null ? userDto.getLatitude() : 20.5937);
        user.setLongitude(userDto.getLongitude() != null ? userDto.getLongitude() : 78.9629);
        user.setRole(userDto.getRole());
        user.setProfilePicture(userDto.getProfilePicture());
        user.setPassword(passwordEncoder.encode(userDto.getPassword()));
        
        if (user.getRole() == User.Role.AUTHORITY || user.getRole() == User.Role.MODERATOR || user.getRole() == User.Role.ADMINISTRATOR) {
            user.setDepartment(userDto.getDepartment() != null ? userDto.getDepartment() : "");
            user.setDesignation(userDto.getDesignation() != null ? userDto.getDesignation() : "officer");
        } else {
            user.setCredibilityScore(0);
        }

        // Special handling for admin user as requested: always verified
        if ("admin".equals(user.getUsername())) {
            user.setVerified(true);
            user.setOtp(null);
            user.setEmail("admin@earthpulseai.com");
            return userRepository.save(user);
        }

        try {
            // Generate 6-digit numeric OTP
            String otp = String.format("%06d", new java.util.Random().nextInt(1000000));
            user.setOtp(otp);
            user.setVerified(false);
            
            // Store in memory map instead of DB to ensure registration completes AFTER verification
            pendingRegistrations.put(trimmedEmail, user);
            System.out.println("DEBUG: User stored in pending registrations for: " + trimmedEmail);
            
            try {
                emailService.sendOtp(trimmedEmail, otp);
                System.out.println("DEBUG: Registration OTP sent successfully to: " + trimmedEmail);
            } catch (Exception mailEx) {
                pendingRegistrations.remove(trimmedEmail);
                System.err.println("DEBUG: Failed to send registration email: " + mailEx.getMessage());
                throw new RuntimeException("FAILED_TO_SEND_EMAIL: " + mailEx.getMessage());
            }
            
            return user;
        } catch (RuntimeException re) {
            throw re;
        } catch (Exception e) {
            System.err.println("Registration Error: " + e.getMessage());
            throw new RuntimeException("Error during registration: " + e.getMessage());
        }
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public User getUserByEmail(String email) {
        String trimmed = email.trim().replaceAll("[\\p{Z}\\s]", "").toLowerCase();
        return userRepository.findByEmailIgnoreCase(trimmed)
                .orElseGet(() -> userRepository.findByEmailContaining(trimmed).stream().findFirst()
                .orElseThrow(() -> new RuntimeException("User not found with email: " + trimmed)));
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

    public void resendOtp(String email) {
        String trimmedEmail = email.trim().replaceAll("[\\p{Z}\\s]", "").toLowerCase();
        User pending = pendingRegistrations.get(trimmedEmail);
        
        if (pending != null) {
            String otp = String.format("%06d", new java.util.Random().nextInt(1000000));
            pending.setOtp(otp);
            emailService.sendOtp(trimmedEmail, otp);
            System.out.println("DEBUG: Resent OTP to pending user: " + trimmedEmail);
            return;
        }

        User user = userRepository.findByEmailIgnoreCase(trimmedEmail)
                .orElseThrow(() -> new RuntimeException("No registration found for email: " + trimmedEmail));
        
        String otp = String.format("%06d", new java.util.Random().nextInt(1000000));
        user.setOtp(otp);
        userRepository.save(user);
        emailService.sendOtp(user.getEmail(), otp);
    }

    public void verifyOtp(String email, String otp) {
        String trimmedEmail = email.trim().replaceAll("[\\p{Z}\\s]", "").toLowerCase();
        User pending = pendingRegistrations.get(trimmedEmail);
        
        if (pending != null) {
            if (pending.getOtp() != null && pending.getOtp().equals(otp)) {
                pending.setVerified(true);
                pending.setOtp(null);
                User savedUser = userRepository.save(pending);
                pendingRegistrations.remove(trimmedEmail);
                
                // Welcome notification
                notificationService.createNotification(savedUser, 
                    "Welcome to EarthPulse AI, " + savedUser.getName() + "! Your account is now active.", 
                    "INFO");
                System.out.println("DEBUG: Pending user verified and saved to DB: " + trimmedEmail);
                return;
            } else {
                throw new RuntimeException("Invalid OTP");
            }
        }

        User user = userRepository.findByEmailIgnoreCase(trimmedEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + trimmedEmail));
        
        if (user.getOtp() != null && user.getOtp().equals(otp)) {
            user.setVerified(true);
            user.setOtp(null);
            userRepository.save(user);
        } else {
            throw new RuntimeException("Invalid OTP");
        }
    }

    public void initiateForgotPassword(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new RuntimeException("Email is required");
        }
        // Aggressive trimming and lowercase
        String trimmedEmail = email.trim().replaceAll("[\\p{Z}\\s]", "").toLowerCase();
        System.out.println("DEBUG: Initiating forgot password for: [" + trimmedEmail + "]");
        
        User user = userRepository.findByEmailIgnoreCase(trimmedEmail)
                .orElseGet(() -> {
                    // Try case-sensitive findByEmail as fallback
                    return userRepository.findByEmail(trimmedEmail)
                            .orElseGet(() -> {
                                // Try containing search (might catch hidden chars in DB)
                                List<User> fuzzyMatches = userRepository.findByEmailContaining(trimmedEmail);
                                if (!fuzzyMatches.isEmpty()) {
                                    System.out.println("DEBUG: Found fuzzy match for email: " + fuzzyMatches.get(0).getEmail());
                                    return fuzzyMatches.get(0);
                                }
                                throw new RuntimeException("USER_NOT_FOUND: Could not find account with email " + trimmedEmail);
                            });
                });
        
        String otp = String.format("%06d", new java.util.Random().nextInt(1000000));
        user.setOtp(otp);
        userRepository.save(user);
        
        try {
            emailService.sendOtp(user.getEmail(), otp);
        } catch (Exception e) {
            throw new RuntimeException("FAILED_TO_SEND_EMAIL: " + e.getMessage());
        }
    }

    public void resetPassword(String email, String otp, String newPassword) {
        String trimmedEmail = email.trim().replaceAll("[\\p{Z}\\s]", "").toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(trimmedEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + trimmedEmail));
        
        if (user.getOtp() != null && user.getOtp().equals(otp)) {
            user.setPassword(passwordEncoder.encode(newPassword));
            user.setOtp(null);
            user.setVerified(true); // Ensure user is verified if they reset password via OTP
            userRepository.save(user);
        } else {
            throw new RuntimeException("Invalid OTP");
        }
    }
}
