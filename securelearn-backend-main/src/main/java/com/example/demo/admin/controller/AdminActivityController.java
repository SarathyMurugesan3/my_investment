package com.example.demo.admin.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.monitoring.model.ActivityLog;
import com.example.demo.monitoring.repository.ActivityLogRepository;

@RestController
@RequestMapping("/api/admin/activity")
public class AdminActivityController {
	
	private final ActivityLogRepository activityLogRepository;
	@Autowired
	public AdminActivityController(ActivityLogRepository activityLogRepository) {
		this.activityLogRepository = activityLogRepository;
	}
	
	
	@GetMapping
	public List<ActivityLog> getAllActivityLogs(){
		return activityLogRepository.findAll();
	}
	
	
	
}
