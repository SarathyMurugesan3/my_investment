

package com.secureedtech.gateway.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;

@Component
public class JwtUtil{

    private final String SECRET = "mySuperSecretKeyForJwtTokenSecureEdtech123456";

    private Key getSigningKey(){
        return Keys.hmacShaKeyFor(SECRET.getBytes());
    }

    public String extractUsername(String token){
        return getClaims(token).getSubject();
    }
    public boolean validateToken(String token){
        try {
            getClaims(token);
            return true;
        }catch(Exception e){
            return false;
        }
    }
    private Claims getClaims(String token){
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

}