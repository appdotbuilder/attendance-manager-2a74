
import { db } from '../db';
import { attendanceRecordsTable } from '../db/schema';
import { type DailyAttendanceQuery, type AttendanceRecord } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function getDailyAttendance(query: DailyAttendanceQuery): Promise<AttendanceRecord[]> {
  try {
    // Convert Date to ISO date string for database query
    const dateString = query.date.toISOString().split('T')[0]; // Format: YYYY-MM-DD

    // Query attendance records for the specific class and date
    const results = await db.select()
      .from(attendanceRecordsTable)
      .where(and(
        eq(attendanceRecordsTable.class_id, query.class_id),
        eq(attendanceRecordsTable.date, dateString)
      ))
      .execute();

    // Convert the results to match the schema format
    return results.map(record => ({
      id: record.id,
      student_id: record.student_id,
      class_id: record.class_id,
      status: record.status,
      date: new Date(record.date), // Convert date string back to Date object
      recorded_by: record.recorded_by,
      notes: record.notes,
      created_at: record.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch daily attendance:', error);
    throw error;
  }
}
