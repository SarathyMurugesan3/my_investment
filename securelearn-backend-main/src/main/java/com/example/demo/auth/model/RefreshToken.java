package com.example.demo.auth.model;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "refresh_tokens")
public class RefreshToken {
	
	@Id
	private String id;
	
	private String email;
	private String token;
	private LocalDateTime expiry;
	public RefreshToken() {}
	public RefreshToken(String email,String token,LocalDateTime expiry) {
		this.email = email;
		this.token = token;
		this.expiry = expiry;
	}
	
	public String getEmail() {
		return email;
	}
	public String getToken() {
		return token;
	}
	public LocalDateTime getExpiry() {
		return expiry;
	}
	
}
