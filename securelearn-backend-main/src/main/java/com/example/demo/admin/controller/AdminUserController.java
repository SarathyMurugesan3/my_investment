package com.example.demo.admin.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.user.dto.CreateUserRequest;
import com.example.demo.user.model.User;
import com.example.demo.user.repository.UserRepository;
import com.example.demo.user.service.UserService;

/**
 * Admin panel: Create a student under the logged-in admin's school.
 * adminId is always auto-resolved from the JWT — never trusted from the request body.
 *
 * Endpoint: POST /api/admin/users
 */
@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

	private final UserService userService;
	private final UserRepository userRepository;

	@Autowired
	public AdminUserController(UserService userService, UserRepository userRepository) {
		this.userService = userService;
		this.userRepository = userRepository;
	}

	@PostMapping
	public ResponseEntity<?> createUser(
			@RequestBody CreateUserRequest request,
			Authentication authentication) {

		// Always resolve adminId from the authenticated admin's JWT — never trust client input
		String adminEmail = authentication.getName();
		User admin = userRepository.findByEmail(adminEmail)
				.orElseThrow(() -> new RuntimeException("Admin not found"));

		// Force role to STUDENT and bind to this admin
		request.setRole("STUDENT");
		request.setAdminId(admin.getId());

		User created = userService.createUser(request);
		return ResponseEntity.status(HttpStatus.CREATED).body(created);
	}
}
