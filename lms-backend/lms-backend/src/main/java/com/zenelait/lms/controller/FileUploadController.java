package com.zenelait.lms.controller;

import com.zenelait.lms.dto.response.ApiResponse;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.UUID;

@RestController
public class FileUploadController {

    private static final String UPLOAD_DIR = "uploads";

    public FileUploadController() {
        // Create upload directory if it does not exist
        try {
            Files.createDirectories(Paths.get(UPLOAD_DIR));
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize upload folder!", e);
        }
    }

    /**
     * POST /api/student/upload
     * Uploads a single file and returns its URL.
     */
    @PostMapping("/api/student/upload")
    public ResponseEntity<ApiResponse<String>> uploadFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("File is empty"));
        }

        try {
            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            
            // Clean original filename of special characters to avoid URL encoding issues
            String cleanName = originalFilename != null ? originalFilename.replaceAll("[^a-zA-Z0-9.-]", "_") : "file";
            String filename = UUID.randomUUID().toString() + "_" + cleanName;
            Path targetLocation = Paths.get(UPLOAD_DIR).resolve(filename);

            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // Construct the file download URL (relative path)
            String fileDownloadUrl = "/api/public/files/" + filename;

            return ResponseEntity.ok(ApiResponse.ok("File uploaded successfully", fileDownloadUrl));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(ApiResponse.error("Failed to store file: " + e.getMessage()));
        }
    }

    /**
     * GET /api/public/files/{filename:.+}
     * Serves the uploaded file.
     */
    @GetMapping("/api/public/files/{filename:.+}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(UPLOAD_DIR).resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists()) {
                String contentType = "application/octet-stream";
                try {
                    contentType = Files.probeContentType(filePath);
                    if (contentType == null) {
                        contentType = "application/octet-stream";
                    }
                } catch (IOException ex) {
                    // fall back to default content type
                }

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException ex) {
            return ResponseEntity.badRequest().build();
        }
    }
}
