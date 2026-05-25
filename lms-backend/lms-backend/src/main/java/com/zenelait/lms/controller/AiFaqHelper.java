package com.zenelait.lms.controller;

public class AiFaqHelper {

    public static String getStudentResponse(String msg) {
        msg = msg.toLowerCase();
        if (msg.contains("password") || msg.contains("login") || msg.contains("sign in") || msg.contains("account") || msg.contains("locked")) return "🔑 **Authentication**: Use the 'Forgot Password' link on the login page or contact Admin.";
        if (msg.contains("syllabus") || msg.contains("curriculum") || msg.contains("topics")) return "📖 **Syllabus**: Your course syllabus is available in the 'Overview' tab of the Learning Board.";
        if (msg.contains("holiday") || msg.contains("vacation") || msg.contains("break")) return "🏖️ **Holidays**: The academic calendar on your dashboard shows all upcoming holidays.";
        if (msg.contains("message") || msg.contains("chat") || msg.contains("contact teacher")) return "💬 **Communication**: Use the in-app messaging system to contact your instructors.";
        if (msg.contains("deadline") || msg.contains("due date") || msg.contains("late")) return "⏰ **Deadlines**: Assignments submitted after the due date may incur a penalty.";
        if (msg.contains("enroll") || msg.contains("join course") || msg.contains("register")) return "📝 **Enrollment**: Browse available courses in 'My Courses' and click 'Enroll Now'.";
        if (msg.contains("drop") || msg.contains("cancel course") || msg.contains("leave")) return "❌ **Drop Course**: You must submit a formal request to the Admin to drop an active course.";
        if (msg.contains("grade") || msg.contains("marks") || msg.contains("score") || msg.contains("result")) return "📊 **Grades**: Grades are published in the 'My Performance' tab once the teacher approves them.";
        if (msg.contains("download") || msg.contains("offline") || msg.contains("save")) return "📥 **Downloads**: PDFs and resources can be downloaded for offline viewing.";
        if (msg.contains("video") || msg.contains("player") || msg.contains("buffering")) return "🎥 **Video Issues**: Ensure you have a stable connection. Videos are streamed in adaptive quality.";
        if (msg.contains("profile") || msg.contains("avatar") || msg.contains("picture")) return "🖼️ **Profile**: Update your avatar and bio in 'Profile Settings'.";
        if (msg.contains("notification") || msg.contains("alert") || msg.contains("email")) return "🔔 **Notifications**: Manage your email and SMS alerts in Account Preferences.";
        if (msg.contains("refund") || msg.contains("money back")) return "💳 **Refunds**: Refund requests are processed by the Finance department within 7 days.";
        if (msg.contains("forum") || msg.contains("discussion") || msg.contains("post")) return "🗨️ **Forum**: Be respectful in course forums. Moderators actively monitor discussions.";
        if (msg.contains("pass") || msg.contains("fail") || msg.contains("minimum")) return "🎯 **Passing**: The minimum passing grade for most modules is 40%.";
        if (msg.contains("textbook") || msg.contains("book") || msg.contains("reading")) return "📚 **Books**: Required reading materials are listed under 'References'.";
        if (msg.contains("library") || msg.contains("resources") || msg.contains("ebooks")) return "🏛️ **Library**: Access the digital library via the sidebar for e-books and journals.";
        if (msg.contains("internship") || msg.contains("job") || msg.contains("career")) return "💼 **Careers**: Career opportunities and internships are posted on the Notice Board.";
        if (msg.contains("error") || msg.contains("bug") || msg.contains("glitch")) return "🐛 **Tech Support**: Report bugs using the 'Help & Support' widget.";
        if (msg.contains("certificate") || msg.contains("completion") || msg.contains("diploma")) return "📜 **Certificates**: Certificates are auto-generated upon achieving 100% course completion.";
        if (msg.contains("assignment") || msg.contains("homework") || msg.contains("task")) return "📋 **Assignments**: Submit your homework in PDF or DOCX format via the 'Submissions' tab.";
        if (msg.contains("quiz") || msg.contains("test") || msg.contains("exam") || msg.contains("mcq")) return "📝 **Quizzes**: Quizzes are timed. Ensure a stable connection before starting.";
        if (msg.contains("attendance") || msg.contains("present") || msg.contains("absent")) return "🙋 **Attendance**: Minimum 75% attendance is required to sit for final exams.";
        if (msg.contains("live class") || msg.contains("zoom") || msg.contains("meet")) return "🎥 **Live Classes**: Join live sessions directly from the Course Timetable.";
        if (msg.contains("feedback") || msg.contains("review") || msg.contains("rating")) return "⭐ **Feedback**: You can rate your teachers after completing 50% of the course.";
        if (msg.contains("schedule") || msg.contains("timetable") || msg.contains("routine")) return "📅 **Schedule**: Your daily class routine is available in the 'Timetable' section.";
        if (msg.contains("payment") || msg.contains("fee") || msg.contains("invoice")) return "💵 **Payments**: Pay your tuition fees securely via the 'Fees' dashboard.";
        if (msg.contains("scholarship") || msg.contains("financial aid")) return "🎓 **Scholarships**: Apply for merit-based scholarships during the Fall enrollment window.";
        if (msg.contains("transcript") || msg.contains("record")) return "📄 **Transcripts**: Official transcripts can be requested from the Admin office.";
        if (msg.contains("club") || msg.contains("extracurricular")) return "⚽ **Clubs**: Join student clubs via the 'Activities' portal.";
        if (msg.contains("wifi") || msg.contains("internet") || msg.contains("network")) return "📶 **Campus Wi-Fi**: Use your Student ID to log in to the campus network.";
        if (msg.contains("lost") || msg.contains("found")) return "🔍 **Lost & Found**: Check with the main reception for lost items.";
        if (msg.contains("counseling") || msg.contains("mental health")) return "🗣️ **Counseling**: Confidential counseling is available. Book via 'Student Services'.";
        if (msg.contains("transport") || msg.contains("bus")) return "🚌 **Transport**: Bus routes and schedules are managed by the Transport Coordinator.";
        if (msg.contains("hostel") || msg.contains("dorm") || msg.contains("accommodation")) return "🏨 **Housing**: Hostel allocation is done on a first-come, first-served basis.";
        if (msg.contains("meal") || msg.contains("cafeteria") || msg.contains("food")) return "🍱 **Cafeteria**: Pre-load your meal card using the Parent Wallet.";
        if (msg.contains("event") || msg.contains("fest") || msg.contains("sports day")) return "🎭 **Events**: Register for upcoming campus events on the Notice Board.";
        if (msg.contains("alumni") || msg.contains("graduate")) return "🎓 **Alumni**: Graduating students are automatically enrolled in the Alumni Network.";
        if (msg.contains("plagiarism") || msg.contains("cheat") || msg.contains("copy")) return "⚠️ **Integrity**: Plagiarism results in an automatic zero for the assignment.";
        if (msg.contains("app") || msg.contains("mobile") || msg.contains("android") || msg.contains("ios")) return "📱 **Mobile App**: Download our official app from the Play Store or App Store.";
        if (msg.contains("dark mode") || msg.contains("theme")) return "🌙 **UI**: Toggle Dark Mode from the top navigation bar.";
        if (msg.contains("accessibility") || msg.contains("blind") || msg.contains("deaf")) return "♿ **Accessibility**: Screen reader support and closed captions are available.";
        if (msg.contains("language") || msg.contains("translate")) return "🌐 **Language**: Switch the platform language from the footer menu.";
        if (msg.contains("recommendation") || msg.contains("letter")) return "✉️ **Recommendations**: Request Letters of Recommendation from teachers via direct message.";
        if (msg.contains("group") || msg.contains("team project")) return "👥 **Projects**: Group assignments require a single submission by the Team Leader.";
        if (msg.contains("peer review") || msg.contains("evaluate")) return "🤝 **Peer Review**: Peer evaluations account for 10% of your group project grade.";
        if (msg.contains("badge") || msg.contains("gamification") || msg.contains("points")) return "🏆 **Badges**: Earn XP points and badges by actively participating in forums.";
        if (msg.contains("leaderboard") || msg.contains("rank")) return "🥇 **Leaderboard**: Check your class rank on the global leaderboard.";
        if (msg.contains("portfolio") || msg.contains("showcase")) return "📂 **Portfolio**: Build your digital portfolio in the 'My Work' section.";
        if (msg.contains("resume") || msg.contains("cv")) return "📄 **Resumes**: Use the built-in Resume Builder in the Careers tab.";
        if (msg.contains("how") || msg.contains("what") || msg.contains("where")) return "🤖 **AI Assistant**: I can help with thousands of topics including grades, fees, courses, technical support, and schedules! Could you specify your question with keywords like 'password', 'enroll', 'fees', or 'grades'?";
        return null;
    }

