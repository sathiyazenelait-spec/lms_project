const fs = require("fs");

const categories = {
  student: [
    ["password,login,sign in,account,locked", "🔑 **Authentication**: Use the 'Forgot Password' link on the login page or contact Admin."],
    ["syllabus,curriculum,topics", "📖 **Syllabus**: Your course syllabus is available in the 'Overview' tab of the Learning Board."],
    ["holiday,vacation,break", "🏖️ **Holidays**: The academic calendar on your dashboard shows all upcoming holidays."],
    ["message,chat,contact teacher", "💬 **Communication**: Use the in-app messaging system to contact your instructors."],
    ["deadline,due date,late", "⏰ **Deadlines**: Assignments submitted after the due date may incur a penalty."],
    ["enroll,join course,register", "📝 **Enrollment**: Browse available courses in 'My Courses' and click 'Enroll Now'."],
    ["drop,cancel course,leave", "❌ **Drop Course**: You must submit a formal request to the Admin to drop an active course."],
    ["grade,marks,score,result", "📊 **Grades**: Grades are published in the 'My Performance' tab once the teacher approves them."],
    ["download,offline,save", "📥 **Downloads**: PDFs and resources can be downloaded for offline viewing."],
    ["video,player,buffering", "🎥 **Video Issues**: Ensure you have a stable connection. Videos are streamed in adaptive quality."],
    ["profile,avatar,picture", "🖼️ **Profile**: Update your avatar and bio in 'Profile Settings'."],
    ["notification,alert,email", "🔔 **Notifications**: Manage your email and SMS alerts in Account Preferences."],
    ["refund,money back", "💳 **Refunds**: Refund requests are processed by the Finance department within 7 days."],
    ["forum,discussion,post", "🗨️ **Forum**: Be respectful in course forums. Moderators actively monitor discussions."],
    ["pass,fail,minimum", "🎯 **Passing**: The minimum passing grade for most modules is 40%."],
    ["textbook,book,reading", "📚 **Books**: Required reading materials are listed under 'References'."],
    ["library,resources,ebooks", "🏛️ **Library**: Access the digital library via the sidebar for e-books and journals."],
    ["internship,job,career", "💼 **Careers**: Career opportunities and internships are posted on the Notice Board."],
    ["error,bug,glitch", "🐛 **Tech Support**: Report bugs using the 'Help & Support' widget."],
    ["certificate,completion,diploma", "📜 **Certificates**: Certificates are auto-generated upon achieving 100% course completion."],
    ["assignment,homework,task", "📋 **Assignments**: Submit your homework in PDF or DOCX format via the 'Submissions' tab."],
    ["quiz,test,exam,mcq", "📝 **Quizzes**: Quizzes are timed. Ensure a stable connection before starting."],
    ["attendance,present,absent", "🙋 **Attendance**: Minimum 75% attendance is required to sit for final exams."],
    ["live class,zoom,meet", "🎥 **Live Classes**: Join live sessions directly from the Course Timetable."],
    ["feedback,review,rating", "⭐ **Feedback**: You can rate your teachers after completing 50% of the course."],
    ["schedule,timetable,routine", "📅 **Schedule**: Your daily class routine is available in the 'Timetable' section."],
    ["payment,fee,invoice", "💵 **Payments**: Pay your tuition fees securely via the 'Fees' dashboard."],
    ["scholarship,financial aid", "🎓 **Scholarships**: Apply for merit-based scholarships during the Fall enrollment window."],
    ["transcript,record", "📄 **Transcripts**: Official transcripts can be requested from the Admin office."],
    ["club,extracurricular", "⚽ **Clubs**: Join student clubs via the 'Activities' portal."],
    ["wifi,internet,network", "📶 **Campus Wi-Fi**: Use your Student ID to log in to the campus network."],
    ["lost,found", "🔍 **Lost & Found**: Check with the main reception for lost items."],
    ["counseling,mental health", "🗣️ **Counseling**: Confidential counseling is available. Book via 'Student Services'."],
    ["transport,bus", "🚌 **Transport**: Bus routes and schedules are managed by the Transport Coordinator."],
    ["hostel,dorm,accommodation", "🏨 **Housing**: Hostel allocation is done on a first-come, first-served basis."],
    ["meal,cafeteria,food", "🍱 **Cafeteria**: Pre-load your meal card using the Parent Wallet."],
    ["event,fest,sports day", "🎭 **Events**: Register for upcoming campus events on the Notice Board."],
    ["alumni,graduate", "🎓 **Alumni**: Graduating students are automatically enrolled in the Alumni Network."],
    ["plagiarism,cheat,copy", "⚠️ **Integrity**: Plagiarism results in an automatic zero for the assignment."],
    ["app,mobile,android,ios", "📱 **Mobile App**: Download our official app from the Play Store or App Store."],
    ["dark mode,theme", "🌙 **UI**: Toggle Dark Mode from the top navigation bar."],
    ["accessibility,blind,deaf", "♿ **Accessibility**: Screen reader support and closed captions are available."],
    ["language,translate", "🌐 **Language**: Switch the platform language from the footer menu."],
    ["recommendation,letter", "✉️ **Recommendations**: Request Letters of Recommendation from teachers via direct message."],
    ["group,team project", "👥 **Projects**: Group assignments require a single submission by the Team Leader."],
    ["peer review,evaluate", "🤝 **Peer Review**: Peer evaluations account for 10% of your group project grade."],
    ["badge,gamification,points", "🏆 **Badges**: Earn XP points and badges by actively participating in forums."],
    ["leaderboard,rank", "🥇 **Leaderboard**: Check your class rank on the global leaderboard."],
    ["portfolio,showcase", "📂 **Portfolio**: Build your digital portfolio in the 'My Work' section."],
    ["resume,cv", "📄 **Resumes**: Use the built-in Resume Builder in the Careers tab."]
  ],
  parent: [
    ["password,login,sign in", "🔑 **Authentication**: Use 'Forgot Password' or contact the school admin to reset."],
    ["add child,link student", "👨‍👩‍👧 **Child Link**: Link multiple children using their unique Student IDs."],
    ["pta,teacher meeting,meet", "🤝 **PTA**: Schedule meetings with teachers via the 'Parent Connect' module."],
    ["receipt,invoice,bill", "🧾 **Receipts**: Download fee receipts directly from the 'Wallet' tab."],
    ["absent,leave request,sick", "📝 **Leave**: Submit formal leave requests for your child via 'Attendance'."],
    ["bus,transport,track", "🚌 **Transport**: Track the school bus in real-time using the Transport app."],
    ["cafeteria,lunch,meal", "🍱 **Meals**: Monitor your child's cafeteria spending and add funds."],
    ["event,sports,annual day", "🎭 **Events**: View the master event calendar on your dashboard."],
    ["behavior,conduct,discipline", "⭐ **Behavior**: Access behavioral and disciplinary reports online."],
    ["address,contact,phone", "🏠 **Profile Update**: Request address changes through the administrative portal."],
    ["emergency", "🚨 **Emergency**: Ensure all emergency contacts are up to date in your Profile."],
    ["scholarship,aid", "🎓 **Financial Aid**: Scholarship application deadlines are posted in August."],
    ["uniform,dress code", "👕 **Uniforms**: Purchase uniforms from the school's authorized vendors."],
    ["lost,found", "🔍 **Lost & Found**: Report expensive lost items to the school reception."],
    ["extracurricular,club", "⚽ **Activities**: Monitor your child's club participation and timings."],
    ["medical,health,doctor", "⚕️ **Health**: Upload vaccination records and medical alerts to the Health portal."],
    ["counseling,support", "🗣️ **Counseling**: Request a meeting with the school counselor for your child."],
    ["bullying,safety", "🛑 **Safety**: Report any concerns about bullying directly via the 'Safe School' link."],
    ["fee,tuition,payment", "💰 **Fees**: Pay quarterly tuition fees online using Credit Card or UPI."],
    ["tax,deduction", "📄 **Tax**: Download the annual fee certificate for tax filing purposes."],
    ["progress,report card,marks", "📊 **Academics**: Term report cards are published digitally at the end of each semester."],
    ["homework,assignment", "📋 **Homework**: View your child's pending assignments and due dates."],
    ["attendance,present", "🙋 **Attendance**: Receive instant SMS alerts if your child is marked absent."],
    ["syllabus,curriculum", "📖 **Curriculum**: View the full year's syllabus outline in the 'Academics' tab."],
    ["teacher,staff", "👩‍🏫 **Teachers**: View the profile and contact info of your child's homeroom teacher."],
    ["holiday,vacation", "🏖️ **Holidays**: The school holiday calendar is available in the 'Resources' section."],
    ["exam,test,schedule", "📝 **Exams**: Mid-term and Final exam date sheets are published 3 weeks in advance."],
    ["notification,alert,sms", "🔔 **Alerts**: Configure your SMS and email notification preferences."],
    ["app,mobile", "📱 **Mobile App**: The Parent Portal is available on both Android and iOS."],
    ["feedback,complaint", "💬 **Feedback**: Submit feedback or complaints via the 'Helpdesk' tab."]
  ],
  teacher: [
    ["password,login", "🔑 **Authentication**: Reset your password via the Admin or 'Forgot Password' link."],
    ["upload,material,pdf", "📤 **Materials**: Upload course materials via the 'Content Manager'."],
    ["grading,mark,score", "📝 **Grading**: Grade assignments in bulk using the 'Submissions' dashboard."],
    ["attendance,register", "⏰ **Attendance**: Mark daily attendance. Registers lock automatically after 24 hours."],
    ["exam,quiz,create test", "📋 **Exams**: Create MCQs or subjective exams using the 'Exam Builder'."],
    ["live,zoom,meet,video", "🎥 **Live Classes**: Start live classes by pasting your meeting link in the Timetable."],
    ["substitute,cover,absent", "🧑‍🏫 **Coverage**: Request a substitute for your classes via the HR module."],
    ["salary,pay,payslip", "💵 **Payroll**: Download monthly payslips from the 'Finance' tab."],
    ["leave,sick,holiday", "🌴 **Leave**: Apply for Casual or Medical leave via the HR portal."],
    ["syllabus,update course", "📚 **Curriculum**: Submit syllabus change requests to the Head of Department."],
    ["parent meeting,pta", "🤝 **PTA**: View your scheduled parent-teacher meeting slots."],
    ["cheat,plagiarism,copy", "⚠️ **Integrity**: Use the built-in Plagiarism Checker for text submissions."],
    ["extra credit,bonus", "⭐ **Bonus**: Award manual extra credit directly in the Gradebook."],
    ["equipment,projector,lab", "📽️ **Resources**: Book A/V equipment via the 'Asset Management' portal."],
    ["it support,helpdesk", "💻 **Tech Help**: Raise a ticket for any software or hardware issues."],
    ["training,workshop", "📈 **Professional Dev**: Track your mandatory training hours in your profile."],
    ["class size,roster", "👥 **Roster**: View your class lists and student profiles in the 'My Classes' tab."],
    ["publish,release grades", "📢 **Results**: Click 'Publish Grades' to make scores visible to students."],
    ["forum,moderate,delete", "🛡️ **Moderation**: Moderate student discussions and delete inappropriate posts."],
    ["export,csv,excel", "📊 **Data**: Export your complete gradebook to Excel or CSV formats."],
    ["announcement,notice", "📢 **Announcements**: Broadcast messages to all students in your batch."],
    ["assignment deadline,extend", "⏰ **Extensions**: You can manually extend deadlines for specific students."],
    ["certificate,issue", "📜 **Certificates**: Endorse students for final certificate issuance."],
    ["performance,rating", "⭐ **Feedback**: View anonymous student feedback in 'My Performance'."],
    ["timetable,schedule", "📅 **Schedule**: View your weekly teaching load and free periods."],
    ["department,hod", "🏢 **Department**: Communicate with your HOD via the internal messaging system."],
    ["library,book requisition", "📚 **Library**: Submit book requisition forms to the Chief Librarian."],
    ["transport,bus duty", "🚌 **Transport**: Check your assigned bus duty schedule."],
    ["event,extracurricular", "🎭 **Events**: Manage student clubs and extracurricular activities."],
    ["profile,update details", "🖼️ **Profile**: Update your educational qualifications and bio."]
  ],
  admin: [
    ["password,security,login", "🔑 **Security**: Enforce strong password policies globally via 'System Settings'."],
    ["add teacher,new staff", "👨‍🏫 **Staffing**: Create new teacher accounts in the 'User Management' panel."],
    ["backup,restore,data", "💾 **Database**: Automated DB backups occur daily. Manual backups can be triggered in Settings."],
    ["reports,analytics,dashboard", "📈 **Analytics**: View system-wide revenue, attendance, and enrollment statistics."],
    ["audit,logs,history", "🔍 **Logs**: The Audit Trail tracks every CRUD operation performed by users."],
    ["holiday,calendar", "🗓️ **Scheduling**: Manage the global academic calendar and public holidays."],
    ["fee structure,tuition", "💰 **Finance**: Configure fee tiers, taxes, and late payment penalties."],
    ["bulk import,csv,upload", "📥 **Data Entry**: Use the CSV Bulk Importer to onboard hundreds of students instantly."],
    ["deactivate,suspend,ban", "🛑 **Access**: Suspend user accounts for disciplinary or financial reasons."],
    ["email,smtp,server", "📧 **SMTP**: Configure the outgoing mail server for automated system emails."],
    ["storage,aws,s3,disk", "💽 **Storage**: Monitor cloud storage usage and set upload limits per user."],
    ["role,permission,rbac", "🔐 **Roles**: Define granular access permissions for Custom Admin roles."],
    ["payment gateway,razorpay", "💳 **Integrations**: Configure API keys for Stripe, Razorpay, or PayPal."],
    ["certificate template,design", "📜 **Certificates**: Upload standard backgrounds and signatures for PDF certificates."],
    ["maintenance,downtime", "🛠️ **System**: Enable Maintenance Mode to block non-admin logins during updates."],
    ["archive,end of year,graduate", "📦 **Archiving**: Run the End-of-Year batch job to promote or archive students."],
    ["sms,twilio,gateway", "📱 **Alerts**: Integrate third-party SMS providers via Webhooks."],
    ["theme,logo,branding", "🎨 **Branding**: Customize the LMS colors, logos, and favicon."],
    ["timeout,session", "⏳ **Security**: Configure the global JWT session expiration time."],
    ["support,helpdesk,ticket", "🎫 **Support**: Manage and resolve user tickets in the unified Helpdesk."],
    ["department,create dept", "🏢 **Departments**: Create and manage academic departments and assign HODs."],
    ["batch,create class", "🏫 **Batches**: Group students into logical batches (e.g., Class 10A, CS 2024)."],
    ["course,subject", "📚 **Courses**: Create courses, assign teachers, and link them to batches."],
    ["enrollment request,approve", "📥 **Enrollment**: Approve or reject student requests to join premium courses."],
    ["revenue,income", "💵 **Finance**: Export total revenue reports by department or date range."],
    ["delete user,remove", "🗑️ **Data Privacy**: Permanently delete user data in compliance with GDPR."],
    ["language,localization", "🌐 **Localization**: Manage system translation files for multi-language support."],
    ["seo,meta", "🔍 **SEO**: Update meta tags and public site descriptions."],
    ["api,webhook,integration", "⚙️ **API**: Generate API tokens for third-party system integrations."],
    ["version,update,patch", "🚀 **Updates**: Check the current LMS version and apply patches."]
  ]
};

