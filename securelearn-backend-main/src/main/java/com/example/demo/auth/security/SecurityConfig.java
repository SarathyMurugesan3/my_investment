package com.example.demo.auth.security;

import java.util.Arrays;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {
	
	private final JwtAuthenticationFilter jwtAuthenticationFilter;

	public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
	    this.jwtAuthenticationFilter = jwtAuthenticationFilter;
	}

	@Bean
	public DaoAuthenticationProvider authenticationProvider(CustomUserDetailsService userDetailsService, PasswordEncoder passwordEncoder) {
		DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
		provider.setPasswordEncoder(passwordEncoder);
		return provider;
	}

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}
	
	@Bean
	public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
		return configuration.getAuthenticationManager();
	}

	/**
	 * Global CORS policy — allows the frontend (any origin during dev/prod) to send
	 * requests with the Authorization header. Without this, the browser's preflight
	 * OPTIONS request fails silently and Axios reports "Request aborted".
	 */
	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration config = new CorsConfiguration();
		config.setAllowedOriginPatterns(List.of(
			    "http://localhost:5173",
			    "https://securelearn-frontend.vercel.app",
			    "*"
			));
		config.setAllowCredentials(true); // Allow all origins (localhost:5173, Vercel, Netlify, etc.)
		config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH","OPTIONS"));
		config.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Device-Fingerprint", "Accept"));
		config.setExposedHeaders(List.of("Authorization"));
		config.setAllowCredentials(true);
		config.setMaxAge(3600L); // Cache preflight for 1 hour

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", config);
		return source;
	}
	
	@Bean
	public SecurityFilterChain filterChain(
	        HttpSecurity http,
	        DaoAuthenticationProvider authenticationProvider,
	        CorsConfigurationSource corsConfigurationSource) throws Exception {

	    http
	        .authenticationProvider(authenticationProvider)
	        .cors(cors -> cors.configurationSource(corsConfigurationSource))
	        .csrf(csrf -> csrf.disable())
	        .sessionManagement(session ->
	                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
	        )
	        .authorizeHttpRequests(auth -> auth
	        		.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
	                .requestMatchers("/api/auth/register", "/api/auth/login", "/api/auth/refresh", "/api/auth/logout").permitAll()
	                .requestMatchers("/api/auth/admin/**").hasAuthority("ADMIN")
	                .requestMatchers("/actuator/**").permitAll()
	                .requestMatchers("/api/admin/**").hasAuthority("ADMIN")
	                .requestMatchers("/api/student/video/**").permitAll()
	                .requestMatchers("/api/student/pdf/{id}").permitAll() 
	                .requestMatchers("/error").permitAll() // Allows Spring Boot to return actual 500 errors instead of masking them as 403
	                .requestMatchers("/api/student/**").hasAnyAuthority("STUDENT","ADMIN")
	                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
	                .requestMatchers("/api/monitor/**").authenticated()
	                .anyRequest().authenticated()
	        )
	        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

	    return http.build();
	}
}
