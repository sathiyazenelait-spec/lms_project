# Zenelait InfoTech LMS — Frontend (Clean Component Structure)

## 🗂 Project Structure

```
src/
├── App.jsx                          ← Root router (public/login/student/teacher/admin/parent)
├── index.js                         ← React entry point
│
├── assets/styles/
│   ├── theme.js                     ← All colors (T.primary, T.accent, ROLE_COLORS...)
│   └── GlobalStyle.jsx              ← CSS animations & global font imports
│
├── components/
│   ├── UI/index.jsx                 ← ALL reusable UI atoms:
│   │                                   Btn, Card, Input, Select, Badge, Avatar,
│   │                                   ProgressBar, StatCard, Table, Tabs, Modal,
│   │                                   DonutChart, MiniBarChart, PageHeader, ProfileAlert
│   │
│   └── Layout/index.jsx             ← Dashboard layout components:
│                                       Sidebar (with SIDEBARS config for all roles),
│                                       DashHeader, DashLayout
│
└── pages/
    ├── Public/index.jsx             ← Public website:
    │                                   PublicWebsite (default export) = Navbar + pages + Footer
    │                                   Home, About, Academics, Achievements,
    │                                   Members, Gallery, Contact (all named exports)
    │
    ├── Auth/LoginPage.jsx           ← Login page:
    │                                   4 parallel animated cards (Student/Teacher/Parent/Admin)
    │                                   Hover = zoom in selected, zoom out others
    │                                   Email + password login
    │                                   Registration modals per role
    │
    ├── Student/index.jsx            ← Student dashboard (default export = StudentDashboard):
    │                                   StudentOverview, StudentProfile, StudentCourses,
    │                                   LearningBoard, StudentSchedule, StudentTasks,
    │                                   StudentPerformance, StudentForum, StudentNotifications
    │
    ├── Admin/index.jsx              ← Admin dashboard (default export = AdminDashboard):
    │                                   AdminOverview, AdminProfile, AdminUsers,
    │                                   AdminCourses, AdminBatches, AdminTimetable,
    │                                   AdminFees, AdminPayments, AdminRevenue,
    │                                   AdminStaff, AdminCertifications, AdminQueries,
    │                                   AdminNotifications, AdminMeetings
    │
    └── TeacherParent/index.jsx      ← Teacher + Parent dashboards:
                                        TeacherDashboard (named export), ParentDashboard (named export)
                                        Teacher: Overview, Profile, Courses, LiveClasses,
                                                 Attendance, Grading, Performance, Messages,
                                                 Announcements, Certifications, Notifications
                                        Parent:  Overview, Profile, Children, Tracking,
                                                 Results, Fees, Messages, Notifications
```

## 🚀 How to Run

```bash
npm install
npm start
# Opens at http://localhost:3000
```

## 🔗 Navigation Flow

```
Public Website  ──[Login button]──→  Login Page
                                         │
                    ┌────────────────────┼────────────────────┐
                    ↓                    ↓                    ↓                    ↓
              Student Dash         Teacher Dash          Admin Dash          Parent Dash
              (Ananya Reddy)    (Prof. Priya Sharma)  (Zenelait Admin)    (Rajesh Kumar)
```

## 📄 Key Features by Page

### Public Website
- **Home**: Hero, Features grid, Stats banner
- **About**: Mission, Vision, key stats
- **Academics**: 6 course cards with pricing
- **Achievements**: 6 award cards
- **Members**: Leadership + Faculty grid
- **Gallery**: 12 emoji-placeholder cards
- **Contact**: Form → stored in DB → shows in Admin Queries

### Login Page
- 4 role cards in parallel row
- **Hover animation**: hovered card expands (flex 2.4), others shrink (0.55)
- Login form appears inside zoomed card
- Register modal per role (Admin requires Referral ID)

### Student Dashboard (9 pages)
- Overview with stats, active courses, schedule, attendance donut, performance chart
- Profile with completion % donut + form
- My Courses with tab filter
- **Learning Board**: Videos (done/current/locked) + Notes download
- Schedules with mini calendar
- Tasks (Pending/Submitted/Results tabs)
- Performance with leaderboard + grade by subject
- Forum discussions with teachers
- Notifications

### Admin Dashboard (14 pages)
- Full CRUD: Students, Teachers, Parents (delete/edit/manage)
- Course creation with teacher assignment
- Batch management
- Visual timetable grid
- Fee setup + payment tracking
- Revenue charts + **PDF download**
- Staff performance monitoring
- Certification management
- **Contact Queries** (from public contact form DB)
- Meeting scheduler

### Teacher Dashboard (11 pages)
- Course content upload (drag & drop)
- Live class scheduling (Google Meet/Zoom)
- Attendance marking
- Test grading with score inputs
- Student messaging + parent messaging
- Announcements to students
- Certificate issuance

### Parent Dashboard (8 pages)
- Children profiles with stats
- Course + attendance tracking
- Assignment results/grades
- Fee payments (Razorpay integration ready)
- Direct teacher messaging

## 🎨 Theme
All colors defined in `src/assets/styles/theme.js`:
- Background: `#06040F` (deep dark)
- Primary: `#7C3AED` (purple)
- Accent: `#06B6D4` (cyan)
- Green: `#10B981`, Red: `#EF4444`, Yellow: `#F59E0B`
- Fonts: Syne (headings) + DM Sans (body)
