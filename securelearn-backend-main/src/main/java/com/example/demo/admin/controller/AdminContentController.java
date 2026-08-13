package com.example.demo.admin.controller;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.demo.content.model.Content;
import com.example.demo.content.repository.ContentRepository;
import com.example.demo.content.service.PdfStorageService;

/**
 * Admin Content Upload Controller
 *
 * Supports two modes:
 *   1. File upload (PDF or VIDEO): provide `file` multipart param.
 *   2. Video URL (Mighty Networks style): provide `videoUrl` param with no file.
 *
 * In both cases, `title` and optional `description` are accepted.
 */
@RestController
@RequestMapping("/api/admin/content")
public class AdminContentController {

	private final PdfStorageService storageService;
	private final ContentRepository contentRepository;

	public AdminContentController(PdfStorageService storageService, ContentRepository contentRepository) {
		this.storageService = storageService;
		this.contentRepository = contentRepository;
	}

	@PostMapping("/upload")
	public ResponseEntity<String> upload(
	        @RequestParam String title,
	        @RequestParam(required = false) String description,
	        @RequestParam(required = false) String videoUrl,
	        @RequestParam(required = false) MultipartFile file,
	        Authentication authentication
	) throws IOException {

	    String adminEmail = authentication.getName();

	    // Mode 1: Video URL (no file) — Mighty Networks style
	    if ((file == null || file.isEmpty()) && videoUrl != null && !videoUrl.isBlank()) {
	        Content content = new Content(title, description, videoUrl, adminEmail);
	        contentRepository.save(content);
	        return ResponseEntity.status(HttpStatus.CREATED).body("Video link saved successfully");
	    }

	    // Mode 2: File upload (PDF or VIDEO file)
	    if (file == null || file.isEmpty()) {
	        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
	                .body("Either a file or a videoUrl must be provided.");
	    }

	    String contentType = file.getContentType();
	    String type = "UNKNOWN";
	    if (contentType != null) {
	        if (contentType.startsWith("video/")) {
	            type = "VIDEO";
	        } else if (contentType.equals("application/pdf")) {
	            type = "PDF";
	        }
	    }

	    String filePath = storageService.store(file);

	    Content content = new Content(
	            title,
	            description,
	            file.getOriginalFilename(),
	            filePath,
	            adminEmail,
	            type
	    );

	    contentRepository.save(content);
	    return ResponseEntity.status(HttpStatus.CREATED).body("Uploaded successfully");
	}
}
