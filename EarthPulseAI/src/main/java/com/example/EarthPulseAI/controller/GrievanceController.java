package com.example.EarthPulseAI.controller;

import com.example.EarthPulseAI.model.Grievance;
import com.example.EarthPulseAI.model.User;
import com.example.EarthPulseAI.service.GrievanceService;
import com.example.EarthPulseAI.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/grievances")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class GrievanceController {
    private final GrievanceService grievanceService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<Grievance> createGrievance(@RequestBody Grievance grievance, Authentication authentication) {
        User user = userService.findByUsername(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(grievanceService.createGrievance(user, grievance.getTitle(), grievance.getDescription()));
    }

    @GetMapping
    public ResponseEntity<List<Grievance>> getMyGrievances(Authentication authentication) {
        User user = userService.findByUsername(authentication.getName()).orElseThrow();
        return ResponseEntity.ok(grievanceService.getGrievancesForUser(user));
    }

    @GetMapping("/all")
    public ResponseEntity<List<Grievance>> getAllGrievances() {
        return ResponseEntity.ok(grievanceService.getAllGrievances());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Grievance> updateStatus(
            @PathVariable Long id, 
            @RequestParam Grievance.Status status,
            @RequestParam(required = false) String resolution) {
        return ResponseEntity.ok(grievanceService.updateGrievanceStatus(id, status, resolution));
    }
}
