package com.zenelait.lms.service.admin;

import com.zenelait.lms.dto.request.DepartmentRequest;
import com.zenelait.lms.entity.Admin;
import com.zenelait.lms.entity.Department;
import com.zenelait.lms.exception.BadRequestException;
import com.zenelait.lms.exception.ResourceNotFoundException;
import com.zenelait.lms.repository.AdminRepository;
import com.zenelait.lms.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

@Service
@RequiredArgsConstructor
public class DepartmentService {

	private final DepartmentRepository departmentRepository;
	private final AdminAuthService adminAuthService;

	// ── Get all active departments (used by public registration endpoint) ──
	@Cacheable(value = "activeDepartments")
	public List<Department> getActiveDepartments() {
		List<Department> active = departmentRepository.findByActiveTrue();
		// Fallback: if no active departments found (e.g. due to @Builder.Default bug
		// saving with active=false), fix all existing ones and return them
		if (active.isEmpty()) {
			List<Department> all = departmentRepository.findAll();
			if (!all.isEmpty()) {
				// Auto-fix: activate all existing departments
				all.forEach(d -> d.setActive(true));
				departmentRepository.saveAll(all);
				return all;
			}
		}
		return active;
	}

	public List<Department> getOrgDepartments(Long orgId) {
		List<Department> depts = departmentRepository.findByOrganizationId(orgId);

		return depts.stream().filter(Department::isActive).toList();
	}

	// ── Get all departments (admin view) ─────────────────────────────────
	public List<Department> getAllDepartments() {
		return departmentRepository.findAll();
	}

	// ── Create ────────────────────────────────────────────────────────────
	@CacheEvict(value = "activeDepartments", allEntries = true)
	public Department create(DepartmentRequest req,Admin admin) {
		Long orgId = admin.getOrganizationId();
		List<Department> existingDepts = departmentRepository.findByOrganizationId(orgId);
		String cleanNewName = req.getName().replaceAll("\\s+", "").toLowerCase();
		for (Department d : existingDepts) {
			if (d.getName().replaceAll("\\s+", "").toLowerCase().equals(cleanNewName)) {
				throw new BadRequestException("A department with this name already exists in your organization: " + req.getName());
			}
		}
		
		// NOTE: explicitly set active=true — do NOT rely on @Builder.Default
		// because Lombok's @Builder.Default is ignored when fields are set via builder
		boolean isActive = req.getActive() != null ? req.getActive() : true;
		Department dept = Department.builder().name(req.getName().trim()).description(req.getDescription())
				.active(isActive).build();
		// Force active=true via setter as a safety net
		dept.setOrganizationId(orgId);
		dept.setActive(isActive);
		dept.setOrganizationId(admin.getOrganizationId());
		return departmentRepository.save(dept);
	}

	// ── Update ────────────────────────────────────────────────────────────
	@CacheEvict(value = "activeDepartments", allEntries = true)
	public Department update(Long id, DepartmentRequest req) {
		Department dept = departmentRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Department not found: " + id));

		Long orgId = dept.getOrganizationId();
		String cleanNewName = req.getName().replaceAll("\\s+", "").toLowerCase();
		if (!dept.getName().equalsIgnoreCase(req.getName())) {
			List<Department> existingDepts = departmentRepository.findByOrganizationId(orgId);
			for (Department d : existingDepts) {
				if (!d.getId().equals(id) && d.getName().replaceAll("\\s+", "").toLowerCase().equals(cleanNewName)) {
					throw new BadRequestException("A department with this name already exists in your organization: " + req.getName());
				}
			}
		}

		if (req.getName() != null)
			dept.setName(req.getName().trim());
		if (req.getDescription() != null)
			dept.setDescription(req.getDescription());
		if (req.getActive() != null)
			dept.setActive(req.getActive());

		return departmentRepository.save(dept);
	}

	// ── Toggle active ─────────────────────────────────────────────────────
	@CacheEvict(value = "activeDepartments", allEntries = true)
	public Department toggleActive(Long id, boolean active) {
		Department dept = departmentRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Department not found: " + id));
		dept.setActive(active);
		return departmentRepository.save(dept);
	}

	// ── Delete ────────────────────────────────────────────────────────────
	@CacheEvict(value = "activeDepartments", allEntries = true)
	public void delete(Long id) {
		if (!departmentRepository.existsById(id)) {
			throw new ResourceNotFoundException("Department not found: " + id);
		}
		departmentRepository.deleteById(id);
	}

	// ── Validate a department name (used by auth services) ────────────────
	public void validateDepartmentName(String name) {
		if (name == null || name.isBlank())
			return; // department is optional at registration
		boolean exists = departmentRepository.findByNameIgnoreCase(name).isPresent();
		if (!exists) {
			throw new BadRequestException(
					"Invalid department: \"" + name + "\". Please select a valid department from the list.");
		}
	}

	public String findByDepId(Long id) {
		Department department = departmentRepository.findById(id).orElse(null);
		String name = "";
		if (department != null) {
			name = department.getName();
			return name;
		} else {
			return null;
		}
	}

	public Long findByDepName(String name, Long orgId) {
		Department dept = departmentRepository.findByNameIgnoreCaseAndOrganizationId(name, orgId)
				.orElseThrow(() -> new BadRequestException("Department not found: " + name + " for this organization"));

		return dept.getId();
	}
}
