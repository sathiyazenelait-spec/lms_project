const fs = require('fs');

const students = [33, 17, 31, 32, 10, 1];
const courseId = 8;
const year = 2026;
const month = 4; // April

let sql = `USE zenelait_lms;\n\n`;

// Clear existing attendance for this course in April 2026 to avoid duplicates
sql += `DELETE FROM attendance WHERE course_id = ${courseId} AND date >= '2026-04-01' AND date <= '2026-04-30';\n\n`;

const sundays = [5, 12, 19, 26];

// We will insert records for each student on each working day of April 2026
const statuses = ['PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'LATE', 'PRESENT', 'ABSENT', 'PRESENT', 'PRESENT'];

let idCounter = 1; // Let mysql auto_increment handle it, or we just omit ID column or set it to NULL.
// We will omit ID column so it auto-increments.

sql += `INSERT INTO attendance (date, status, course_id, student_id, remarks, created_at) VALUES \n`;

const values = [];

for (let day = 1; day <= 30; day++) {
  if (sundays.includes(day)) {
    continue; // Sunday is a holiday
  }

  const dateStr = `2026-04-${String(day).padStart(2, '0')}`;
  
  students.forEach(studentId => {
    // Generate a status based on student ID and day to keep it deterministic but varied
    const hash = (studentId * 7 + day * 13) % statuses.length;
    const status = statuses[hash];
    const remarks = status === 'LATE' ? 'Late by 10 mins' : (status === 'ABSENT' ? 'Sick leave' : 'On time');
    
    values.push(`('${dateStr}', '${status}', ${courseId}, ${studentId}, '${remarks}', NOW())`);
  });
}

sql += values.join(',\n') + ';\n';

fs.writeFileSync('c:/Users/PRAVEEN/Documents/lms_complete_folder/scratch/seed_attendance.sql', sql);
console.log('SQL file generated successfully!');
