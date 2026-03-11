package com.example.EarthPulseAI.controller;

import com.example.EarthPulseAI.model.User;
import com.example.EarthPulseAI.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.EarthPulseAI.security.JwtUtils;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        try {
            User registeredUser = userService.registerUser(user);
            return ResponseEntity.status(201).body(registeredUser);
        } catch (Exception e) {
            HttpStatus status = HttpStatus.BAD_REQUEST;
            String message = e.getMessage() != null ? e.getMessage() : "Unknown registration error";
            
            if (message.contains("FAILED_TO_SEND_EMAIL")) {
                status = HttpStatus.INTERNAL_SERVER_ERROR;
                message = "Verification email failed to send. Please check your email address or use 'Resend OTP' at the verification screen.";
            }
            
            return ResponseEntity.status(status).body(Map.of("message", message));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateJwtToken(authentication);

            return ResponseEntity.ok(Map.of("token", jwt));
        } catch (org.springframework.security.authentication.DisabledException e) {
            return ResponseEntity.status(401).body(Map.of(
                "message", "Account not verified. Please verify your email.",
                "unverified", true
            ));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid username/email or password"));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> request) {
        try {
            userService.verifyOtp(request.get("email"), request.get("otp"));
            return ResponseEntity.ok(Map.of("message", "Email verified successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        try {
            userService.resendOtp(email);
            return ResponseEntity.ok(Map.of("message", "OTP resent successfully"));
        } catch (Exception e) {
            HttpStatus status = HttpStatus.BAD_REQUEST;
            String message = e.getMessage();
            
            if (message != null && message.contains("FAILED_TO_SEND_EMAIL")) {
                status = HttpStatus.INTERNAL_SERVER_ERROR;
            }
            
            return ResponseEntity.status(status).body(Map.of("message", message != null ? message : "Failed to resend OTP"));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        try {
            userService.initiateForgotPassword(email);
            return ResponseEntity.ok(Map.of("message", "OTP sent to your email"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        try {
            userService.resetPassword(request.get("email"), request.get("otp"), request.get("newPassword"));
            return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(userService.findByUsername(username).orElseThrow());
    }

    @PutMapping("/profile")
    public ResponseEntity<User> updateProfile(@RequestBody User updateDto, Authentication authentication) {
        String username = authentication.getName();
        return ResponseEntity.ok(userService.updateUserProfile(username, updateDto));
    }
}