    public static String getParentResponse(String msg) {
        msg = msg.toLowerCase();
        if (msg.contains("password") || msg.contains("login") || msg.contains("sign in")) return "🔑 **Authentication**: Use 'Forgot Password' or contact the school admin to reset.";
        if (msg.contains("add child") || msg.contains("link student")) return "👨‍👩‍👧 **Child Link**: Link multiple children using their unique Student IDs.";
        if (msg.contains("pta") || msg.contains("teacher meeting") || msg.contains("meet")) return "🤝 **PTA**: Schedule meetings with teachers via the 'Parent Connect' module.";
        if (msg.contains("receipt") || msg.contains("invoice") || msg.contains("bill")) return "🧾 **Receipts**: Download fee receipts directly from the 'Wallet' tab.";
        if (msg.contains("absent") || msg.contains("leave request") || msg.contains("sick")) return "📝 **Leave**: Submit formal leave requests for your child via 'Attendance'.";
        if (msg.contains("bus") || msg.contains("transport") || msg.contains("track")) return "🚌 **Transport**: Track the school bus in real-time using the Transport app.";
        if (msg.contains("cafeteria") || msg.contains("lunch") || msg.contains("meal")) return "🍱 **Meals**: Monitor your child's cafeteria spending and add funds.";
        if (msg.contains("event") || msg.contains("sports") || msg.contains("annual day")) return "🎭 **Events**: View the master event calendar on your dashboard.";
        if (msg.contains("behavior") || msg.contains("conduct") || msg.contains("discipline")) return "⭐ **Behavior**: Access behavioral and disciplinary reports online.";
        if (msg.contains("address") || msg.contains("contact") || msg.contains("phone")) return "🏠 **Profile Update**: Request address changes through the administrative portal.";
        if (msg.contains("emergency")) return "🚨 **Emergency**: Ensure all emergency contacts are up to date in your Profile.";
        if (msg.contains("scholarship") || msg.contains("aid")) return "🎓 **Financial Aid**: Scholarship application deadlines are posted in August.";
        if (msg.contains("uniform") || msg.contains("dress code")) return "👕 **Uniforms**: Purchase uniforms from the school's authorized vendors.";
        if (msg.contains("lost") || msg.contains("found")) return "🔍 **Lost & Found**: Report expensive lost items to the school reception.";
        if (msg.contains("extracurricular") || msg.contains("club")) return "⚽ **Activities**: Monitor your child's club participation and timings.";
        if (msg.contains("medical") || msg.contains("health") || msg.contains("doctor")) return "⚕️ **Health**: Upload vaccination records and medical alerts to the Health portal.";
        if (msg.contains("counseling") || msg.contains("support")) return "🗣️ **Counseling**: Request a meeting with the school counselor for your child.";
        if (msg.contains("bullying") || msg.contains("safety")) return "🛑 **Safety**: Report any concerns about bullying directly via the 'Safe School' link.";
        if (msg.contains("fee") || msg.contains("tuition") || msg.contains("payment")) return "💰 **Fees**: Pay quarterly tuition fees online using Credit Card or UPI.";
        if (msg.contains("tax") || msg.contains("deduction")) return "📄 **Tax**: Download the annual fee certificate for tax filing purposes.";
        if (msg.contains("progress") || msg.contains("report card") || msg.contains("marks")) return "📊 **Academics**: Term report cards are published digitally at the end of each semester.";
        if (msg.contains("homework") || msg.contains("assignment")) return "📋 **Homework**: View your child's pending assignments and due dates.";
        if (msg.contains("attendance") || msg.contains("present")) return "🙋 **Attendance**: Receive instant SMS alerts if your child is marked absent.";
        if (msg.contains("syllabus") || msg.contains("curriculum")) return "📖 **Curriculum**: View the full year's syllabus outline in the 'Academics' tab.";
        if (msg.contains("teacher") || msg.contains("staff")) return "👩‍🏫 **Teachers**: View the profile and contact info of your child's homeroom teacher.";
        if (msg.contains("holiday") || msg.contains("vacation")) return "🏖️ **Holidays**: The school holiday calendar is available in the 'Resources' section.";
        if (msg.contains("exam") || msg.contains("test") || msg.contains("schedule")) return "📝 **Exams**: Mid-term and Final exam date sheets are published 3 weeks in advance.";
        if (msg.contains("notification") || msg.contains("alert") || msg.contains("sms")) return "🔔 **Alerts**: Configure your SMS and email notification preferences.";
        if (msg.contains("app") || msg.contains("mobile")) return "📱 **Mobile App**: The Parent Portal is available on both Android and iOS.";
        if (msg.contains("feedback") || msg.contains("complaint")) return "💬 **Feedback**: Submit feedback or complaints via the 'Helpdesk' tab.";
        if (msg.contains("how") || msg.contains("what") || msg.contains("where")) return "🤖 **AI Assistant**: I can help with thousands of topics including grades, fees, courses, technical support, and schedules! Could you specify your question with keywords like 'password', 'enroll', 'fees', or 'grades'?";
        return null;
    }

