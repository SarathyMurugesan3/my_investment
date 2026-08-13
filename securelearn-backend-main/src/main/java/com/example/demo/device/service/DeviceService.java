package com.example.demo.device.service;

import java.util.ArrayList;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.user.model.DeviceInfo;
import com.example.demo.user.model.User;
import com.example.demo.user.repository.UserRepository;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class DeviceService {

	private final UserRepository userRepository;
	
	@Autowired
	public DeviceService(UserRepository userRepository) {
		this.userRepository = userRepository;
	}
	public void trackDevice(User user,String fingerprint,HttpServletRequest request) {
		if(user == null) {
			throw new RuntimeException("User cannot be null");
		}
		if(user.getDevices() == null) {
			user.setDevices(new ArrayList<>());
		}
		
		String ip = request.getHeader("X-Forwarded-For");
		boolean deviceExists = false;
		
		for(DeviceInfo device : user.getDevices()) {
			if(device.getFingerprint().equals(fingerprint)) {
				device.updateLoginTime();
				deviceExists = true;
				break;
			}
		}
		
		if(!deviceExists) {
			DeviceInfo newDevice = new DeviceInfo(fingerprint,ip);
			user.getDevices().add(newDevice);
			if(user.getDevices().size()>3) {
				user.setRiskScore(user.getRiskScore() + 15);
			}
		}
		
		userRepository.save(user);
	}
}



