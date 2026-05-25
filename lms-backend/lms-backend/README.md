# Zenelait LMS – Spring Boot Backend

## Tech Stack
- **Java 17** + **Spring Boot 3.2**
- **Spring Security** + **JWT** (jjwt 0.11.5)
- **Spring Data JPA** + **MySQL 8**
- **Lombok** for boilerplate reduction

---

## Quick Start

### 1. Prerequisites
```
Java 17+
MySQL 8.x running on localhost:3306
Maven 3.8+
```

### 2. Configure Database
Edit `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/zenelait_lms?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD_HERE
```

### 3. Run
```bash
mvn spring-boot:run
# Server starts on http://localhost:8080
```

> Hibernate will auto-create all tables on first run (`ddl-auto=update`).

---

## Database Schema (Auto-created)

| Table | Description |
|-------|-------------|
| `users` | Single table for ALL roles (student/teacher/parent/admin) |
| `courses` | Course catalog with teacher assignment |
| `batches` | Student batch groups per course |
| `batch_students` | Join table: batches ↔ students |
| `assignments` | Assignments created by teachers per course |
| `assignment_submissions` | Student submissions + grades |
| `attendance` | Daily attendance per student per course |
| `fees` | Fee records per student |
| `notifications` | Per-user notification inbox |
| `announcements` | Broadcast messages with role targeting |
| `timetable_slots` | Weekly class schedule |
| `parent_child` | Links parent users to student users |

---

## Authentication Flow

```
1. POST /api/auth/register  →  returns { accessToken, refreshToken, role, ... }
2. All subsequent requests: Authorization: Bearer <accessToken>
3. POST /api/auth/refresh   →  exchange refresh token for new access token
```

**Token lifetimes:**
- Access token: `24 hours`
- Refresh token: `7 days`

---

## API Reference

### 🔓 Public Endpoints (no auth required)

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/auth/register` | Register (student/teacher/parent/admin) |
| POST | `/api/auth/login` | Login – returns JWT tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| GET  | `/actuator/health` | Health check |

#### Register Request Body
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "STUDENT",
  "gender": "Male",
  "phone": "9876543210"
}
```
For **ADMIN** role, also include:
```json
{
  "role": "ADMIN",
  "academyName": "Zenelait Academy",
  "referralId": "ADM-HEAD-001"
}
```

#### Login Request
```json
{ "email": "john@example.com", "password": "password123" }
```

#### Auth Response
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "tokenType": "Bearer",
    "userId": 1,
    "userCode": "STU-2026-001",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "STUDENT"
  }
}
```

---

### 🛡️ Admin Endpoints (`ROLE_ADMIN`)

#### Dashboard
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/admin/stats` | Total students/teachers/parents/courses |

#### User Management
| Method | URL | Body/Params | Description |
|--------|-----|-------------|-------------|
| GET | `/api/admin/users` | `?role=STUDENT\|TEACHER\|PARENT\|ADMIN` | List all users (filterable) |
| GET | `/api/admin/users/{id}` | – | Get user by ID |
| PATCH | `/api/admin/users/{id}/activate` | `{ "active": true/false }` | Enable/disable user |
| DELETE | `/api/admin/users/{id}` | – | Delete user |

#### Course Management
| Method | URL | Body | Description |
|--------|-----|------|-------------|
| GET | `/api/admin/courses` | – | List all courses |
| POST | `/api/admin/courses` | `{ title, description, department, durationHours, teacherId? }` | Create course |
| PUT | `/api/admin/courses/{id}` | `{ title?, description?, department? }` | Update course |
| DELETE | `/api/admin/courses/{id}` | – | Delete course |

#### Batch Management
| Method | URL | Body | Description |
|--------|-----|------|-------------|
| GET | `/api/admin/batches` | – | List all batches |
| POST | `/api/admin/batches` | `{ name, department, startDate, endDate }` | Create batch |
| DELETE | `/api/admin/batches/{id}` | – | Delete batch |

#### Fee Management
| Method | URL | Body | Description |
|--------|-----|------|-------------|
| GET | `/api/admin/fees` | `?status=PENDING\|PAID\|OVERDUE` | List fees |
| POST | `/api/admin/fees` | `{ studentId, amount, dueDate, description? }` | Create fee record |
| PATCH | `/api/admin/fees/{id}/mark-paid` | – | Mark fee as paid |

#### Announcements
| Method | URL | Body | Description |
|--------|-----|------|-------------|
| GET | `/api/admin/announcements` | – | List all announcements |
| POST | `/api/admin/announcements` | `{ title, content, targetRole? }` | Create announcement |
| DELETE | `/api/admin/announcements/{id}` | – | Delete |

---

