package com.example.EarthPulseAI.controller;

import com.example.EarthPulseAI.model.Report;
import com.example.EarthPulseAI.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.example.EarthPulseAI.service.UserService;
import org.springframework.security.core.Authentication;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReportController {
    private final ReportService reportService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<?> createReport(@RequestBody Report report, Authentication authentication) {
        System.out.println("Received report submission request");
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(Map.of("message", "Authentication required to submit report"));
            }
            
            String username = authentication.getName();
            userService.findByUsername(username).ifPresent(report::setUser);
            
            if (report.getTimestamp() == null) {
                report.setTimestamp(java.time.LocalDateTime.now());
            }
            if (report.getUpvotes() == null) report.setUpvotes(0);
            if (report.getConfidenceScore() == null) report.setConfidenceScore(0.0);
            if (report.getVerified() == null) report.setVerified(false);
            if (report.getAnonymous() == null) report.setAnonymous(false);
            if (report.getStatus() == null) report.setStatus(Report.ReportStatus.SUBMITTED);
            if (report.getLatitude() == null) report.setLatitude(20.5937);
            if (report.getLongitude() == null) report.setLongitude(78.9629);

            return ResponseEntity.ok(reportService.createReport(report));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<Report>> getAllReports() {
        return ResponseEntity.ok(reportService.getAllReports());
    }

    @GetMapping("/stats/by-city")
    public ResponseEntity<List<Object[]>> getReportsCountByCity() {
        return ResponseEntity.ok(reportService.getReportsCountByCity());
    }

    @GetMapping("/stats/by-date")
    public ResponseEntity<List<Object[]>> getReportsCountByDate() {
        return ResponseEntity.ok(reportService.getReportsCountByDate());
    }

    @GetMapping("/{location}")
    public ResponseEntity<List<Report>> getReportsByLocation(@PathVariable String location) {
        return ResponseEntity.ok(reportService.getReportsByLocation(location));
    }

    @PostMapping("/{id}/upvote")
    public ResponseEntity<Report> upvoteReport(@PathVariable Long id) {
        return ResponseEntity.ok(reportService.upvoteReport(id));
    }

    @PostMapping("/{id}/verify")
    public ResponseEntity<Report> verifyReport(@PathVariable Long id) {
        return ResponseEntity.ok(reportService.verifyReport(id));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Report> updateReportStatus(
            @PathVariable Long id, 
            @RequestParam Report.ReportStatus status,
            @RequestParam(required = false) String remarks) {
        return ResponseEntity.ok(reportService.updateReportStatus(id, status, remarks));
    }
}
