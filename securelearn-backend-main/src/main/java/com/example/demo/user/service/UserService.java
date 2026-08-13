package com.example.demo.user.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.demo.user.dto.CreateUserRequest;
import com.example.demo.user.model.User;
import com.example.demo.user.repository.UserRepository;

@Service
public class UserService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	
	@Autowired
	public UserService(UserRepository userRepository,PasswordEncoder passwordEncoder) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
	}
	
	public User createUser(CreateUserRequest request) {
		if(userRepository.findByEmail(request.getEmail()).isPresent()) {
			throw new RuntimeException("Email already registered");
		}
		if(!request.getRole().equals("ADMIN") && !request.getRole().equals("STUDENT")) {
			throw new RuntimeException("Invalid role");
		}
		String encodedPassword = passwordEncoder.encode(request.getPassword());
		User user = new User(request.getName(),request.getEmail(),encodedPassword,request.getRole(), request.getAdminId());
		return userRepository.save(user);
	}
}