    public static String getTeacherResponse(String msg) {
        msg = msg.toLowerCase();
        if (msg.contains("password") || msg.contains("login")) return "🔑 **Authentication**: Reset your password via the Admin or 'Forgot Password' link.";
        if (msg.contains("upload") || msg.contains("material") || msg.contains("pdf")) return "📤 **Materials**: Upload course materials via the 'Content Manager'.";
        if (msg.contains("grading") || msg.contains("mark") || msg.contains("score")) return "📝 **Grading**: Grade assignments in bulk using the 'Submissions' dashboard.";
        if (msg.contains("attendance") || msg.contains("register")) return "⏰ **Attendance**: Mark daily attendance. Registers lock automatically after 24 hours.";
        if (msg.contains("exam") || msg.contains("quiz") || msg.contains("create test")) return "📋 **Exams**: Create MCQs or subjective exams using the 'Exam Builder'.";
        if (msg.contains("live") || msg.contains("zoom") || msg.contains("meet") || msg.contains("video")) return "🎥 **Live Classes**: Start live classes by pasting your meeting link in the Timetable.";
        if (msg.contains("substitute") || msg.contains("cover") || msg.contains("absent")) return "🧑‍🏫 **Coverage**: Request a substitute for your classes via the HR module.";
        if (msg.contains("salary") || msg.contains("pay") || msg.contains("payslip")) return "💵 **Payroll**: Download monthly payslips from the 'Finance' tab.";
        if (msg.contains("leave") || msg.contains("sick") || msg.contains("holiday")) return "🌴 **Leave**: Apply for Casual or Medical leave via the HR portal.";
        if (msg.contains("syllabus") || msg.contains("update course")) return "📚 **Curriculum**: Submit syllabus change requests to the Head of Department.";
        if (msg.contains("parent meeting") || msg.contains("pta")) return "🤝 **PTA**: View your scheduled parent-teacher meeting slots.";
        if (msg.contains("cheat") || msg.contains("plagiarism") || msg.contains("copy")) return "⚠️ **Integrity**: Use the built-in Plagiarism Checker for text submissions.";
        if (msg.contains("extra credit") || msg.contains("bonus")) return "⭐ **Bonus**: Award manual extra credit directly in the Gradebook.";
        if (msg.contains("equipment") || msg.contains("projector") || msg.contains("lab")) return "📽️ **Resources**: Book A/V equipment via the 'Asset Management' portal.";
        if (msg.contains("it support") || msg.contains("helpdesk")) return "💻 **Tech Help**: Raise a ticket for any software or hardware issues.";
        if (msg.contains("training") || msg.contains("workshop")) return "📈 **Professional Dev**: Track your mandatory training hours in your profile.";
        if (msg.contains("class size") || msg.contains("roster")) return "👥 **Roster**: View your class lists and student profiles in the 'My Classes' tab.";
        if (msg.contains("publish") || msg.contains("release grades")) return "📢 **Results**: Click 'Publish Grades' to make scores visible to students.";
        if (msg.contains("forum") || msg.contains("moderate") || msg.contains("delete")) return "🛡️ **Moderation**: Moderate student discussions and delete inappropriate posts.";
        if (msg.contains("export") || msg.contains("csv") || msg.contains("excel")) return "📊 **Data**: Export your complete gradebook to Excel or CSV formats.";
        if (msg.contains("announcement") || msg.contains("notice")) return "📢 **Announcements**: Broadcast messages to all students in your batch.";
        if (msg.contains("assignment deadline") || msg.contains("extend")) return "⏰ **Extensions**: You can manually extend deadlines for specific students.";
        if (msg.contains("certificate") || msg.contains("issue")) return "📜 **Certificates**: Endorse students for final certificate issuance.";
        if (msg.contains("performance") || msg.contains("rating")) return "⭐ **Feedback**: View anonymous student feedback in 'My Performance'.";
        if (msg.contains("timetable") || msg.contains("schedule")) return "📅 **Schedule**: View your weekly teaching load and free periods.";
        if (msg.contains("department") || msg.contains("hod")) return "🏢 **Department**: Communicate with your HOD via the internal messaging system.";
        if (msg.contains("library") || msg.contains("book requisition")) return "📚 **Library**: Submit book requisition forms to the Chief Librarian.";
        if (msg.contains("transport") || msg.contains("bus duty")) return "🚌 **Transport**: Check your assigned bus duty schedule.";
        if (msg.contains("event") || msg.contains("extracurricular")) return "🎭 **Events**: Manage student clubs and extracurricular activities.";
        if (msg.contains("profile") || msg.contains("update details")) return "🖼️ **Profile**: Update your educational qualifications and bio.";
        if (msg.contains("how") || msg.contains("what") || msg.contains("where")) return "🤖 **AI Assistant**: I can help with thousands of topics including grades, fees, courses, technical support, and schedules! Could you specify your question with keywords like 'password', 'enroll', 'fees', or 'grades'?";
        return null;
    }

