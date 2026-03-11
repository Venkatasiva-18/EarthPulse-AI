package com.example.EarthPulseAI.service;

import com.example.EarthPulseAI.model.Report;
import com.example.EarthPulseAI.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;

import com.example.EarthPulseAI.model.User;
import com.example.EarthPulseAI.model.GuestUpvote;
import com.example.EarthPulseAI.repository.UserRepository;
import com.example.EarthPulseAI.repository.GuestUpvoteRepository;

@Service
@RequiredArgsConstructor
public class ReportService {
    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final GuestUpvoteRepository guestUpvoteRepository;
    private final NotificationService notificationService;
    private final RemediationService remediationService;

    public Report createReport(Report report) {
        if (report.getTimestamp() == null) {
            report.setTimestamp(java.time.LocalDateTime.now());
        }
        // Simple duplicate detection (same pollution type at same address in last 1 hour)
        List<Report> recentReports = reportRepository.findAll(); // Optimization needed for large data
        for (Report r : recentReports) {
            if (r.getTimestamp() != null && r.getAddress() != null && report.getAddress() != null &&
                r.getPollutionType() != null && report.getPollutionType() != null &&
                r.getAddress().equalsIgnoreCase(report.getAddress()) && 
                r.getPollutionType().equalsIgnoreCase(report.getPollutionType()) &&
                r.getTimestamp().isAfter(report.getTimestamp().minusHours(1))) {
                report.setConfidenceScore(10.0); // Flagged as potential duplicate
            }
        }
        
        if (report.getConfidenceScore() == 0) {
            double initialConfidence = 50.0;
            if (report.getUser() != null && report.getUser().getRole() == User.Role.CITIZEN) {
                // Weigh based on credibility: 50 + (credibility * 2), max 90
                initialConfidence = Math.min(90.0, 50.0 + (report.getUser().getCredibilityScore() * 2.0));
            }
            report.setConfidenceScore(initialConfidence); 
        }

        // Auto-escalation for HIGH severity
        if (report.getSeverity() == Report.Severity.HIGH) {
            report.setStatus(Report.ReportStatus.UNDER_REVIEW);
            // Notify Authorities (Simulated)
            userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.Role.AUTHORITY)
                .forEach(u -> notificationService.createNotification(u, 
                    "URGENT: High severity " + report.getPollutionType() + " reported in " + report.getDistrict(), 
                    "CRITICAL"));
        }

        Report savedReport = reportRepository.save(report);
        
        // Generate remediation measures
        try {
            remediationService.generateRemediationForReport(savedReport);
        } catch (Exception e) {
            // Log error but don't fail the report submission
            System.err.println("Failed to generate remediation measures: " + e.getMessage());
        }
        
        // Notify the reporter
        if (savedReport.getUser() != null) {
            notificationService.createNotification(savedReport.getUser(), 
                "Your report for " + savedReport.getPollutionType() + " has been submitted.", 
                "INFO");
        }

        return savedReport;
    }

    public List<Report> getVerifiedReports() {
        return reportRepository.findByVerified(true);
    }

    public List<Report> getAllReports() {
        return reportRepository.findAllByOrderByTimestampDesc();
    }

    public List<Report> getReportsForUser(User user) {
        return reportRepository.findByUserOrderByTimestampDesc(user);
    }

    public List<Object[]> getReportsCountByCity() {
        return reportRepository.countReportsByDistrict();
    }

    public List<Object[]> getReportsCountByDate() {
        return reportRepository.countReportsByDate();
    }

    public List<Report> getReportsByLocation(String location) {
        return reportRepository.findByDistrict(location);
    }
    
    public Report upvoteReport(Long reportId, User user) {
        Report report = reportRepository.findById(reportId).orElseThrow();
        
        // Check if user already upvoted
        if (report.getUpvotedByUsers().contains(user)) {
            return report;
        }

        // Prevent upvoting own report
        if (report.getUser() != null && report.getUser().getId().equals(user.getId())) {
            return report;
        }

        report.getUpvotedByUsers().add(user);
        return applyUpvote(report);
    }

    public Report upvoteReportAnonymous(Long reportId, String ipAddress) {
        Report report = reportRepository.findById(reportId).orElseThrow();
        
        // Check if this IP has already upvoted this report
        if (guestUpvoteRepository.existsByReportAndIpAddress(report, ipAddress)) {
            return report;
        }

        GuestUpvote guestUpvote = new GuestUpvote(report, ipAddress);
        guestUpvoteRepository.save(guestUpvote);
        
        return applyUpvote(report);
    }

    private Report applyUpvote(Report report) {
        report.setUpvotes(report.getUpvotes() + 1);
        
        // Increase confidence score with upvotes
        double newConfidence = Math.min(100.0, report.getConfidenceScore() + 10.0);
        report.setConfidenceScore(newConfidence);

        // Auto-verify if upvotes > 5
        if (report.getUpvotes() >= 5 && !report.getVerified()) {
            report.setVerified(true);
            if (report.getStatus() == Report.ReportStatus.SUBMITTED) {
                report.setStatus(Report.ReportStatus.UNDER_REVIEW);
            }
            if (report.getUser() != null) {
                notificationService.createNotification(report.getUser(), 
                    "Good news! Your report for " + report.getPollutionType() + " has been verified by the community.", 
                    "INFO");
            }
        }
        
        // Update user credibility score
        User reporter = report.getUser();
        if (reporter != null && reporter.getRole() == User.Role.CITIZEN) {
            reporter.setCredibilityScore(reporter.getCredibilityScore() + 1);
            userRepository.save(reporter);
        }
        
        return reportRepository.save(report);
    }

    public Report verifyReport(Long reportId) {
        Report report = reportRepository.findById(reportId).orElseThrow();
        report.setVerified(true);
        report.setConfidenceScore(100.0);
        report.setStatus(Report.ReportStatus.UNDER_REVIEW);
        if (report.getUser() != null) {
            notificationService.createNotification(report.getUser(), 
                "Your report for " + report.getPollutionType() + " has been officially verified.", 
                "INFO");
        }
        return reportRepository.save(report);
    }

    public Report updateReportStatus(Long reportId, Report.ReportStatus status, String remarks) {
        Report report = reportRepository.findById(reportId).orElseThrow();
        report.setStatus(status);
        if (remarks != null) {
            report.setAuthorityRemarks(remarks);
        }
        if (report.getUser() != null) {
            notificationService.createNotification(report.getUser(), 
                "Status of your report (" + report.getPollutionType() + ") changed to: " + status, 
                "INFO");
        }
        return reportRepository.save(report);
    }

    public Report updateReport(Report report) {
        return reportRepository.save(report);
    }

    public Report getReportById(Long reportId) {
        return reportRepository.findById(reportId).orElseThrow(() -> 
            new IllegalArgumentException("Report not found with id: " + reportId));
    }
}
