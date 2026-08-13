package com.example.demo.auth.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.auth.dto.LoginRequest;
import com.example.demo.auth.dto.LoginResponse;
import com.example.demo.auth.service.AuthService;
import com.example.demo.core.config.RegistrationProperties;
import com.example.demo.user.dto.CreateUserRequest;
import com.example.demo.user.model.User;
import com.example.demo.user.repository.UserRepository;
import com.example.demo.user.service.UserService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
	
	private final AuthService authService;
	private final UserService userService;
	private final RegistrationProperties registrationProperties;
	private final UserRepository userRepository;
	
	@Autowired
	public AuthController(AuthService authService, UserService userService, RegistrationProperties registrationProperties, UserRepository userRepository) {
		this.authService = authService;
		this.userService = userService;
		this.registrationProperties = registrationProperties;
		this.userRepository = userRepository;
	}

	@PostMapping("/register")
	public ResponseEntity<?> register(@RequestBody CreateUserRequest request){
		if(!registrationProperties.isPublicEnabled()) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN)
					.body("Public registration disabled");
		}

		// Validate role — only STUDENT or ADMIN accepted
		String role = request.getRole();
		if (role == null || (!role.equalsIgnoreCase("STUDENT") && !role.equalsIgnoreCase("ADMIN"))) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST)
					.body("Invalid role. Must be STUDENT or ADMIN.");
		}

		// ADMIN registration requires adminId
		if (role.equalsIgnoreCase("ADMIN") && (request.getAdminId() == null || request.getAdminId().isBlank())) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST)
					.body("adminId is required to register as ADMIN.");
		}

		// Normalise to uppercase
		request.setRole(role.toUpperCase());

		User user = userService.createUser(request);
		return ResponseEntity.status(HttpStatus.CREATED).body(user);
	}

	/**
	 * Used by the Admin frontend panel to create a student under the admin's school.
	 * The adminId is automatically resolved from the JWT token — no manual input needed.
	 */
	@PostMapping("/admin/create-user")
	public ResponseEntity<?> adminCreateUser(@RequestBody CreateUserRequest request, Authentication authentication) {
		String adminEmail = authentication.getName();
		User admin = userRepository.findByEmail(adminEmail).orElseThrow(() -> new RuntimeException("Admin not found"));
		
		// Force role to STUDENT and auto-link to this admin
		request.setRole("STUDENT");
		request.setAdminId(admin.getId());
		
		User user = userService.createUser(request);
		return ResponseEntity.status(HttpStatus.CREATED).body(user);
	}
	
	@PostMapping("/login")
	public LoginResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
		return authService.login(request, httpRequest);
	}
	
	@PostMapping("/refresh")
	public LoginResponse refresh(@RequestBody Map<String,String> body) {
	    return authService.refreshToken(body.get("refreshToken"));
	}
	
	@PostMapping("/logout")
	public String logout() {
		return "Client should delete token";
	}
	
}
