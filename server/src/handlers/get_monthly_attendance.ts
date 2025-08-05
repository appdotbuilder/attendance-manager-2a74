
import { db } from '../db';
import { studentsTable, attendanceRecordsTable, classesTable } from '../db/schema';
import { type MonthlyAttendanceQuery, type AttendanceSummary } from '../schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export async function getMonthlyAttendance(query: MonthlyAttendanceQuery): Promise<AttendanceSummary[]> {
  try {
    // Create date range for the specified month
    const startDate = new Date(query.year, query.month - 1, 1);
    const endDate = new Date(query.year, query.month, 0); // Last day of the month

    // Get all students in the class with their attendance records for the month
    const results = await db.select({
      student_id: studentsTable.id,
      student_name: studentsTable.name,
      status: attendanceRecordsTable.status,
    })
    .from(studentsTable)
    .leftJoin(
      attendanceRecordsTable,
      and(
        eq(attendanceRecordsTable.student_id, studentsTable.id),
        eq(attendanceRecordsTable.class_id, query.class_id),
        gte(attendanceRecordsTable.date, startDate.toISOString().split('T')[0]),
        lte(attendanceRecordsTable.date, endDate.toISOString().split('T')[0])
      )
    )
    .where(eq(studentsTable.class_id, query.class_id))
    .execute();

    // Group results by student and count attendance statuses
    const studentMap = new Map<number, {
      student_name: string;
      hadir: number;
      sakit: number;
      izin: number;
      alfa: number;
      dispen: number;
      total_days: number;
    }>();

    for (const result of results) {
      if (!studentMap.has(result.student_id)) {
        studentMap.set(result.student_id, {
          student_name: result.student_name,
          hadir: 0,
          sakit: 0,
          izin: 0,
          alfa: 0,
          dispen: 0,
          total_days: 0,
        });
      }

      const studentData = studentMap.get(result.student_id)!;

      // Only count if there's an attendance record (status is not null)
      if (result.status) {
        studentData.total_days++;
        
        switch (result.status) {
          case 'Hadir':
            studentData.hadir++;
            break;
          case 'Sakit':
            studentData.sakit++;
            break;
          case 'Izin':
            studentData.izin++;
            break;
          case 'Alfa':
            studentData.alfa++;
            break;
          case 'Dispen':
            studentData.dispen++;
            break;
        }
      }
    }

    // Convert map to AttendanceSummary array
    return Array.from(studentMap.entries()).map(([student_id, data]) => {
      const attendance_percentage = data.total_days > 0 
        ? Math.round((data.hadir / data.total_days) * 100) 
        : 0;

      return {
        student_id,
        student_name: data.student_name,
        total_days: data.total_days,
        hadir: data.hadir,
        sakit: data.sakit,
        izin: data.izin,
        alfa: data.alfa,
        dispen: data.dispen,
        attendance_percentage,
      };
    }).sort((a, b) => a.student_name.localeCompare(b.student_name));
  } catch (error) {
    console.error('Monthly attendance fetch failed:', error);
    throw error;
  }
}
