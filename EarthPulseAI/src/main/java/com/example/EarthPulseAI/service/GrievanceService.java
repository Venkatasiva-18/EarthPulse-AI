package com.example.EarthPulseAI.service;

import com.example.EarthPulseAI.model.Grievance;
import com.example.EarthPulseAI.model.User;
import com.example.EarthPulseAI.repository.GrievanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GrievanceService {
    private final GrievanceRepository grievanceRepository;
    private final NotificationService notificationService;

    public Grievance createGrievance(User user, String title, String description) {
        Grievance grievance = new Grievance();
        grievance.setUser(user);
        grievance.setTitle(title);
        grievance.setDescription(description);
        grievance.setTimestamp(LocalDateTime.now());
        return grievanceRepository.save(grievance);
    }

    public List<Grievance> getGrievancesForUser(User user) {
        return grievanceRepository.findByUserOrderByTimestampDesc(user);
    }

    public List<Grievance> getAllGrievances() {
        return grievanceRepository.findAll();
    }

    public List<Grievance> getAllVisibleGrievances(User currentUser) {
        if (currentUser.getRole() == User.Role.ADMINISTRATOR) {
            return grievanceRepository.findAll();
        } else if (currentUser.getRole() == User.Role.MODERATOR) {
            return grievanceRepository.findByUser_State(currentUser.getState());
        } else if (currentUser.getRole() == User.Role.AUTHORITY) {
            return grievanceRepository.findByUser_District(currentUser.getDistrict());
        }
        return new java.util.ArrayList<>();
    }

    public Grievance updateGrievanceStatus(Long id, Grievance.Status status, String resolution) {
        Grievance grievance = grievanceRepository.findById(id).orElseThrow();
        grievance.setStatus(status);
        if (resolution != null) {
            grievance.setResolution(resolution);
        }
        
        Grievance updated = grievanceRepository.save(grievance);
        
        // Notify user
        if (updated.getUser() != null) {
            notificationService.createNotification(updated.getUser(), 
                "Your grievance '" + updated.getTitle() + "' status updated to " + status, 
                "INFO");
        }
        
        return updated;
    }
}
