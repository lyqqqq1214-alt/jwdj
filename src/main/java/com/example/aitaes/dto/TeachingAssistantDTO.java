package com.example.aitaes.dto;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
@Data public class TeachingAssistantDTO { @NotBlank private String username; @NotBlank private String name; @NotBlank private String password; }
