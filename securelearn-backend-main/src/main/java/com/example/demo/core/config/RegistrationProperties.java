package com.example.demo.core.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

@Component
@ConfigurationProperties(prefix = "securelearn.registration")
public class RegistrationProperties {

	private boolean publicEnabled;
	public boolean isPublicEnabled() {
		return publicEnabled;
	}
	public void setPublicEnabled(boolean publicEnabled) {
		this.publicEnabled = publicEnabled;
	}
	@PostConstruct	
	public void debug() {
	    System.out.println("Public Enabled = " + publicEnabled);
	}
}
