package com.example.EarthPulseAI.controller;

import com.example.EarthPulseAI.model.Prediction;
import com.example.EarthPulseAI.service.PredictionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.example.EarthPulseAI.service.MLService;

@RestController
@RequestMapping("/api/predictions")
@RequiredArgsConstructor
public class PredictionController {
    private final PredictionService predictionService;
    private final MLService mlService;

    @GetMapping("/{location}")
    public ResponseEntity<List<Prediction>> getPredictions(@PathVariable String location) {
        return ResponseEntity.ok(predictionService.getPredictionsByLocation(location));
    }

    @PostMapping("/generate")
    public ResponseEntity<Prediction> generatePrediction(
            @RequestParam String location, 
            @RequestParam int hour, 
            @RequestParam int day, 
            @RequestParam int severity,
            @RequestParam(defaultValue = "25.0") double temp,
            @RequestParam(defaultValue = "50.0") double humidity) {
        return ResponseEntity.ok(mlService.getPredictionFromML(location, hour, day, severity, temp, humidity));
    }
}
