package com.example.demo.admin.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;

import com.example.demo.user.model.User;
import com.example.demo.user.repository.UserRepository;

@RestController
@RequestMapping("/api/admin/manage-users")
public class AdminUserManagementController {
	
	private final UserRepository userRepository;
	
	@Autowired
	public AdminUserManagementController(UserRepository userRepository) {
		this.userRepository = userRepository;
	}
	
	@GetMapping
	public Page<User> getUsers(@RequestParam(defaultValue="0") int page,
			@RequestParam(defaultValue="10") int size,
			@RequestParam(defaultValue="id") String sortBy,
			Authentication authentication){
		Pageable pageable = PageRequest.of(page, size,Sort.by(sortBy));
		String adminEmail = authentication.getName();
		User admin = userRepository.findByEmail(adminEmail).orElseThrow();
		return userRepository.findByAdminId(admin.getId(), pageable);
	}
	
	@PostMapping("/{id}/block")
	public String blockUser(@PathVariable String id, Authentication authentication) {
		String adminEmail = authentication.getName();
		User admin = userRepository.findByEmail(adminEmail).orElseThrow();
		User user = userRepository.findById(id).orElseThrow();
		if(!admin.getId().equals(user.getAdminId())) throw new RuntimeException("Unauthorized");
		
		user.setBlocked(true);
		userRepository.save(user);
		return "User blocked";
	}
	
	@PostMapping("/{id}/unblock")
	public String unblockUser(@PathVariable String id, Authentication authentication) {
		String adminEmail = authentication.getName();
		User admin = userRepository.findByEmail(adminEmail).orElseThrow();
		User user = userRepository.findById(id).orElseThrow();
		if(!admin.getId().equals(user.getAdminId())) throw new RuntimeException("Unauthorized");
		
		user.setBlocked(false);
		user.setRiskScore(0);
		userRepository.save(user);
		return "User unblocked";
	}
	
	@DeleteMapping("/{id}")
	public String deleteUser(@PathVariable String id, Authentication authentication) {
		String adminEmail = authentication.getName();
		User admin = userRepository.findByEmail(adminEmail).orElseThrow();
		User user = userRepository.findById(id).orElseThrow();
		if(!admin.getId().equals(user.getAdminId())) throw new RuntimeException("Unauthorized");
		userRepository.deleteById(id);
		return "User deleted";
	}
	
	@PutMapping("/{id}/role")
	public String updateUserRole(@PathVariable String id, @RequestParam String role, Authentication authentication) {
		String adminEmail = authentication.getName();
		User admin = userRepository.findByEmail(adminEmail).orElseThrow();
		User user = userRepository.findById(id).orElseThrow();
		if(!admin.getId().equals(user.getAdminId())) throw new RuntimeException("Unauthorized");
		user.setRole(role);
		userRepository.save(user);
		return "User role updated";
	}

}




