
import { db } from '../db';
import { classesTable, studentsTable, attendanceRecordsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteClass(id: number): Promise<boolean> {
  try {
    // Delete in proper order to respect foreign key constraints
    // 1. Delete attendance records first
    await db.delete(attendanceRecordsTable)
      .where(eq(attendanceRecordsTable.class_id, id))
      .execute();

    // 2. Delete students in the class
    await db.delete(studentsTable)
      .where(eq(studentsTable.class_id, id))
      .execute();

    // 3. Finally delete the class
    const result = await db.delete(classesTable)
      .where(eq(classesTable.id, id))
      .returning()
      .execute();

    // Return true if a class was deleted
    return result.length > 0;
  } catch (error) {
    console.error('Class deletion failed:', error);
    throw error;
  }
}
