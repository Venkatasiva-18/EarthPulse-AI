package com.example.EarthPulseAI.repository;

import com.example.EarthPulseAI.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Map;

public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByState(String state);
    List<Report> findByDistrict(String district);
    List<Report> findByVillage(String village);
    List<Report> findByMandal(String mandal);
    
    @Query("SELECT r.district as district, COUNT(r) as count FROM Report r GROUP BY r.district")
    List<Object[]> countReportsByDistrict();

    @Query("SELECT r FROM Report r WHERE r.latitude BETWEEN ?1 AND ?2 AND r.longitude BETWEEN ?3 AND ?4")
    List<Report> findByBoundingBox(Double minLat, Double maxLat, Double minLon, Double maxLon);

    @Query("SELECT DATE(r.timestamp) as date, COUNT(r) as count FROM Report r GROUP BY DATE(r.timestamp) ORDER BY DATE(r.timestamp) ASC")
    List<Object[]> countReportsByDate();
}
