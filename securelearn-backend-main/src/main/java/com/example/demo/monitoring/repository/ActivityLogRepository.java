package com.example.demo.monitoring.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.demo.monitoring.model.ActivityLog;

public interface ActivityLogRepository extends MongoRepository<ActivityLog,String> {
	long countByAction(String action);
	List<ActivityLog> findByTimestampAfter(LocalDateTime time);
	
	// Multi-Admin Scoped Methods
	long countByActionAndAdminId(String action, String adminId);
	List<ActivityLog> findByTimestampAfterAndAdminId(LocalDateTime time, String adminId);
}
