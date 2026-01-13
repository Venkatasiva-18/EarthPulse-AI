package com.example.EarthPulseAI.repository;

import com.example.EarthPulseAI.model.Prediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface PredictionRepository extends JpaRepository<Prediction, Long> {
    List<Prediction> findByState(String state);
    List<Prediction> findByDistrict(String district);
    List<Prediction> findByLocation(String location);
    
    List<Prediction> findByLocationAndPredictedForAfter(String location, LocalDateTime dateTime);
    
    @Query("SELECT p FROM Prediction p WHERE p.latitude BETWEEN :minLat AND :maxLat AND p.longitude BETWEEN :minLon AND :maxLon ORDER BY p.predictedFor DESC")
    List<Prediction> findByBoundingBox(
        @Param("minLat") Double minLat,
        @Param("maxLat") Double maxLat,
        @Param("minLon") Double minLon,
        @Param("maxLon") Double maxLon
    );
    
    @Query("SELECT p FROM Prediction p WHERE p.location = :location AND p.predictedFor >= :fromDate ORDER BY p.predictedFor DESC")
    List<Prediction> findRecentPredictionsForLocation(
        @Param("location") String location,
        @Param("fromDate") LocalDateTime fromDate
    );
    
    @Query("SELECT p FROM Prediction p WHERE p.aqiValue >= :threshold ORDER BY p.predictedFor DESC LIMIT 100")
    List<Prediction> findCriticalPredictions(@Param("threshold") Integer threshold);
    
    List<Prediction> findByAqiRange(Prediction.AQIRange aqiRange);
}
