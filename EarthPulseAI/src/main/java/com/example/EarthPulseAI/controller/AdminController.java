package com.example.EarthPulseAI.controller;

import com.example.EarthPulseAI.model.User;
import com.example.EarthPulseAI.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class AdminController {
    private final UserService userService;

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        User currentUser = userService.getUserByUsername(username);
        return ResponseEntity.ok(userService.getAllUsersVisibleTo(currentUser));
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<User> updateUserRole(@PathVariable Long id, @RequestBody Map<String, String> request) {
        User.Role role = User.Role.valueOf(request.get("role"));
        return ResponseEntity.ok(userService.updateUserRole(id, role));
    }

    @PatchMapping("/users/{id}/designation")
    public ResponseEntity<User> updateOfficerDesignation(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String designation = request.get("designation");
        return ResponseEntity.ok(userService.updateOfficerDesignation(id, designation));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok().build();
    }
}
