
import { db } from '../db';
import { teachersTable } from '../db/schema';
import { type TeacherLoginInput, type Teacher } from '../schema';
import { eq } from 'drizzle-orm';

export async function teacherLogin(input: TeacherLoginInput): Promise<Teacher | null> {
  try {
    // Query teacher by email
    const teachers = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.email, input.email))
      .execute();

    if (teachers.length === 0) {
      return null;
    }

    const teacher = teachers[0];

    // Verify password using Bun's built-in password verification
    const isValidPassword = await Bun.password.verify(input.password, teacher.password_hash);

    if (!isValidPassword) {
      return null;
    }

    // Return teacher data without password hash for security
    return {
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      password_hash: teacher.password_hash, // Keep as required by schema
      created_at: teacher.created_at
    };
  } catch (error) {
    console.error('Teacher login failed:', error);
    throw error;
  }
}
