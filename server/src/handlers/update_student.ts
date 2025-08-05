
import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type UpdateStudentInput, type Student } from '../schema';
import { eq } from 'drizzle-orm';

export const updateStudent = async (input: UpdateStudentInput): Promise<Student> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof studentsTable.$inferInsert> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.student_id !== undefined) {
      updateData.student_id = input.student_id;
    }
    
    if (input.class_id !== undefined) {
      updateData.class_id = input.class_id;
    }
    
    if (input.is_attendance_recorder !== undefined) {
      updateData.is_attendance_recorder = input.is_attendance_recorder;
    }

    // If no fields to update, just return the existing student
    if (Object.keys(updateData).length === 0) {
      const existingStudent = await db.select()
        .from(studentsTable)
        .where(eq(studentsTable.id, input.id))
        .execute();

      if (existingStudent.length === 0) {
        throw new Error(`Student with id ${input.id} not found`);
      }

      return existingStudent[0];
    }

    // Update student record
    const result = await db.update(studentsTable)
      .set(updateData)
      .where(eq(studentsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Student with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Student update failed:', error);
    throw error;
  }
};
