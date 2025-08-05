
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { studentsTable, classesTable } from '../db/schema';
import { type UpdateStudentInput } from '../schema';
import { updateStudent } from '../handlers/update_student';
import { eq } from 'drizzle-orm';

describe('updateStudent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testClassId: number;
  let testStudentId: number;
  let secondClassId: number;

  beforeEach(async () => {
    // Create test classes directly in database
    const testClassResult = await db.insert(classesTable)
      .values({
        name: 'Class A',
        grade: '10',
        academic_year: '2024'
      })
      .returning()
      .execute();
    
    const secondClassResult = await db.insert(classesTable)
      .values({
        name: 'Class B',
        grade: '11',
        academic_year: '2024'
      })
      .returning()
      .execute();

    testClassId = testClassResult[0].id;
    secondClassId = secondClassResult[0].id;

    // Create test student directly in database
    const testStudentResult = await db.insert(studentsTable)
      .values({
        name: 'John Doe',
        student_id: 'STU001',
        class_id: testClassId,
        is_attendance_recorder: false
      })
      .returning()
      .execute();

    testStudentId = testStudentResult[0].id;
  });

  it('should update student name', async () => {
    const updateInput: UpdateStudentInput = {
      id: testStudentId,
      name: 'Jane Doe'
    };

    const result = await updateStudent(updateInput);

    expect(result.id).toEqual(testStudentId);
    expect(result.name).toEqual('Jane Doe');
    expect(result.student_id).toEqual('STU001'); // Should remain unchanged
    expect(result.class_id).toEqual(testClassId); // Should remain unchanged
    expect(result.is_attendance_recorder).toEqual(false); // Should remain unchanged
  });

  it('should update student_id', async () => {
    const updateInput: UpdateStudentInput = {
      id: testStudentId,
      student_id: 'STU002'
    };

    const result = await updateStudent(updateInput);

    expect(result.id).toEqual(testStudentId);
    expect(result.name).toEqual('John Doe'); // Should remain unchanged
    expect(result.student_id).toEqual('STU002');
    expect(result.class_id).toEqual(testClassId); // Should remain unchanged
    expect(result.is_attendance_recorder).toEqual(false); // Should remain unchanged
  });

  it('should update class_id', async () => {
    const updateInput: UpdateStudentInput = {
      id: testStudentId,
      class_id: secondClassId
    };

    const result = await updateStudent(updateInput);

    expect(result.id).toEqual(testStudentId);
    expect(result.name).toEqual('John Doe'); // Should remain unchanged
    expect(result.student_id).toEqual('STU001'); // Should remain unchanged
    expect(result.class_id).toEqual(secondClassId);
    expect(result.is_attendance_recorder).toEqual(false); // Should remain unchanged
  });

  it('should update attendance recorder status', async () => {
    const updateInput: UpdateStudentInput = {
      id: testStudentId,
      is_attendance_recorder: true
    };

    const result = await updateStudent(updateInput);

    expect(result.id).toEqual(testStudentId);
    expect(result.name).toEqual('John Doe'); // Should remain unchanged
    expect(result.student_id).toEqual('STU001'); // Should remain unchanged
    expect(result.class_id).toEqual(testClassId); // Should remain unchanged
    expect(result.is_attendance_recorder).toEqual(true);
  });

  it('should update multiple fields at once', async () => {
    const updateInput: UpdateStudentInput = {
      id: testStudentId,
      name: 'Updated Student',
      student_id: 'UPD001',
      class_id: secondClassId,
      is_attendance_recorder: true
    };

    const result = await updateStudent(updateInput);

    expect(result.id).toEqual(testStudentId);
    expect(result.name).toEqual('Updated Student');
    expect(result.student_id).toEqual('UPD001');
    expect(result.class_id).toEqual(secondClassId);
    expect(result.is_attendance_recorder).toEqual(true);
  });

  it('should save updated student to database', async () => {
    const updateInput: UpdateStudentInput = {
      id: testStudentId,
      name: 'Database Test Student'
    };

    const result = await updateStudent(updateInput);

    // Verify in database
    const students = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, result.id))
      .execute();

    expect(students).toHaveLength(1);
    expect(students[0].name).toEqual('Database Test Student');
    expect(students[0].student_id).toEqual('STU001');
    expect(students[0].class_id).toEqual(testClassId);
    expect(students[0].is_attendance_recorder).toEqual(false);
  });

  it('should throw error for non-existent student', async () => {
    const updateInput: UpdateStudentInput = {
      id: 99999,
      name: 'Non-existent Student'
    };

    await expect(updateStudent(updateInput)).rejects.toThrow(/Student with id 99999 not found/);
  });

  it('should handle empty update gracefully', async () => {
    const updateInput: UpdateStudentInput = {
      id: testStudentId
    };

    const result = await updateStudent(updateInput);

    // Should return existing student unchanged
    expect(result.id).toEqual(testStudentId);
    expect(result.name).toEqual('John Doe');
    expect(result.student_id).toEqual('STU001');
    expect(result.class_id).toEqual(testClassId);
    expect(result.is_attendance_recorder).toEqual(false);
  });

  it('should throw error for non-existent student in empty update', async () => {
    const updateInput: UpdateStudentInput = {
      id: 99999
    };

    await expect(updateStudent(updateInput)).rejects.toThrow(/Student with id 99999 not found/);
  });
});
