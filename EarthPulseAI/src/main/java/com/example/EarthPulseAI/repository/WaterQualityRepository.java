package com.example.EarthPulseAI.repository;

import com.example.EarthPulseAI.model.WaterQualityData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface WaterQualityRepository extends JpaRepository<WaterQualityData, Long> {
    List<WaterQualityData> findByState(String state);
    List<WaterQualityData> findByDistrict(String district);

    @Query("SELECT w FROM WaterQualityData w WHERE w.latitude BETWEEN ?1 AND ?2 AND w.longitude BETWEEN ?3 AND ?4")
    List<WaterQualityData> findByBoundingBox(Double minLat, Double maxLat, Double minLon, Double maxLon);
}
