package com.example.EarthPulseAI.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;

    public void sendEmail(String to, String subject, String body) {
        System.out.println("DEBUG: Attempting to send email to: " + to);
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("venkatasivaragala@gmail.com");
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            System.out.println("DEBUG: Email sent successfully to: " + to);
        } catch (Exception e) {
            System.err.println("DEBUG: Error sending email to " + to + ": " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    public void sendOtp(String email, String otp) {
        String subject = "Your EarthPulse AI OTP";
        String body = "Hello,\n\nYour OTP for verification is: " + otp + "\n\nPlease use this to complete your registration or password reset.\n\nThank you,\nEarthPulse AI Team";
        sendEmail(email, subject, body);
    }
}
