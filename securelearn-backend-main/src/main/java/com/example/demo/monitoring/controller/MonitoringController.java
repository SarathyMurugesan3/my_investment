package com.example.demo.monitoring.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.monitoring.model.ActivityLog;
import com.example.demo.monitoring.repository.ActivityLogRepository;
import com.example.demo.monitoring.service.MonitoringService;
import com.example.demo.user.model.User;
import com.example.demo.user.repository.UserRepository;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/monitor")
public class MonitoringController {

	private final MonitoringService monitoringService;
	private final UserRepository userRepository;
	private final ActivityLogRepository activityLogRepository;
	
	
	@Autowired
	public MonitoringController(MonitoringService monitoringService,UserRepository userRepository,ActivityLogRepository activityLogRepository) {
		this.monitoringService = monitoringService;
		this.userRepository = userRepository;
		this.activityLogRepository = activityLogRepository;
	}
	
	@PostMapping("/screenshot")
	public String reportScreenshot(@RequestParam String fingerprint,Authentication authentication,HttpServletRequest request) {
		String email = authentication.getName();
		User user = userRepository.findByEmail(email).orElseThrow(()->new RuntimeException("User not found"));
		monitoringService.logScreenshotAttempt(user,fingerprint,request);
		return "Screenshot attempt recorded";
	}
	
	@GetMapping("/recent")
	public List<ActivityLog> getRecentLogs(@RequestParam int hours){
		LocalDateTime time = LocalDateTime.now().minusHours(hours);
		return activityLogRepository.findByTimestampAfter(time);
	}
	
}



