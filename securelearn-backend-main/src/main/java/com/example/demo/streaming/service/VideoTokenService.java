package com.example.demo.streaming.service;

import java.util.Date;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

@Service
public class VideoTokenService {
	
	private final SecretKey secretKey;
	
	private final ConcurrentHashMap<String,Boolean> usedNonces = new ConcurrentHashMap<>();
	
	public VideoTokenService(@Value("${securelearn.jwt.secret}") String secret) {
		this.secretKey = Keys.hmacShaKeyFor(secret.getBytes());
	}
	
	public String generateVideoToken(String contentId,String userEmail,String fingerprint,String ip) {
		Date now = new Date();
		Date expiry = new Date(now.getTime() + 60_000);
		String nonce = UUID.randomUUID().toString();
		return Jwts.builder()
				.setSubject(userEmail)
				.claim("contentId", contentId)
				.claim("fingerprint", fingerprint)
				.claim("ip", ip)
				.claim("nonce",nonce)
				.setIssuedAt(now)
				.setExpiration(expiry)
				.signWith(secretKey,SignatureAlgorithm.HS256)
				.compact();
	}
	
	public boolean validateToken(String token,String contentId,String fingerprint,String ip) {
		try {
			var claims = Jwts.parserBuilder()
					.setSigningKey(secretKey)
					.build()
					.parseClaimsJws(token)
					.getBody();
			String extractedContent = claims.get("contentId",String.class);
			String extractedFingerprint = claims.get("fingerprint",String.class);
			String extractedIp = claims.get("ip",String.class);
			String nonce = claims.get("nonce",String.class);
			Date expiry = claims.getExpiration();
			if(usedNonces.containsKey(nonce)) {
				return false;
			}
			boolean valid = extractedContent.equals(contentId) && extractedFingerprint.equals(fingerprint) 
							&& extractedIp.equals(ip) && expiry.after(new Date());
			if(valid) {
				usedNonces.put(nonce, true);
			}
			return valid;
		}catch(Exception e) {
			return false;
		}
	}
	
	
}
