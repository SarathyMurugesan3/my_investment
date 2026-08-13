package com.example.demo.auth.repository;

import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.demo.auth.model.RefreshToken;

public interface RefreshTokenRepository extends MongoRepository<RefreshToken,String> {
	Optional<RefreshToken> findByToken(String token);
}
