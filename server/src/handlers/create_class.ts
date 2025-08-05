
import { db } from '../db';
import { classesTable } from '../db/schema';
import { type CreateClassInput, type Class } from '../schema';

export const createClass = async (input: CreateClassInput): Promise<Class> => {
  try {
    // Insert class record
    const result = await db.insert(classesTable)
      .values({
        name: input.name,
        grade: input.grade,
        academic_year: input.academic_year
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Class creation failed:', error);
    throw error;
  }
};
