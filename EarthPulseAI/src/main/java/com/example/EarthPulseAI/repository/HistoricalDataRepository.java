package com.example.EarthPulseAI.repository;

import com.example.EarthPulseAI.model.HistoricalData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface HistoricalDataRepository extends JpaRepository<HistoricalData, Long> {
    List<HistoricalData> findByLocationAndYear(String location, Integer year);
    
    @Query("SELECT h FROM HistoricalData h WHERE h.location = ?1 AND h.year IN ?2 ORDER BY h.year, h.month")
    List<HistoricalData> findByLocationAndYears(String location, List<Integer> years);
    
    @Query("SELECT h.year, AVG(h.avgAqi) FROM HistoricalData h WHERE h.location = ?1 GROUP BY h.year")
    List<Object[]> findYearlyAverageAqi(String location);
}
