package com.zenelait.lms.service.ultrasuperadmin;

import com.zenelait.lms.dto.request.AdminRegisterRequest;
import com.zenelait.lms.dto.request.OrganizationRequest;
import com.zenelait.lms.dto.request.SuperAdminCreateRequest;
import com.zenelait.lms.entity.Admin;
import com.zenelait.lms.entity.Organization;
import com.zenelait.lms.entity.Parent;
import com.zenelait.lms.entity.Student;
import com.zenelait.lms.entity.Teacher;
import com.zenelait.lms.exception.BadRequestException;
import com.zenelait.lms.exception.ResourceNotFoundException;
import com.zenelait.lms.repository.AdminRepository;
import com.zenelait.lms.repository.OrganizationRepository;
import com.zenelait.lms.repository.StudentRepository;
import com.zenelait.lms.repository.TeacherRepository;
import com.zenelait.lms.repository.ParentRepository;
import com.zenelait.lms.entity.Feature;
import com.zenelait.lms.repository.FeatureRepository;
import com.zenelait.lms.dto.request.FeatureRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;

import java.time.Year;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UltraSuperAdminService {

    private final OrganizationRepository orgRepository;
    private final AdminRepository        adminRepository;
    private final StudentRepository      studentRepository;
    private final TeacherRepository      teacherRepository;
    private final ParentRepository       parentRepository;
    private final PasswordEncoder        passwordEncoder;
    private final FeatureRepository      featureRepository;

    // ══════════════════════════════════════════════════════════════════════════
    // ORGANIZATION  management
    // ══════════════════════════════════════════════════════════════════════════

    @CacheEvict(value = "activeOrganizations", allEntries = true)
    public Organization createOrganization(OrganizationRequest req) {
        if (orgRepository.existsByEmail(req.getEmail())) {
            throw new BadRequestException("An organization with this email already exists.");
        }

        List<Feature> activeFeatures = featureRepository.findAll().stream()
                .filter(Feature::isActive)
                .collect(Collectors.toList());

        Organization org = Organization.builder()
                .orgCode(generateOrgCode())
                .name(req.getName())
                .email(req.getEmail())
                .phone(req.getPhone())
                .address(req.getAddress())
                .city(req.getCity())
                .country(req.getCountry())
                .description(req.getDescription())
                .features(new HashSet<>(activeFeatures))
                .active(true)
                .build();

        return orgRepository.save(org);
    }

    @Cacheable(value = "activeOrganizations")
    public List<Organization> getActiveOrganizations() {
        return orgRepository.findByActiveTrue();
    }

    public List<Organization> getAllOrganizations() {
        return orgRepository.findAll();
    }

    public Organization getOrganizationById(Long id) {
        return orgRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found: " + id));
    }

    @CacheEvict(value = "activeOrganizations", allEntries = true)
    public Organization updateOrganization(Long id, OrganizationRequest req) {
        Organization org = getOrganizationById(id);
        org.setName(req.getName());
        org.setPhone(req.getPhone());
        org.setAddress(req.getAddress());
        org.setCity(req.getCity());
        org.setCountry(req.getCountry());
        org.setDescription(req.getDescription());
        return orgRepository.save(org);
    }

    @CacheEvict(value = {"activeOrganizations", "orgFeatures"}, allEntries = true)
    public void toggleOrganizationActive(Long id) {
        Organization org = getOrganizationById(id);
        org.setActive(!org.isActive());
        orgRepository.save(org);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SUPER ADMIN  management
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Ultra Super Admin creates a Super Admin and assigns them to an org.
     * The Super Admin acts as the referral gate for regular Admin registration.
     */
    public Admin createSuperAdmin(SuperAdminCreateRequest req) {
        if (adminRepository.existsByEmail(req.getEmail())) {
            throw new BadRequestException("Email already registered: " + req.getEmail());
        }

        Organization org = orgRepository.findById(req.getOrganizationId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Organization not found: " + req.getOrganizationId()));

        if (!org.isActive()) {
            throw new BadRequestException("Cannot assign admin to an inactive organization.");
        }

        List<Admin> superAdmins = adminRepository.findByOrganizationIdAndSuperAdminTrue(org.getId());
        if (!superAdmins.isEmpty()) {
            throw new BadRequestException("This organization already has a Super Admin.");
        }

        String generatedAdminUserId=generateAdminUserId();

        Admin superAdmin = Admin.builder()
                .userId(generatedAdminUserId)
                .referralId(generatedAdminUserId) 
                .name(req.getName())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .gender(req.getGender())
                .phone(req.getPhone())
                .academyName(req.getAcademyName() != null ? req.getAcademyName() : org.getName())
                .organizationId(org.getId())
                .superAdmin(true)
                .active(true)
                .build();

        return adminRepository.save(superAdmin);
    }

    public List<Admin> getAllSuperAdmins() {
        return adminRepository.findBySuperAdminTrue();
    }

    public List<Admin> getSuperAdminsByOrg(Long orgId) {
        return adminRepository.findByOrganizationIdAndSuperAdminTrue(orgId);
    }

    public void toggleAdminActive(Long adminId) {
        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin not found: " + adminId));
        admin.setActive(!admin.isActive());
        adminRepository.save(admin);
    }
    
    
    
    public List<Student> getOrganizationWiseStudents(Long orgId) {
    	return studentRepository.findByOrganizationId(orgId);
    }
    
    public List<Teacher> getOrganizationWiseTeachers(Long orgId){
    	return teacherRepository.findByOrganizationId(orgId);
    }
    
    public List<Parent> getOrganizationWiseParents(Long orgId){
    	return parentRepository.findByOrganizationId(orgId);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PLATFORM STATS  (cross-org)
    // ══════════════════════════════════════════════════════════════════════════

    public Map<String, Object> getPlatformStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalOrganizations",  orgRepository.count());
        stats.put("activeOrganizations", orgRepository.findByActiveTrue().size());
        stats.put("totalSuperAdmins",    adminRepository.findBySuperAdminTrue().size());
        stats.put("totalAdmins",         adminRepository.findBySuperAdminFalse().size());
        stats.put("totalStudents",       studentRepository.count());
        stats.put("totalTeachers",       teacherRepository.count());
        stats.put("totalParents",        parentRepository.count());
        return stats;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Helpers
    // ══════════════════════════════════════════════════════════════════════════

    private String generateOrgCode() {
        String prefix = String.format("ORG-%d-", Year.now().getValue());
        return orgRepository.findLastOrgCodeByPrefix(prefix)
                .map(last -> {
                    int next = Integer.parseInt(last.substring(prefix.length())) + 1;
                    return String.format("ORG-%d-%03d", Year.now().getValue(), next);
                })
                .orElse(prefix + "001");
    }

    private String generateAdminUserId() {
        String prefix = String.format("ADM-%d-", Year.now().getValue());
        return adminRepository.findLastUserIdByPrefix(prefix)
                .map(last -> {
                    int next = Integer.parseInt(last.substring(prefix.length())) + 1;
                    return String.format("ADM-%d-%03d", Year.now().getValue(), next);
                })
                .orElse(prefix + "001");
    }

    // ══════════════════════════════════════════════════════════════════════════
    // FEATURE  management
    // ══════════════════════════════════════════════════════════════════════════

    public List<Feature> getAllFeatures() {
        return featureRepository.findAll();
    }

    public Feature createFeature(FeatureRequest req) {
        String key = req.getFeatureKey().trim().toUpperCase().replaceAll("\\s+", "_");
        if (featureRepository.existsByFeatureKey(key)) {
            throw new BadRequestException("Feature with key " + key + " already exists.");
        }
        if (featureRepository.existsByName(req.getName())) {
            throw new BadRequestException("Feature with name " + req.getName() + " already exists.");
        }

        Feature f = Feature.builder()
                .name(req.getName())
                .featureKey(key)
                .description(req.getDescription())
                .active(true)
                .build();

        return featureRepository.save(f);
    }

    public Feature toggleFeatureActive(Long featureId) {
        Feature f = featureRepository.findById(featureId)
                .orElseThrow(() -> new ResourceNotFoundException("Feature not found: " + featureId));
        f.setActive(!f.isActive());
        return featureRepository.save(f);
    }

    @Cacheable(value = "orgFeatures", key = "#orgId")
    public Set<Feature> getOrganizationFeatures(Long orgId) {
        Organization org = orgRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found: " + orgId));
        return org.getFeatures();
    }

    @CacheEvict(value = "orgFeatures", key = "#orgId")
    public void toggleOrganizationFeature(Long orgId, Long featureId) {
        Organization org = orgRepository.findById(orgId)
                .orElseThrow(() -> new ResourceNotFoundException("Organization not found: " + orgId));
        Feature f = featureRepository.findById(featureId)
                .orElseThrow(() -> new ResourceNotFoundException("Feature not found: " + featureId));

        if (org.getFeatures().contains(f)) {
            org.getFeatures().remove(f);
        } else {
            org.getFeatures().add(f);
        }
        orgRepository.save(org);
    }
}
