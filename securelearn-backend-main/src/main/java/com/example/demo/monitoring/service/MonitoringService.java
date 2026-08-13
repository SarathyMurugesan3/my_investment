package com.example.demo.monitoring.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.core.config.RiskProperties;
import com.example.demo.monitoring.model.ActivityLog;
import com.example.demo.monitoring.repository.ActivityLogRepository;
import com.example.demo.user.model.User;
import com.example.demo.user.repository.UserRepository;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class MonitoringService {
	
	private static final int SCREENSHOT_RISK = 10;
	private static final int BLOCK_THRESHOLD = 50;
	
	private final ActivityLogRepository activityLogRepository;
	private final UserRepository userRepository;
	private final RiskProperties riskProperties;
	
	@Autowired
	public MonitoringService(ActivityLogRepository activityLogRepository,UserRepository userRepository,RiskProperties riskProperties) {
		this.activityLogRepository = activityLogRepository;
		this.userRepository = userRepository;
		this.riskProperties = riskProperties;
	}
	public void logScreenshotAttempt(User user,String fingerprint,HttpServletRequest request) {
		String ip = request.getHeader("X-Forwarded-For");
		ActivityLog log = new ActivityLog(user.getId(),"SCREENSHOT_ATTEMPT",ip,fingerprint, user.getAdminId());
		activityLogRepository.save(log);
		int newRisk = user.getRiskScore()+riskProperties.getScreenshotScore();
		user.setRiskScore(newRisk);
		if(newRisk >= riskProperties.getBlockThreshold()) {
			user.setBlocked(true);
		}
		userRepository.save(user);
	}
	
	
}




