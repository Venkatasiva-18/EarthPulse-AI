package com.example.EarthPulseAI.controller;

import com.example.EarthPulseAI.model.Report;
import com.example.EarthPulseAI.service.ReportService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
public class ExportController {
    private final ReportService reportService;

    @GetMapping("/csv")
    public void exportReportsToCSV(HttpServletResponse response) throws IOException {
        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=pollution_reports.csv");

        List<Report> reports = reportService.getAllReports();
        StringBuilder csvContent = new StringBuilder();
        csvContent.append("ID,PollutionType,Severity,Location,City,Status,Timestamp\n");

        for (Report report : reports) {
            csvContent.append(report.getId()).append(",")
                    .append(report.getPollutionType()).append(",")
                    .append(report.getSeverity()).append(",")
                    .append("\"").append(report.getAddress()).append("\",")
                    .append(report.getDistrict()).append(",")
                    .append(report.getStatus()).append(",")
                    .append(report.getTimestamp()).append("\n");
        }

        response.getWriter().write(csvContent.toString());
    }
}
