
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable } from '../db/schema';
import { type CreateClassInput } from '../schema';
import { getClasses } from '../handlers/get_classes';

// Test class data
const testClass1: CreateClassInput = {
  name: 'Kelas A',
  grade: '10',
  academic_year: '2023/2024'
};

const testClass2: CreateClassInput = {
  name: 'Kelas B',
  grade: '11',
  academic_year: '2023/2024'
};

const testClass3: CreateClassInput = {
  name: 'Kelas C',
  grade: '12',
  academic_year: '2022/2023'
};

describe('getClasses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no classes exist', async () => {
    const result = await getClasses();

    expect(result).toEqual([]);
  });

  it('should return all classes from database', async () => {
    // Create test classes
    await db.insert(classesTable)
      .values([testClass1, testClass2, testClass3])
      .execute();

    const result = await getClasses();

    expect(result).toHaveLength(3);
    
    // Check that all classes are returned
    const classNames = result.map(c => c.name);
    expect(classNames).toContain('Kelas A');
    expect(classNames).toContain('Kelas B');
    expect(classNames).toContain('Kelas C');
  });

  it('should return classes with all required fields', async () => {
    // Create single test class
    await db.insert(classesTable)
      .values(testClass1)
      .execute();

    const result = await getClasses();

    expect(result).toHaveLength(1);
    const classData = result[0];

    // Verify all required fields exist
    expect(classData.id).toBeDefined();
    expect(typeof classData.id).toBe('number');
    expect(classData.name).toEqual('Kelas A');
    expect(classData.grade).toEqual('10');
    expect(classData.academic_year).toEqual('2023/2024');
    expect(classData.created_at).toBeInstanceOf(Date);
  });

  it('should return classes ordered consistently', async () => {
    // Create test classes
    await db.insert(classesTable)
      .values([testClass1, testClass2, testClass3])
      .execute();

    const result1 = await getClasses();
    const result2 = await getClasses();

    // Results should be consistent between calls
    expect(result1).toHaveLength(3);
    expect(result2).toHaveLength(3);
    
    // Check that IDs are in same order
    const ids1 = result1.map(c => c.id);
    const ids2 = result2.map(c => c.id);
    expect(ids1).toEqual(ids2);
  });
});
