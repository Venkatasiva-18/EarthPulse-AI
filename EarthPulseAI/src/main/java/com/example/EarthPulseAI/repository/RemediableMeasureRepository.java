package com.example.EarthPulseAI.repository;

import com.example.EarthPulseAI.model.RemediableMeasure;
import com.example.EarthPulseAI.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RemediableMeasureRepository extends JpaRepository<RemediableMeasure, Long> {
    List<RemediableMeasure> findByUser(User user);
    List<RemediableMeasure> findByUserAndStatus(User user, RemediableMeasure.Status status);
    List<RemediableMeasure> findByPollutionType(String pollutionType);
    List<RemediableMeasure> findByUserAndValidUntilAfter(User user, LocalDateTime dateTime);
}
