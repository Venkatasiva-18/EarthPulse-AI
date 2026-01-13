package com.example.EarthPulseAI.service;

import com.example.EarthPulseAI.model.Prediction;
import com.example.EarthPulseAI.repository.PredictionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PredictionService {
    private final PredictionRepository predictionRepository;

    public List<Prediction> getPredictionsByLocation(String location) {
        return predictionRepository.findByLocation(location);
    }

    public List<Prediction> getRecentPredictionsForLocation(String location) {
        LocalDateTime from = LocalDateTime.now().minusHours(24);
        return predictionRepository.findRecentPredictionsForLocation(location, from);
    }

    public List<Prediction> getPredictionsByBoundingBox(Double minLat, Double maxLat, Double minLon, Double maxLon) {
        return predictionRepository.findByBoundingBox(minLat, maxLat, minLon, maxLon);
    }

    public List<Prediction> getCriticalPredictions(Integer threshold) {
        return predictionRepository.findCriticalPredictions(threshold);
    }

    public List<Prediction> getPredictionsByAqiRange(Prediction.AQIRange aqiRange) {
        return predictionRepository.findByAqiRange(aqiRange);
    }

    public Prediction savePrediction(Prediction prediction) {
        prediction.setCreatedAt(LocalDateTime.now());
        prediction.setUpdatedAt(LocalDateTime.now());
        return predictionRepository.save(prediction);
    }

    public Prediction updatePrediction(Prediction prediction) {
        prediction.setUpdatedAt(LocalDateTime.now());
        return predictionRepository.save(prediction);
    }

    public List<Prediction> getAllRecentPredictions() {
        LocalDateTime from = LocalDateTime.now().minusHours(24);
        return predictionRepository.findAll().stream()
            .filter(p -> p.getPredictedFor() != null && p.getPredictedFor().isAfter(from))
            .toList();
    }

    public Prediction getLatestPredictionForLocation(String location) {
        List<Prediction> predictions = getRecentPredictionsForLocation(location);
        return predictions.isEmpty() ? null : predictions.get(0);
    }
}
