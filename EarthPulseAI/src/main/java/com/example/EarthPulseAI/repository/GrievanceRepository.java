package com.example.EarthPulseAI.repository;

import com.example.EarthPulseAI.model.Grievance;
import com.example.EarthPulseAI.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GrievanceRepository extends JpaRepository<Grievance, Long> {
    List<Grievance> findByUserOrderByTimestampDesc(User user);
    List<Grievance> findByUser_State(String state);
    List<Grievance> findByUser_District(String district);
}
