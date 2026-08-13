package com.example.demo.user.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.user.model.User;
import com.example.demo.user.repository.UserRepository;

@RestController
@RequestMapping("/api/student/profile")
public class UserController {

	
	private final UserRepository userRepository;
	
	public UserController(UserRepository userRepository) {
		this.userRepository = userRepository;
	}
	@GetMapping
	public User getProfile(Authentication authentication) {
		String email = authentication.getName();
		return userRepository.findByEmail(email).orElseThrow(()->new RuntimeException("User not found"));
	}
	
	
}
