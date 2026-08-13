package com.example.demo.admin.dto;

public class DashboardStatsResponse {
	
	private long totalUsers;
	private long blockedUsers;
	private long totalContent;
	private long totalScreenshotAttempts;
	private long highRiskUsers;
	
	public DashboardStatsResponse(long totalUsers,long blockedUsers,long totalContent,long totalScreenshotAttempts,long highRiskUsers) {
		this.totalUsers = totalUsers;
		this.blockedUsers = blockedUsers;
		this.totalContent = totalContent;
		this.totalScreenshotAttempts = totalScreenshotAttempts;
		this.highRiskUsers = highRiskUsers;
	}
	
	public long getTotalUsers() {
		return totalUsers;
	}
	public long getBlockedUsers() {
		return blockedUsers;
	}
	public long getTotalContent() {
		return totalContent;
	}
	public long getTotalScreenshotAttempts() {
		return totalScreenshotAttempts;
	}
	public long getHighRiskUsers() {
		return highRiskUsers;
	}
	
	
	
}
