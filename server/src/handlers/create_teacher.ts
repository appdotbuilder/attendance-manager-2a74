
import { db } from '../db';
import { teachersTable } from '../db/schema';
import { type CreateTeacherInput, type Teacher } from '../schema';

export const createTeacher = async (input: CreateTeacherInput): Promise<Teacher> => {
  try {
    // Hash the password (simple hash for demo - in production use bcrypt or similar)
    const passwordHash = await Bun.password.hash(input.password);

    // Insert teacher record
    const result = await db.insert(teachersTable)
      .values({
        name: input.name,
        email: input.email,
        password_hash: passwordHash
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Teacher creation failed:', error);
    throw error;
  }
};
