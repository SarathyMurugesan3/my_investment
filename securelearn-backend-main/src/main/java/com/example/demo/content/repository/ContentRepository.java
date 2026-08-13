package com.example.demo.content.repository;


import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.demo.content.model.Content;

public interface ContentRepository extends MongoRepository<Content,String>{
	Optional<Content> findById(String id);
	
	// Multi-Admin Scoped Methods
	java.util.List<Content> findAllByUploadedBy(String uploadedBy);
	long countByUploadedBy(String uploadedBy);
}
