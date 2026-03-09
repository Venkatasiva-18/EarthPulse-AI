package com.example.EarthPulseAI.repository;

import com.example.EarthPulseAI.model.GuestUpvote;
import com.example.EarthPulseAI.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface GuestUpvoteRepository extends JpaRepository<GuestUpvote, Long> {
    Optional<GuestUpvote> findByReportAndIpAddress(Report report, String ipAddress);
    boolean existsByReportAndIpAddress(Report report, String ipAddress);
}
