
import { db } from '../db';
import { studentsTable } from '../db/schema';
import { type CreateStudentInput, type Student } from '../schema';

export const createStudent = async (input: CreateStudentInput): Promise<Student> => {
  try {
    // Insert student record
    const result = await db.insert(studentsTable)
      .values({
        name: input.name,
        student_id: input.student_id,
        class_id: input.class_id,
        is_attendance_recorder: input.is_attendance_recorder
      })
      .returning()
      .execute();

    const student = result[0];
    return {
      ...student,
      created_at: new Date(student.created_at)
    };
  } catch (error) {
    console.error('Student creation failed:', error);
    throw error;
  }
};
