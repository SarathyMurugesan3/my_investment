package com.example.demo.admin.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.admin.dto.DashboardStatsResponse;
import com.example.demo.admin.service.AdminDashboardService;

import org.springframework.security.core.Authentication;
import com.example.demo.user.model.User;
import com.example.demo.user.repository.UserRepository;

@RestController
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardController {
	
	private final AdminDashboardService dashboardService;
	private final UserRepository userRepository;
	
	@Autowired
	public AdminDashboardController(AdminDashboardService dashboardService, UserRepository userRepository) {
		this.dashboardService = dashboardService;
		this.userRepository = userRepository;
	}
	
	@GetMapping("/stats")
	public DashboardStatsResponse getStats(Authentication authentication) {
		String adminEmail = authentication.getName();
		User admin = userRepository.findByEmail(adminEmail).orElseThrow(() -> new RuntimeException("Admin not found"));
		return dashboardService.getStats(adminEmail, admin.getId());
	}
	
	
	
}
