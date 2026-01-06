package com.example.EarthPulseAI.repository;

import com.example.EarthPulseAI.model.Notification;
import com.example.EarthPulseAI.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserOrderByTimestampDesc(User user);
}
