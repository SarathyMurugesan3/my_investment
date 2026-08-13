package com.example.demo.admin.service;

import org.springframework.stereotype.Service;

import com.example.demo.admin.dto.DashboardStatsResponse;
import com.example.demo.content.repository.ContentRepository;
import com.example.demo.monitoring.repository.ActivityLogRepository;
import com.example.demo.user.repository.UserRepository;

@Service
public class AdminDashboardService {
	
	private final UserRepository userRepository;
	private final ContentRepository contentRepository;
	private final ActivityLogRepository activityLogRepository;
	
	public AdminDashboardService(UserRepository userRepository,ContentRepository contentRepository,ActivityLogRepository activityLogRepository) {
		this.userRepository = userRepository;
		this.contentRepository = contentRepository;
		this.activityLogRepository = activityLogRepository;
	}
	
	public DashboardStatsResponse getStats(String adminEmail, String adminId) {
		long totalUsers = userRepository.countByAdminId(adminId);
		long blockedUsers = userRepository.countByBlockedAndAdminId(true, adminId);
		long highRiskUsers = userRepository.countByRiskScoreGreaterThanAndAdminId(30, adminId);
		long totalContent = contentRepository.countByUploadedBy(adminEmail);
		long screenshotAttempts = activityLogRepository.countByActionAndAdminId("SCREENSHOT_ATTEMPT", adminId);
		return new DashboardStatsResponse(totalUsers,blockedUsers,totalContent,screenshotAttempts,highRiskUsers);
	}
	
	
	
	
}
