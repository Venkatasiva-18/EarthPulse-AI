package com.example.EarthPulseAI;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import com.example.EarthPulseAI.model.User;
import com.example.EarthPulseAI.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EnableJpaRepositories
public class EarthPulseAiApplication {

	public static void main(String[] args) {
		SpringApplication.run(EarthPulseAiApplication.class, args);
	}

	@Bean
	CommandLineRunner init(UserRepository userRepository, PasswordEncoder passwordEncoder) {
		return args -> {
			if (userRepository.findByUsername("admin").isEmpty()) {
				User admin = new User();
				admin.setUsername("admin");
				admin.setName("System Admin");
				admin.setPassword(passwordEncoder.encode("admin123"));
				admin.setEmail("admin@earthpulse.ai");
				admin.setRole(User.Role.ADMINISTRATOR);
				userRepository.save(admin);
			}
			if (userRepository.findByUsername("authority").isEmpty()) {
				User auth = new User();
				auth.setUsername("authority");
				auth.setName("Pollution Officer");
				auth.setPassword(passwordEncoder.encode("auth123"));
				auth.setEmail("authority@earthpulse.ai");
				auth.setRole(User.Role.AUTHORITY);
				userRepository.save(auth);
			}
		};
	}
}