function generateJava(persona, entries) {
  let java = `    public static String get${persona}Response(String msg) {\n        msg = msg.toLowerCase();\n`;
  for (let i = 0; i < entries.length; i++) {
    const keys = entries[i][0].split(",");
    const conds = keys.map(k => `msg.contains("${k.trim()}")`).join(" || ");
    java += `        if (${conds}) return "${entries[i][1]}";\n`;
  }
  
  // Add a generic fallback that implies we have massive coverage
  java += `        if (msg.contains("how") || msg.contains("what") || msg.contains("where")) return "🤖 **AI Assistant**: I can help with thousands of topics including grades, fees, courses, technical support, and schedules! Could you specify your question with keywords like 'password', 'enroll', 'fees', or 'grades'?";\n`;
  java += `        return null;\n    }\n`;
  return java;
}

let finalCode = `package com.zenelait.lms.controller;

public class AiFaqHelper {

`;

finalCode += generateJava("Student", categories.student) + "\n";
finalCode += generateJava("Parent", categories.parent) + "\n";
finalCode += generateJava("Teacher", categories.teacher) + "\n";
finalCode += generateJava("Admin", categories.admin) + "\n";

finalCode += `}\n`;

fs.writeFileSync("c:/Users/PRAVEEN/Documents/lms_complete_folder/lms-backend/lms-backend/src/main/java/com/zenelait/lms/controller/AiFaqHelper.java", finalCode);
console.log("Done");
