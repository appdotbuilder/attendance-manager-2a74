
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable } from '../db/schema';
import { type CreateClassInput } from '../schema';
import { createClass } from '../handlers/create_class';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateClassInput = {
  name: 'XI IPA 1',
  grade: '11',
  academic_year: '2023/2024'
};

describe('createClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a class', async () => {
    const result = await createClass(testInput);

    // Basic field validation
    expect(result.name).toEqual('XI IPA 1');
    expect(result.grade).toEqual('11');
    expect(result.academic_year).toEqual('2023/2024');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save class to database', async () => {
    const result = await createClass(testInput);

    // Query to verify data was saved
    const classes = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, result.id))
      .execute();

    expect(classes).toHaveLength(1);
    expect(classes[0].name).toEqual('XI IPA 1');
    expect(classes[0].grade).toEqual('11');
    expect(classes[0].academic_year).toEqual('2023/2024');
    expect(classes[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple classes with different names', async () => {
    const class1 = await createClass({
      name: 'XI IPA 1',
      grade: '11',
      academic_year: '2023/2024'
    });

    const class2 = await createClass({
      name: 'XI IPS 1',
      grade: '11',
      academic_year: '2023/2024'
    });

    expect(class1.id).not.toEqual(class2.id);
    expect(class1.name).toEqual('XI IPA 1');
    expect(class2.name).toEqual('XI IPS 1');

    // Verify both classes exist in database
    const classes = await db.select()
      .from(classesTable)
      .execute();

    expect(classes).toHaveLength(2);
  });
});
