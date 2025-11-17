package com.tms.timesheet_management.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tms.timesheet_management.dto.DepartmentAdminDTO;
import com.tms.timesheet_management.dto.UserAdminDTO;
import com.tms.timesheet_management.dto.UserResponseDTO;
import com.tms.timesheet_management.exception.BadRequestException;
import com.tms.timesheet_management.exception.NotFoundException;
import com.tms.timesheet_management.model.Department;
import com.tms.timesheet_management.model.Role;
import com.tms.timesheet_management.model.User;
import com.tms.timesheet_management.repository.DepartmentRepository;
import com.tms.timesheet_management.repository.RoleRepository;
import com.tms.timesheet_management.repository.UserRepository;

@Service
public class AdminService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // ========================
    // Create First Admin on startup
    // ========================
    @Transactional
    public void createFirstAdmin() {
        String adminEmail = "admin@test.com";
        if (userRepository.findByEmail(adminEmail).isPresent()) return;

        User admin = new User();
        admin.setName("Super Admin");
        admin.setEmail(adminEmail);
        admin.setPassword(passwordEncoder.encode("admin123"));
    Role adminRole = roleRepository.findByName("ROLE_ADMIN")
        .orElseThrow(() -> new NotFoundException("ROLE_ADMIN not found"));
        admin.setRole(adminRole);
        admin.setDepartment(null);
        userRepository.save(admin);
    }

    // ========================
    // USER MANAGEMENT
    // ========================
    @Transactional
    public UserResponseDTO createUser(UserAdminDTO dto) {
        if (userRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new BadRequestException("User with email already exists");
        }

    Role role = roleRepository.findById(dto.getRoleId())
        .orElseThrow(() -> new NotFoundException("Role not found"));

    Department dept = null;
    if (dto.getDepartmentId() != null) {
        dept = departmentRepository.findById(dto.getDepartmentId())
            .orElseThrow(() -> new NotFoundException("Department not found"));
    }

        User user = new User();
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setRole(role);
    user.setDepartment(dept);
        user.setPhoneNumber(dto.getPhoneNumber());
        user.setActive(dto.isActive());

        User savedUser = userRepository.save(user);

        // Assign manager automatically if role is manager and department provided
        if ("ROLE_MANAGER".equals(role.getName()) && dept != null) {
            dept.setManager(savedUser);
            departmentRepository.save(dept);
        }

        return mapToResponse(savedUser);
    }

    public List<UserResponseDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public UserResponseDTO getUserById(Long id) {
    User user = userRepository.findById(id)
        .orElseThrow(() -> new NotFoundException("User not found"));
        return mapToResponse(user);
    }

    @Transactional
    public UserResponseDTO updateUser(Long id, UserAdminDTO dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (dto.getName() != null) user.setName(dto.getName());
        if (dto.getEmail() != null) user.setEmail(dto.getEmail());
        if (dto.getPassword() != null) user.setPassword(passwordEncoder.encode(dto.getPassword()));
        if (dto.getPhoneNumber() != null) user.setPhoneNumber(dto.getPhoneNumber());
        user.setActive(dto.isActive());

        Department oldDept = user.getDepartment();

        // Role change
        boolean roleChanged = false;
        if (dto.getRoleId() != null) {
        Role role = roleRepository.findById(dto.getRoleId())
            .orElseThrow(() -> new NotFoundException("Role not found"));
            user.setRole(role);
            roleChanged = true;
        }

        // Department change
        Department newDept = null;
        if (dto.getDepartmentId() != null) {
        newDept = departmentRepository.findById(dto.getDepartmentId())
            .orElseThrow(() -> new NotFoundException("Department not found"));
            user.setDepartment(newDept);
        }

        // If user became a manager (either role changed to manager or already manager)
        boolean isNowManager = user.getRole() != null && "ROLE_MANAGER".equals(user.getRole().getName());

        if (isNowManager) {
            // If department changed, set new department's manager
            if (newDept != null) {
                newDept.setManager(user);
                departmentRepository.save(newDept);
                // clear old dept manager if the user was manager there and moved
                if (oldDept != null && !oldDept.getId().equals(newDept.getId())) {
                    if (oldDept.getManager() != null && oldDept.getManager().getId().equals(user.getId())) {
                        oldDept.setManager(null);
                        departmentRepository.save(oldDept);
                    }
                }
            } else if (roleChanged && oldDept != null) {
                // Role changed to manager but department didn't; keep user's existing department and set manager
                oldDept.setManager(user);
                departmentRepository.save(oldDept);
            }
        } else if (roleChanged) {
            // User role changed away from manager -> clear manager on oldDept if this user was manager
            if (oldDept != null && oldDept.getManager() != null && oldDept.getManager().getId().equals(user.getId())) {
                oldDept.setManager(null);
                departmentRepository.save(oldDept);
            }
        }

        User saved = userRepository.save(user);
        return mapToResponse(saved);
    }

    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new NotFoundException("User not found");
        }
        // If the user is a manager of any departments, clear those manager references first
        List<Department> managed = departmentRepository.findByManager_Id(id);
        if (managed != null && !managed.isEmpty()) {
            for (Department d : managed) {
                d.setManager(null);
                departmentRepository.save(d);
            }
        }

        userRepository.deleteById(id);
    }

    // ========================
    // DEPARTMENT MANAGEMENT
    // ========================
    @Transactional
    public Department createDepartment(DepartmentAdminDTO dto) {
        if (departmentRepository.findByName(dto.getName()).isPresent()) {
            throw new BadRequestException("Department already exists");
        }

        Department dept = new Department();
        dept.setName(dto.getName());
        dept.setDescription(dto.getDescription());

        // First save department so it has an id
        Department saved = departmentRepository.save(dept);

        // If admin provided a managerId, assign the user as manager and keep consistency
        if (dto.getManagerId() != null) {
        User manager = userRepository.findById(dto.getManagerId())
            .orElseThrow(() -> new NotFoundException("Manager user not found"));

            // Demote any existing manager on this department (if different)
            if (saved.getManager() != null && !saved.getManager().getId().equals(manager.getId())) {
                User previous = saved.getManager();
        Role empRole = roleRepository.findByName("ROLE_EMPLOYEE")
            .orElseThrow(() -> new NotFoundException("ROLE_EMPLOYEE not found"));
                previous.setRole(empRole);
                userRepository.save(previous);
            }

            // If this user was manager of other departments, clear those references
            List<Department> other = departmentRepository.findByManager_Id(manager.getId());
            for (Department oldDept : other) {
                if (!oldDept.getId().equals(saved.getId())) {
                    oldDept.setManager(null);
                    departmentRepository.save(oldDept);
                }
            }

            // Ensure manager's department points to this department and set role to manager
        Role mgrRole = roleRepository.findByName("ROLE_MANAGER")
            .orElseThrow(() -> new NotFoundException("ROLE_MANAGER not found"));
            manager.setRole(mgrRole);
            manager.setDepartment(saved);
            userRepository.save(manager);

            // Set manager on department and save
            saved.setManager(manager);
            saved = departmentRepository.save(saved);
        }

        return saved;
    }

    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    public Department getDepartmentById(Long id) {
    return departmentRepository.findById(id)
        .orElseThrow(() -> new NotFoundException("Department not found"));
    }

    @Transactional
    public Department updateDepartment(Long id, DepartmentAdminDTO dto) {
        Department dept = getDepartmentById(id);
        if (dto.getName() != null) dept.setName(dto.getName());
        if (dto.getDescription() != null) dept.setDescription(dto.getDescription());
        Department saved = departmentRepository.save(dept);

        // Manager assignment logic
        if (dto.getManagerId() != null) {
            Long managerId = dto.getManagerId();
        User manager = userRepository.findById(managerId)
            .orElseThrow(() -> new NotFoundException("Manager user not found"));

            // Demote previous manager if different
            if (saved.getManager() != null && !saved.getManager().getId().equals(manager.getId())) {
                User previous = saved.getManager();
        Role empRole = roleRepository.findByName("ROLE_EMPLOYEE")
            .orElseThrow(() -> new NotFoundException("ROLE_EMPLOYEE not found"));
                previous.setRole(empRole);
                userRepository.save(previous);
            }

            // Clear other departments managed by this user
            List<Department> other = departmentRepository.findByManager_Id(manager.getId());
            for (Department oldDept : other) {
                if (!oldDept.getId().equals(saved.getId())) {
                    oldDept.setManager(null);
                    departmentRepository.save(oldDept);
                }
            }

            // Assign manager role and department
        Role mgrRole = roleRepository.findByName("ROLE_MANAGER")
            .orElseThrow(() -> new NotFoundException("ROLE_MANAGER not found"));
            manager.setRole(mgrRole);
            manager.setDepartment(saved);
            userRepository.save(manager);

            saved.setManager(manager);
            saved = departmentRepository.save(saved);
        } else if (dto.getManagerId() == null && dept.getManager() != null) {
            // Explicitly clearing manager via PUT (managerId == null)
            User previous = dept.getManager();
            dept.setManager(null);
            saved = departmentRepository.save(dept);
            // Demote previous manager to employee
            Role empRole = roleRepository.findByName("ROLE_EMPLOYEE")
                    .orElseThrow(() -> new RuntimeException("ROLE_EMPLOYEE not found"));
            previous.setRole(empRole);
            userRepository.save(previous);
        }

        return saved;
    }

    @Transactional
    public void deleteDepartment(Long id) {
        if (!departmentRepository.existsById(id)) {
            throw new NotFoundException("Department not found");
        }
        // Fetch users in this department and clear their department and set role to EMPLOYEE
        List<User> users = userRepository.findAllByDepartment_Id(id);
    Role empRole = roleRepository.findByName("ROLE_EMPLOYEE")
        .orElseThrow(() -> new NotFoundException("ROLE_EMPLOYEE not found"));
        if (users != null) {
            for (User u : users) {
                u.setDepartment(null);
                u.setRole(empRole);
                userRepository.save(u);
            }
        }

        // Clear manager references on this department before deletion
        Department dept = departmentRepository.findById(id).orElseThrow(() -> new RuntimeException("Department not found"));
        if (dept.getManager() != null) {
            dept.setManager(null);
            departmentRepository.save(dept);
        }

        departmentRepository.deleteById(id);
    }

    // ========================
    // MAPPING USER -> RESPONSE DTO
    // ========================
    private UserResponseDTO mapToResponse(User user) {
        return new UserResponseDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.isActive(),
                user.getRole() != null ? user.getRole().getName() : null,
                user.getDepartment() != null ? user.getDepartment().getId() : null,
                user.getDepartment() != null ? user.getDepartment().getName() : null
        );
    }
}
