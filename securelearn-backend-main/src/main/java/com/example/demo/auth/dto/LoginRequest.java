package com.example.demo.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class LoginRequest {

	@Email
	@NotBlank
	private String email;
	
	@NotBlank
	private String password;
	
	@NotBlank
	private String fingerprint;
	public LoginRequest() {}
	public String getEmail() {
		return email;
	}
	public String getPassword() {
		return password;
	}
	public String getFingerprint() {
		return fingerprint;
	}
	
	
	
}
