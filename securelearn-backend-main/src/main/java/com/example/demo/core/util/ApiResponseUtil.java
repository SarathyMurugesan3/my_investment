package com.example.demo.core.util;

import java.time.LocalDateTime;
import java.util.Map;

public class ApiResponseUtil {

	public static Map<String,Object> success(String message){
		return Map.of("timestamp",LocalDateTime.now(),
						"status",200,
						"message",message);
		
	}
	public static Map<String,Object> error(String message){
		return Map.of("timestamp",LocalDateTime.now(),
				"status",400,"error",message);
	}
	
	
	
}
