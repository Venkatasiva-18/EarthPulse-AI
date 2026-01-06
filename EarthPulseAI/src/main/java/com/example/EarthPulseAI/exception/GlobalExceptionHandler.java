package com.example.EarthPulseAI.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleGlobalException(Exception ex, WebRequest request) {
        Map<String, String> errorDetails = new HashMap<>();
        String message = ex.getMessage();
        
        // Handle database unique constraint violations
        if (ex.getMessage() != null && ex.getMessage().contains("Duplicate entry")) {
            if (ex.getMessage().contains("username")) {
                message = "Username is already taken.";
            } else if (ex.getMessage().contains("email")) {
                message = "Email is already registered.";
            } else {
                message = "A record with these details already exists.";
            }
        }

        errorDetails.put("message", message);
        errorDetails.put("type", ex.getClass().getSimpleName());
        ex.printStackTrace();
        return ResponseEntity.status(500).body(errorDetails);
    }
}
