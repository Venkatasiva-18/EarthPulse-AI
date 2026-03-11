package com.example.EarthPulseAI.security;

import com.example.EarthPulseAI.model.User;
import com.example.EarthPulseAI.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {
    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        String trimmed = usernameOrEmail.trim();
        User user = userRepository.findByUsername(trimmed)
                .or(() -> userRepository.findByEmailIgnoreCase(trimmed))
                .orElseThrow(() -> new UsernameNotFoundException("User Not Found with username or email: " + trimmed));
        
        boolean isEnabled = (user.getVerified() != null && user.getVerified()) || "admin".equals(user.getUsername());
        
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                isEnabled, // enabled
                true, // accountNonExpired
                true, // credentialsNonExpired
                true, // accountNonLocked
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );
    }
}
