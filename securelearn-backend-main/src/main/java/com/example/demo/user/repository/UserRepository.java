package com.example.demo.user.repository;

import java.util.Optional;

import org.bson.types.ObjectId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.demo.user.model.User;

public interface UserRepository extends MongoRepository<User,String> {

	Optional<User> findByEmail(String email);
	Page<User> findByBlocked(boolean blocked,Pageable pageable);
	Page<User> findByRiskScoreGreaterThan(int riskScore,Pageable pageable);
	long countByBlocked(boolean blocked);
	long countByRiskScoreGreaterThan(int riskScore);

	// Multi-Admin Scoped Methods
	Page<User> findByAdminId(String adminId, Pageable pageable);
	Page<User> findByBlockedAndAdminId(boolean blocked, String adminId, Pageable pageable);
	Page<User> findByRiskScoreGreaterThanAndAdminId(int riskScore, String adminId, Pageable pageable);
	long countByAdminId(String adminId);
	long countByBlockedAndAdminId(boolean blocked, String adminId);
	long countByRiskScoreGreaterThanAndAdminId(int riskScore, String adminId);
}
