
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable } from '../db/schema';
import { type UpdateClassInput, type CreateClassInput } from '../schema';
import { updateClass } from '../handlers/update_class';
import { eq } from 'drizzle-orm';

// Test input for creating initial class
const testCreateInput: CreateClassInput = {
  name: 'Original Class',
  grade: '10A',
  academic_year: '2023/2024'
};

describe('updateClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all class fields', async () => {
    // Create initial class
    const initialClass = await db.insert(classesTable)
      .values(testCreateInput)
      .returning()
      .execute();

    const updateInput: UpdateClassInput = {
      id: initialClass[0].id,
      name: 'Updated Class Name',
      grade: '11B',
      academic_year: '2024/2025'
    };

    const result = await updateClass(updateInput);

    expect(result.id).toEqual(initialClass[0].id);
    expect(result.name).toEqual('Updated Class Name');
    expect(result.grade).toEqual('11B');
    expect(result.academic_year).toEqual('2024/2025');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    // Create initial class
    const initialClass = await db.insert(classesTable)
      .values(testCreateInput)
      .returning()
      .execute();

    const updateInput: UpdateClassInput = {
      id: initialClass[0].id,
      name: 'Partially Updated Class'
    };

    const result = await updateClass(updateInput);

    expect(result.id).toEqual(initialClass[0].id);
    expect(result.name).toEqual('Partially Updated Class');
    expect(result.grade).toEqual('10A'); // Should remain unchanged
    expect(result.academic_year).toEqual('2023/2024'); // Should remain unchanged
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated class to database', async () => {
    // Create initial class
    const initialClass = await db.insert(classesTable)
      .values(testCreateInput)
      .returning()
      .execute();

    const updateInput: UpdateClassInput = {
      id: initialClass[0].id,
      name: 'Database Updated Class',
      grade: '12C'
    };

    await updateClass(updateInput);

    // Verify in database
    const classes = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, initialClass[0].id))
      .execute();

    expect(classes).toHaveLength(1);
    expect(classes[0].name).toEqual('Database Updated Class');
    expect(classes[0].grade).toEqual('12C');
    expect(classes[0].academic_year).toEqual('2023/2024'); // Should remain unchanged
  });

  it('should throw error for non-existent class', async () => {
    const updateInput: UpdateClassInput = {
      id: 999,
      name: 'Non-existent Class'
    };

    await expect(updateClass(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should update grade field only', async () => {
    // Create initial class
    const initialClass = await db.insert(classesTable)
      .values(testCreateInput)
      .returning()
      .execute();

    const updateInput: UpdateClassInput = {
      id: initialClass[0].id,
      grade: 'Updated Grade Only'
    };

    const result = await updateClass(updateInput);

    expect(result.name).toEqual('Original Class'); // Should remain unchanged
    expect(result.grade).toEqual('Updated Grade Only');
    expect(result.academic_year).toEqual('2023/2024'); // Should remain unchanged
  });

  it('should update academic year field only', async () => {
    // Create initial class
    const initialClass = await db.insert(classesTable)
      .values(testCreateInput)
      .returning()
      .execute();

    const updateInput: UpdateClassInput = {
      id: initialClass[0].id,
      academic_year: '2025/2026'
    };

    const result = await updateClass(updateInput);

    expect(result.name).toEqual('Original Class'); // Should remain unchanged
    expect(result.grade).toEqual('10A'); // Should remain unchanged
    expect(result.academic_year).toEqual('2025/2026');
  });
});
