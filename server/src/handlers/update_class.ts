
import { db } from '../db';
import { classesTable } from '../db/schema';
import { type UpdateClassInput, type Class } from '../schema';
import { eq } from 'drizzle-orm';

export const updateClass = async (input: UpdateClassInput): Promise<Class> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<{
      name: string;
      grade: string;
      academic_year: string;
    }> = {};

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.grade !== undefined) {
      updateData.grade = input.grade;
    }
    if (input.academic_year !== undefined) {
      updateData.academic_year = input.academic_year;
    }

    // Update class record
    const result = await db.update(classesTable)
      .set(updateData)
      .where(eq(classesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Class with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Class update failed:', error);
    throw error;
  }
};
