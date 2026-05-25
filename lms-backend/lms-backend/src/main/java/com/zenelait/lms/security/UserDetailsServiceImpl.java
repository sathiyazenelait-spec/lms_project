package com.zenelait.lms.security;

import com.zenelait.lms.repository.AdminRepository;
import com.zenelait.lms.repository.ParentRepository;
import com.zenelait.lms.repository.StudentRepository;
import com.zenelait.lms.repository.TeacherRepository;
import com.zenelait.lms.repository.UltraSuperAdminRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Used ONLY by the JWT filter to reload the principal from the token.
 * It searches all four tables because the token only carries the email —
 * there is no ambiguity at this point because each table guarantees unique emails,
 * and a given email can only exist in one table.
 *
 * Login validation (role isolation) is handled separately by each *AuthService.
 */
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {
	private final UltraSuperAdminRepository usaRepository;
    private final AdminRepository   adminRepository;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final ParentRepository  parentRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
    	
    	var usa = usaRepository.findByEmail(email);
        if (usa.isPresent()) return usa.get();

        // Admin
        var admin = adminRepository.findByEmail(email);
        if (admin.isPresent()) return admin.get();

        // Student
        var student = studentRepository.findByEmail(email);
        if (student.isPresent()) return student.get();

        // Teacher
        var teacher = teacherRepository.findByEmail(email);
        if (teacher.isPresent()) return teacher.get();

        // Parent
        var parent = parentRepository.findByEmail(email);
        if (parent.isPresent()) return parent.get();

        throw new UsernameNotFoundException("No account found for email: " + email);
    }
}
