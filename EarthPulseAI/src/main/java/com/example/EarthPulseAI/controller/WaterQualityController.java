package com.example.EarthPulseAI.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.EarthPulseAI.model.WaterQualityData;
import com.example.EarthPulseAI.service.UserService;
import com.example.EarthPulseAI.service.WaterQualityService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/water-quality")
@RequiredArgsConstructor
public class WaterQualityController {
    private final WaterQualityService waterQualityService;
    private final UserService userService;

    @PostMapping("/analyze")
    public ResponseEntity<WaterQualityData> analyze(@RequestBody WaterQualityData data) {
        org.springframework.security.core.Authentication authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && !(authentication instanceof org.springframework.security.authentication.AnonymousAuthenticationToken)) {
            String username = authentication.getName();
            userService.findByUsername(username).ifPresent(data::setUser);
        }
        return ResponseEntity.ok(waterQualityService.analyzeWaterQuality(data));
    }

    @GetMapping("/history/{district}")
    public ResponseEntity<List<WaterQualityData>> getHistory(@PathVariable String district) {
        return ResponseEntity.ok(waterQualityService.getLocationHistory(district));
    }
}
