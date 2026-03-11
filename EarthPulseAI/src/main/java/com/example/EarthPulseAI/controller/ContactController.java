package com.example.EarthPulseAI.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.EarthPulseAI.service.EmailService;
import java.util.Map;

@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
public class ContactController {
    private final EmailService emailService;

    @PostMapping
    public ResponseEntity<?> submitContactForm(@RequestBody Map<String, String> formData) {
        String name = formData.get("name");
        String email = formData.get("email");
        String subject = formData.get("subject");
        String message = formData.get("message");

        // Format the support email
        String supportBody = String.format(
            "New Contact Us Submission:\n\n" +
            "From: %s\n" +
            "Email: %s\n" +
            "Subject: %s\n\n" +
            "Message:\n%s",
            name, email, subject, message
        );

        try {
            // Send email to support
            emailService.sendEmail("venkatasivaragala@gmail.com", "Support Request: " + subject, supportBody);
            
            // Try to send an automated acknowledgment to the user, but don't fail if their email is invalid
            try {
                String acknowledgmentBody = String.format(
                    "Hello %s,\n\n" +
                    "Thank you for reaching out to EarthPulse AI support. We have received your message regarding '%s' and will get back to you within 24-48 hours.\n\n" +
                    "Your Message:\n%s\n\n" +
                    "Best regards,\nEarthPulse AI Team",
                    name, subject, message
                );
                emailService.sendEmail(email, "We've received your request - EarthPulse AI", acknowledgmentBody);
            } catch (Exception e) {
                System.err.println("Failed to send acknowledgment email: " + e.getMessage());
            }
            
            return ResponseEntity.ok(Map.of("message", "Message sent successfully"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Failed to send message: " + e.getMessage()));
        }
    }
}
