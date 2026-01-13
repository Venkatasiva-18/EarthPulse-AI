package com.example.EarthPulseAI.repository;

import com.example.EarthPulseAI.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    List<User> findByStateAndRoleIn(String state, List<User.Role> roles);
    List<User> findByDistrictAndRole(String district, User.Role role);
}
