package com.example.EarthPulseAI.controller;

import com.example.EarthPulseAI.model.HistoricalData;
import com.example.EarthPulseAI.service.HistoricalDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/historical")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HistoricalDataController {
    private final HistoricalDataService historicalDataService;

    @GetMapping("/trends")
    public ResponseEntity<List<HistoricalData>> getTrends(
            @RequestParam String location,
            @RequestParam(defaultValue = "2023,2024,2025") List<Integer> years) {
        return ResponseEntity.ok(historicalDataService.getHistoricalTrends(location, years));
    }

    @GetMapping("/averages")
    public ResponseEntity<Map<Integer, Double>> getAverages(@RequestParam String location) {
        return ResponseEntity.ok(historicalDataService.getYearlyAverages(location));
    }
}
