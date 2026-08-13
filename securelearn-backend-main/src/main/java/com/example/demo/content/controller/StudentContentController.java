package com.example.demo.content.controller;

import com.example.demo.content.dto.ContentResponse;
import com.example.demo.content.service.ContentService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.example.demo.user.model.User;
import com.example.demo.user.repository.UserRepository;

import java.util.List;

@RestController
@RequestMapping("/api/student")
public class StudentContentController {

    private final ContentService contentService;
    private final UserRepository userRepository;

    public StudentContentController(ContentService contentService, UserRepository userRepository) {
        this.contentService = contentService;
        this.userRepository = userRepository;
    }

    @GetMapping("/content")
    public ResponseEntity<List<ContentResponse>> listContent(Authentication authentication) {
        String studentEmail = authentication.getName();
        User student = userRepository.findByEmail(studentEmail).orElseThrow();
        
        // Guard: if student has no adminId (e.g. old account), return empty list instead of crashing
        if (student.getAdminId() == null) {
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
        
        User admin = userRepository.findById(student.getAdminId()).orElse(null);
        if (admin == null) {
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
        
        return ResponseEntity.ok(contentService.listAllContent(admin.getEmail()));
    }
}