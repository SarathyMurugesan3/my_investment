package com.example.demo.auth.service;



import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.demo.auth.dto.LoginRequest;
import com.example.demo.auth.dto.LoginResponse;
import com.example.demo.auth.security.JwtService;
import com.example.demo.device.service.DeviceService;
import com.example.demo.user.model.User;
import com.example.demo.user.repository.UserRepository;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class AuthService {

	
	private final AuthenticationManager authenticationManager;
	private final JwtService jwtService;
	private final UserRepository userRepository;
	private final DeviceService deviceService;
	private final PasswordEncoder passwordEncoder;
	
	public AuthService(AuthenticationManager authenticationManager,JwtService jwtService,UserRepository userRepository,DeviceService deviceService
			,PasswordEncoder passwordEncoder) {
		this.authenticationManager = authenticationManager;
		this.jwtService = jwtService;
		this.userRepository = userRepository;
		this.deviceService = deviceService;
		this.passwordEncoder = passwordEncoder;
	}
	
	public LoginResponse login(LoginRequest request,HttpServletRequest httpRequest) {
		try {
			authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(request.getEmail(),request.getPassword()));
		}catch(AuthenticationException ex) {
			throw new RuntimeException("Invalid email or password");
		}
		User user = userRepository.findByEmail(request.getEmail()).orElseThrow(()-> new RuntimeException("User not found"));
		if(user.isBlocked()) {
			throw new RuntimeException("User is blocked due to risk score");
		}
		System.out.println("DEBUG USER: " + user);
		deviceService.trackDevice(user, request.getFingerprint(), httpRequest);
		String accessToken = jwtService.generateAccessToken(user.getEmail(), user.getRole());
		String refreshToken = jwtService.generateRefreshToken(user.getEmail());
		System.out.println(passwordEncoder.matches("admin123", user.getPassword()));
		return new LoginResponse(accessToken,refreshToken);
	}
	public LoginResponse refreshToken(String refreshToken) {
		String email = jwtService.extractEmail(refreshToken);
		if(!jwtService.isTokenValid(refreshToken, email)) {
			throw new RuntimeException("Invalid refresh token");
		}
		User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("user not found"));
		String newAccessToken = jwtService.generateAccessToken(user.getEmail(), user.getRole());
		return new LoginResponse(newAccessToken,refreshToken);
	}
	
}
