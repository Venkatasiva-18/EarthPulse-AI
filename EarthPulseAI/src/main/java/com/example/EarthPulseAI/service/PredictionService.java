package com.example.EarthPulseAI.service;

import com.example.EarthPulseAI.model.Prediction;
import com.example.EarthPulseAI.repository.PredictionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PredictionService {
    private final PredictionRepository predictionRepository;

    public List<Prediction> getPredictionsByLocation(String location) {
        return predictionRepository.findByLocation(location);
    }

    public Prediction savePrediction(Prediction prediction) {
        return predictionRepository.save(prediction);
    }
}
