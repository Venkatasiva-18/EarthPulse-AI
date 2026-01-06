package com.example.EarthPulseAI.repository;

import com.example.EarthPulseAI.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Map;

public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByCity(String city);
    
    @Query("SELECT r.city as city, COUNT(r) as count FROM Report r GROUP BY r.city")
    List<Object[]> countReportsByCity();

    @Query("SELECT DATE(r.timestamp) as date, COUNT(r) as count FROM Report r GROUP BY DATE(r.timestamp) ORDER BY DATE(r.timestamp) ASC")
    List<Object[]> countReportsByDate();
}
