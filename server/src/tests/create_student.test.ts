
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studentsTable, classesTable } from '../db/schema';
import { type CreateStudentInput } from '../schema';
import { createStudent } from '../handlers/create_student';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateStudentInput = {
  name: 'John Doe',
  student_id: 'STU001',
  class_id: 1,
  is_attendance_recorder: false
};

describe('createStudent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a student', async () => {
    // Create a class first (foreign key dependency)
    await db.insert(classesTable)
      .values({
        name: '10A',
        grade: '10',
        academic_year: '2023/2024'
      })
      .execute();

    const result = await createStudent(testInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.student_id).toEqual('STU001');
    expect(result.class_id).toEqual(1);
    expect(result.is_attendance_recorder).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save student to database', async () => {
    // Create a class first (foreign key dependency)
    await db.insert(classesTable)
      .values({
        name: '10A',
        grade: '10',
        academic_year: '2023/2024'
      })
      .execute();

    const result = await createStudent(testInput);

    // Query using proper drizzle syntax
    const students = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, result.id))
      .execute();

    expect(students).toHaveLength(1);
    expect(students[0].name).toEqual('John Doe');
    expect(students[0].student_id).toEqual('STU001');
    expect(students[0].class_id).toEqual(1);
    expect(students[0].is_attendance_recorder).toEqual(false);
    expect(students[0].created_at).toBeInstanceOf(Date);
  });

  it('should create student with attendance recorder flag', async () => {
    // Create a class first
    await db.insert(classesTable)
      .values({
        name: '10A',
        grade: '10',
        academic_year: '2023/2024'
      })
      .execute();

    const recorderInput: CreateStudentInput = {
      name: 'Jane Smith',
      student_id: 'STU002',
      class_id: 1,
      is_attendance_recorder: true
    };

    const result = await createStudent(recorderInput);

    expect(result.is_attendance_recorder).toEqual(true);
    expect(result.name).toEqual('Jane Smith');
    expect(result.student_id).toEqual('STU002');
  });

  it('should handle foreign key constraint violation', async () => {
    // Try to create student without creating class first
    const invalidInput: CreateStudentInput = {
      name: 'Invalid Student',
      student_id: 'STU999',
      class_id: 999, // Non-existent class
      is_attendance_recorder: false
    };

    await expect(createStudent(invalidInput)).rejects.toThrow(/violates foreign key constraint/i);
  });

  it('should handle duplicate student_id', async () => {
    // Create a class first
    await db.insert(classesTable)
      .values({
        name: '10A',
        grade: '10',
        academic_year: '2023/2024'
      })
      .execute();

    // Create first student
    await createStudent(testInput);

    // Try to create another student with same student_id
    const duplicateInput: CreateStudentInput = {
      name: 'Another Student',
      student_id: 'STU001', // Same as first student
      class_id: 1,
      is_attendance_recorder: false
    };

    await expect(createStudent(duplicateInput)).rejects.toThrow(/duplicate key value/i);
  });
});
