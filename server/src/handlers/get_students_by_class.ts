
import { db } from '../db';
import { studentsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Student } from '../schema';

export async function getStudentsByClass(classId: number): Promise<Student[]> {
  try {
    const students = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.class_id, classId))
      .execute();

    return students;
  } catch (error) {
    console.error('Failed to fetch students by class:', error);
    throw error;
  }
}
