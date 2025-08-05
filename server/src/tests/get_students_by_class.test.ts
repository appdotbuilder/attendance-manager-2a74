
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable, studentsTable } from '../db/schema';
import { getStudentsByClass } from '../handlers/get_students_by_class';

describe('getStudentsByClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return students for a specific class', async () => {
    // Create test class
    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Class A',
        grade: '10',
        academic_year: '2024'
      })
      .returning()
      .execute();

    // Create students in the class
    const studentsData = [
      { name: 'John Doe', student_id: 'STU001', class_id: testClass.id, is_attendance_recorder: false },
      { name: 'Jane Smith', student_id: 'STU002', class_id: testClass.id, is_attendance_recorder: true }
    ];

    await db.insert(studentsTable)
      .values(studentsData)
      .execute();

    const result = await getStudentsByClass(testClass.id);

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('John Doe');
    expect(result[0].student_id).toEqual('STU001');
    expect(result[0].class_id).toEqual(testClass.id);
    expect(result[0].is_attendance_recorder).toBe(false);
    expect(result[1].name).toEqual('Jane Smith');
    expect(result[1].student_id).toEqual('STU002');
    expect(result[1].class_id).toEqual(testClass.id);
    expect(result[1].is_attendance_recorder).toBe(true);
  });

  it('should return empty array when no students exist for class', async () => {
    // Create test class but no students
    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Empty Class',
        grade: '11',
        academic_year: '2024'
      })
      .returning()
      .execute();

    const result = await getStudentsByClass(testClass.id);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-existent class', async () => {
    const result = await getStudentsByClass(999);

    expect(result).toHaveLength(0);
  });

  it('should not return students from other classes', async () => {
    // Create two test classes
    const [testClass1] = await db.insert(classesTable)
      .values({
        name: 'Class A',
        grade: '10',
        academic_year: '2024'
      })
      .returning()
      .execute();

    const [testClass2] = await db.insert(classesTable)
      .values({
        name: 'Class B',
        grade: '10',
        academic_year: '2024'
      })
      .returning()
      .execute();

    // Create students in both classes
    await db.insert(studentsTable)
      .values([
        { name: 'Student A1', student_id: 'STU001', class_id: testClass1.id, is_attendance_recorder: false },
        { name: 'Student A2', student_id: 'STU002', class_id: testClass1.id, is_attendance_recorder: false },
        { name: 'Student B1', student_id: 'STU003', class_id: testClass2.id, is_attendance_recorder: false }
      ])
      .execute();

    const result = await getStudentsByClass(testClass1.id);

    expect(result).toHaveLength(2);
    expect(result.every(student => student.class_id === testClass1.id)).toBe(true);
    expect(result.some(student => student.name === 'Student B1')).toBe(false);
  });
});
