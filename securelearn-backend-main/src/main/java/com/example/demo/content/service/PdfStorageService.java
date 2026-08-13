package com.example.demo.content.service;

import java.io.File;
import java.io.IOException;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;

@Service
public class PdfStorageService {

	
	@Value("${securelearn.storage.pdf-path:/tmp/pdf/}")
	private String storagePath;
	
	@PostConstruct
	public void init() {
		File folder = new File(storagePath);
		if(!folder.exists()) {
			folder.mkdirs();
		}
	}
	
	
	public String store(MultipartFile file) throws IOException{
		String uniqueName = UUID.randomUUID()+"_"+file.getOriginalFilename();
		
		File destination = new File(storagePath +"/"+ uniqueName);
		file.transferTo(destination);
		return destination.getAbsolutePath();
	}
	
	
	
}
