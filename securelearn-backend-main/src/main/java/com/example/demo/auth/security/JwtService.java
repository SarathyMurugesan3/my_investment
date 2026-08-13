package com.example.demo.auth.security;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

	
	private final SecretKey secretKey;
	
	private final long accessTokenExpiration;
	
	private final long refreshTokenExpiration;
	
	public JwtService(
			@Value("${securelearn.jwt.secret}") String secret,
			@Value("${securelearn.jwt.access-token-expiration}") long accessExp,
			@Value("${securelearn.jwt.refresh-token-expiration}") long refreshExp) {
		this.secretKey = Keys.hmacShaKeyFor(secret.getBytes());
		this.accessTokenExpiration = accessExp;
		this.refreshTokenExpiration = refreshExp;
	}
	
	public String generateAccessToken(String email,String role) {
		Map<String,Object> claims = new HashMap<>();
		claims.put("role",role);
		return buildToken(claims,email,accessTokenExpiration);
	}
	
	public String generateRefreshToken(String email) {
		return buildToken(new HashMap<>(),email,refreshTokenExpiration);
	}
	private String buildToken(Map<String,Object> extraClaims,String subject,long expiration) {
		Date now = new Date();
		Date expiryDate = new Date(now.getTime()+expiration);
		return Jwts.builder()
				.setClaims(extraClaims)
				.setSubject(subject)
				.setIssuedAt(now)
				.setExpiration(expiryDate)
				.signWith(secretKey,SignatureAlgorithm.HS256)
				.compact();
	}
	public String extractEmail(String token) {
		return extractAllClaims(token).getSubject();
		
	}
	
	public boolean isTokenValid(String token,String email) {
		final String extractedEmail = extractEmail(token);
		return extractedEmail.equals(email) && !isTokenExpired(token);
	}
	private boolean isTokenExpired(String token) {
		return extractAllClaims(token).getExpiration().before(new Date());
	}
	
	private Claims extractAllClaims(String token) {
		return Jwts.parserBuilder()
				.setSigningKey(secretKey)
				.build()
				.parseClaimsJws(token)
				.getBody();
	}
}