### 👨‍🎓 Student Endpoints (`ROLE_STUDENT`)

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/student/profile` | Get own profile |
| PUT | `/api/student/profile` | Update name/phone/address |
| GET | `/api/student/courses` | Get enrolled courses |
| GET | `/api/student/assignments` | List assignments (`?courseId=`) |
| POST | `/api/student/assignments/{id}/submit` | Submit assignment `{ content, fileUrl? }` |
| GET | `/api/student/submissions` | My submission history + grades |
| GET | `/api/student/attendance` | Attendance summary (`?courseId=`) |
| GET | `/api/student/fees` | My fee records |
| GET | `/api/student/notifications` | Notification inbox |
| PATCH | `/api/student/notifications/{id}/read` | Mark notification as read |
| GET | `/api/student/announcements` | Announcements for students |

---

### 👨‍🏫 Teacher Endpoints (`ROLE_TEACHER`)

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/teacher/profile` | Get own profile |
| PUT | `/api/teacher/profile` | Update profile |
| GET | `/api/teacher/courses` | My assigned courses |
| GET | `/api/teacher/assignments` | My assignments |
| POST | `/api/teacher/assignments` | Create assignment `{ courseId, title, description, dueDate, maxMarks }` |
| DELETE | `/api/teacher/assignments/{id}` | Delete assignment |
| GET | `/api/teacher/assignments/{id}/submissions` | View submissions for grading |
| PATCH | `/api/teacher/submissions/{id}/grade` | Grade `{ marks, feedback }` |
| POST | `/api/teacher/attendance` | Mark attendance (see body below) |
| GET | `/api/teacher/attendance` | View attendance `?courseId=&date=YYYY-MM-DD` |
| POST | `/api/teacher/announcements` | Post announcement to students |
| GET | `/api/teacher/notifications` | Notification inbox |

**Mark Attendance Body:**
```json
{
  "courseId": 1,
  "date": "2026-03-12",
  "entries": [
    { "studentId": 3, "status": "PRESENT" },
    { "studentId": 4, "status": "ABSENT" },
    { "studentId": 5, "status": "LATE" }
  ]
}
```

---

### 👨‍👩‍👦 Parent Endpoints (`ROLE_PARENT`)

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/parent/profile` | Get own profile |
| PUT | `/api/parent/profile` | Update profile |
| GET | `/api/parent/children` | List linked children |
| POST | `/api/parent/children/link` | Link child `{ "studentCode": "STU-2026-001" }` |
| GET | `/api/parent/children/{childId}/fees` | Child's fee records |
| GET | `/api/parent/children/{childId}/attendance` | Child's attendance `?courseId=` |
| GET | `/api/parent/announcements` | Announcements for parents |
| GET | `/api/parent/notifications` | Notification inbox |

---

## Project Structure

```
src/main/java/com/zenelait/lms/
├── LmsApplication.java
├── config/
│   └── SecurityConfig.java          # CORS, route protection, JWT filter chain
├── controller/
│   ├── AuthController.java          # /api/auth/**
│   ├── AdminController.java         # /api/admin/**
│   ├── StudentController.java       # /api/student/**
│   ├── TeacherController.java       # /api/teacher/**
│   └── ParentController.java        # /api/parent/**
├── dto/
│   ├── request/
│   │   ├── RegisterRequest.java
│   │   └── LoginRequest.java
│   └── response/
│       ├── ApiResponse.java         # Generic wrapper { success, message, data }
│       ├── AuthResponse.java
│       └── UserResponse.java
├── entity/
│   ├── User.java                    # implements UserDetails
│   ├── Role.java                    # STUDENT | TEACHER | PARENT | ADMIN
│   ├── Course.java
│   ├── Batch.java
│   ├── Assignment.java
│   ├── AssignmentSubmission.java
│   ├── Attendance.java
│   ├── Fee.java
│   ├── Notification.java
│   ├── Announcement.java
│   ├── TimetableSlot.java
│   └── ParentChild.java
├── exception/
│   ├── BadRequestException.java
│   ├── ResourceNotFoundException.java
│   └── GlobalExceptionHandler.java
├── repository/          # JpaRepository for every entity
├── security/
│   ├── JwtUtils.java                # Token generate/validate/parse
│   └── JwtAuthFilter.java           # OncePerRequestFilter
└── service/impl/
    ├── AuthService.java             # Register + Login + Refresh
    └── UserDetailsServiceImpl.java
```

---

## Connecting to the React Frontend

In your React app, make API calls like this:

```javascript
// Login
const res = await fetch('http://localhost:8080/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { data } = await res.json();
localStorage.setItem('token', data.accessToken);
localStorage.setItem('role', data.role);

// Authenticated request
const token = localStorage.getItem('token');
const courses = await fetch('http://localhost:8080/api/student/courses', {
  headers: { Authorization: `Bearer ${token}` }
});
```

Use `data.role` to route the user to the correct dashboard:  
`STUDENT → StudentDashboard`, `TEACHER → TeacherDashboard`, etc.

---

## Security Summary

| Layer | Implementation |
|-------|---------------|
| Password storage | BCrypt (strength 10) |
| Token type | JWT HS256 signed |
| Access token TTL | 24 hours |
| Refresh token TTL | 7 days |
| Role enforcement | Spring `@PreAuthorize` per controller |
| CORS | Configured for localhost:3000 and :5173 |
| Session | Stateless (no server-side session) |

---

## What's Not Included Yet (Payment Gateway)
- `Payment` entity and `PaymentController` – to be added later
- Fee records are pre-created by admin and manually marked as paid for now
