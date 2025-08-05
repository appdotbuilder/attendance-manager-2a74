
import { db } from '../db';
import { studentsTable, attendanceRecordsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteStudent(id: number): Promise<boolean> {
  try {
    // First, delete all related attendance records
    await db.delete(attendanceRecordsTable)
      .where(eq(attendanceRecordsTable.student_id, id))
      .execute();

    // Also delete attendance records where this student was the recorder
    await db.delete(attendanceRecordsTable)
      .where(eq(attendanceRecordsTable.recorded_by, id))
      .execute();

    // Then delete the student
    const result = await db.delete(studentsTable)
      .where(eq(studentsTable.id, id))
      .execute();

    // Return true if student was deleted (affected rows > 0)
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Student deletion failed:', error);
    throw error;
  }
}
