package com.example.EarthPulseAI.controller;

import com.example.EarthPulseAI.model.WaterQualityData;
import com.example.EarthPulseAI.service.WaterQualityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/water-quality")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class WaterQualityController {
    private final WaterQualityService waterQualityService;

    @PostMapping("/analyze")
    public ResponseEntity<WaterQualityData> analyze(@RequestBody WaterQualityData data) {
        return ResponseEntity.ok(waterQualityService.analyzeWaterQuality(data));
    }

    @GetMapping("/history/{district}")
    public ResponseEntity<List<WaterQualityData>> getHistory(@PathVariable String district) {
        return ResponseEntity.ok(waterQualityService.getLocationHistory(district));
    }
}
