package com.example.EarthPulseAI.repository;

import com.example.EarthPulseAI.model.Prediction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PredictionRepository extends JpaRepository<Prediction, Long> {
    List<Prediction> findByLocation(String location);
}
