package com.example.aitaes.dto;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
@Data public class AssistantPermissionDTO { @NotNull private Long courseId; private Boolean canViewData; private Boolean canImportData; private Boolean canGrade; private Boolean canViewPortrait; }
