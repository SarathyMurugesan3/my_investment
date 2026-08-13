package com.example.demo.core.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.example.demo.user.model.User;
import com.example.demo.user.repository.UserRepository;

@Component
public class DataInitializer implements CommandLineRunner {
	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	
	@Autowired
	public DataInitializer(UserRepository userRepository,PasswordEncoder passwordEncoder) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
	}
	
	@Override
	public void run(String... args) {
		if(userRepository.findByEmail("admin@securelearn.com").isEmpty()) {
			User admin = new User("Super Admin","admin@securelearn.com",passwordEncoder.encode("admin123"),"ADMIN", null);
			userRepository.save(admin);
            System.out.println("✅ Default Admin Created");
		}
	}
	
	
	
	
	
}
