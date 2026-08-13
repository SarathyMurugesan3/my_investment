package com.example.demo.monitoring.model;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "activity_logs")
public class ActivityLog {
	
	@Id
	private String id;
	
	@Indexed
	private String userId;
	@Indexed
	private String action;
	private String ipAddress;
	private String fingerprint;
	@Indexed
	private LocalDateTime timestamp;
	@Indexed
	private String adminId;

	public ActivityLog() {}
	
	public ActivityLog(String userId,String action,String ipAddress,String fingerprint, String adminId) {
		this.userId = userId;
		this.action = action;
		this.ipAddress = ipAddress;
		this.fingerprint = fingerprint;
		this.adminId = adminId;
		this.timestamp = LocalDateTime.now();
	}
	
	public String getUserId() {
		return userId;
	}
	public String getAction() {
		return action;
	}
	public String getIpAddress() {
		return ipAddress;
	}
	public String getFingerprint() {
		return fingerprint;
	}
	public LocalDateTime getTimestamp() {
		return timestamp;
	}
	public String getAdminId() {
		return adminId;
	}
	public void setAdminId(String adminId) {
		this.adminId = adminId;
	}
}