    public static String getAdminResponse(String msg) {
        msg = msg.toLowerCase();
        if (msg.contains("password") || msg.contains("security") || msg.contains("login")) return "🔑 **Security**: Enforce strong password policies globally via 'System Settings'.";
        if (msg.contains("add teacher") || msg.contains("new staff")) return "👨‍🏫 **Staffing**: Create new teacher accounts in the 'User Management' panel.";
        if (msg.contains("backup") || msg.contains("restore") || msg.contains("data")) return "💾 **Database**: Automated DB backups occur daily. Manual backups can be triggered in Settings.";
        if (msg.contains("reports") || msg.contains("analytics") || msg.contains("dashboard")) return "📈 **Analytics**: View system-wide revenue, attendance, and enrollment statistics.";
        if (msg.contains("audit") || msg.contains("logs") || msg.contains("history")) return "🔍 **Logs**: The Audit Trail tracks every CRUD operation performed by users.";
        if (msg.contains("holiday") || msg.contains("calendar")) return "🗓️ **Scheduling**: Manage the global academic calendar and public holidays.";
        if (msg.contains("fee structure") || msg.contains("tuition")) return "💰 **Finance**: Configure fee tiers, taxes, and late payment penalties.";
        if (msg.contains("bulk import") || msg.contains("csv") || msg.contains("upload")) return "📥 **Data Entry**: Use the CSV Bulk Importer to onboard hundreds of students instantly.";
        if (msg.contains("deactivate") || msg.contains("suspend") || msg.contains("ban")) return "🛑 **Access**: Suspend user accounts for disciplinary or financial reasons.";
        if (msg.contains("email") || msg.contains("smtp") || msg.contains("server")) return "📧 **SMTP**: Configure the outgoing mail server for automated system emails.";
        if (msg.contains("storage") || msg.contains("aws") || msg.contains("s3") || msg.contains("disk")) return "💽 **Storage**: Monitor cloud storage usage and set upload limits per user.";
        if (msg.contains("role") || msg.contains("permission") || msg.contains("rbac")) return "🔐 **Roles**: Define granular access permissions for Custom Admin roles.";
        if (msg.contains("payment gateway") || msg.contains("razorpay")) return "💳 **Integrations**: Configure API keys for Stripe, Razorpay, or PayPal.";
        if (msg.contains("certificate template") || msg.contains("design")) return "📜 **Certificates**: Upload standard backgrounds and signatures for PDF certificates.";
        if (msg.contains("maintenance") || msg.contains("downtime")) return "🛠️ **System**: Enable Maintenance Mode to block non-admin logins during updates.";
        if (msg.contains("archive") || msg.contains("end of year") || msg.contains("graduate")) return "📦 **Archiving**: Run the End-of-Year batch job to promote or archive students.";
        if (msg.contains("sms") || msg.contains("twilio") || msg.contains("gateway")) return "📱 **Alerts**: Integrate third-party SMS providers via Webhooks.";
        if (msg.contains("theme") || msg.contains("logo") || msg.contains("branding")) return "🎨 **Branding**: Customize the LMS colors, logos, and favicon.";
        if (msg.contains("timeout") || msg.contains("session")) return "⏳ **Security**: Configure the global JWT session expiration time.";
        if (msg.contains("support") || msg.contains("helpdesk") || msg.contains("ticket")) return "🎫 **Support**: Manage and resolve user tickets in the unified Helpdesk.";
        if (msg.contains("department") || msg.contains("create dept")) return "🏢 **Departments**: Create and manage academic departments and assign HODs.";
        if (msg.contains("batch") || msg.contains("create class")) return "🏫 **Batches**: Group students into logical batches (e.g., Class 10A, CS 2024).";
        if (msg.contains("course") || msg.contains("subject")) return "📚 **Courses**: Create courses, assign teachers, and link them to batches.";
        if (msg.contains("enrollment request") || msg.contains("approve")) return "📥 **Enrollment**: Approve or reject student requests to join premium courses.";
        if (msg.contains("revenue") || msg.contains("income")) return "💵 **Finance**: Export total revenue reports by department or date range.";
        if (msg.contains("delete user") || msg.contains("remove")) return "🗑️ **Data Privacy**: Permanently delete user data in compliance with GDPR.";
        if (msg.contains("language") || msg.contains("localization")) return "🌐 **Localization**: Manage system translation files for multi-language support.";
        if (msg.contains("seo") || msg.contains("meta")) return "🔍 **SEO**: Update meta tags and public site descriptions.";
        if (msg.contains("api") || msg.contains("webhook") || msg.contains("integration")) return "⚙️ **API**: Generate API tokens for third-party system integrations.";
        if (msg.contains("version") || msg.contains("update") || msg.contains("patch")) return "🚀 **Updates**: Check the current LMS version and apply patches.";
        if (msg.contains("how") || msg.contains("what") || msg.contains("where")) return "🤖 **AI Assistant**: I can help with thousands of topics including grades, fees, courses, technical support, and schedules! Could you specify your question with keywords like 'password', 'enroll', 'fees', or 'grades'?";
        return null;
    }

}
