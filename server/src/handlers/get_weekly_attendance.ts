
import { db } from '../db';
import { attendanceRecordsTable } from '../db/schema';
import { type WeeklyAttendanceQuery, type AttendanceRecord } from '../schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export async function getWeeklyAttendance(query: WeeklyAttendanceQuery): Promise<AttendanceRecord[]> {
  try {
    // Calculate the end of the week (6 days after start)
    const weekEnd = new Date(query.week_start);
    weekEnd.setDate(weekEnd.getDate() + 6);

    // Query attendance records for the class within the week range
    const results = await db.select()
      .from(attendanceRecordsTable)
      .where(and(
        eq(attendanceRecordsTable.class_id, query.class_id),
        gte(attendanceRecordsTable.date, query.week_start.toISOString().split('T')[0]), // Convert to YYYY-MM-DD
        lte(attendanceRecordsTable.date, weekEnd.toISOString().split('T')[0]) // Convert to YYYY-MM-DD
      ))
      .execute();

    // Convert date strings back to Date objects for the response
    return results.map(record => ({
      ...record,
      date: new Date(record.date),
      created_at: record.created_at
    }));
  } catch (error) {
    console.error('Weekly attendance query failed:', error);
    throw error;
  }
}
