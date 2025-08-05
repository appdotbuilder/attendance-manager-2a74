
import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type Student } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function getAttendanceRecorders(classId: number): Promise<Student[]> {
  try {
    const results = await db.select()
      .from(studentsTable)
      .where(
        and(
          eq(studentsTable.class_id, classId),
          eq(studentsTable.is_attendance_recorder, true)
        )
      )
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get attendance recorders:', error);
    throw error;
  }
}
