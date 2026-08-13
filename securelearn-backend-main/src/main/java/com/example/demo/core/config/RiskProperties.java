package com.example.demo.core.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "securelearn.risk")
public class RiskProperties {

	private int screenshotScore;
	private int deviceLimit;
	private int blockThreshold;
	public int getScreenshotScore() {
		return screenshotScore;
	}
	public void setScreenshotScore(int screenshotScore) {
		this.screenshotScore = screenshotScore;
	}
	public int getDeviceLimit() {
		return deviceLimit;
	}
	public void setDeviceLimit(int deviceLimit) {
		this.deviceLimit = deviceLimit;
	}
	public int getBlockThreshold() {
		return blockThreshold;
	}
	public void setBlockThreshold(int blockThreshold) {
		this.blockThreshold = blockThreshold;
	}
	
	
	
	
	
}
