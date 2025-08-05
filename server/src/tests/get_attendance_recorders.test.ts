
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable, studentsTable } from '../db/schema';
import { type CreateClassInput, type CreateStudentInput } from '../schema';
import { getAttendanceRecorders } from '../handlers/get_attendance_recorders';

describe('getAttendanceRecorders', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return attendance recorders for a specific class', async () => {
    // Create a test class
    const classData: CreateClassInput = {
      name: 'Class A',
      grade: '10',
      academic_year: '2024/2025'
    };

    const [testClass] = await db.insert(classesTable)
      .values(classData)
      .returning()
      .execute();

    // Create students with attendance recorder flags
    const studentData: CreateStudentInput[] = [
      {
        name: 'John Recorder',
        student_id: 'STU001',
        class_id: testClass.id,
        is_attendance_recorder: true
      },
      {
        name: 'Jane Recorder',
        student_id: 'STU002',
        class_id: testClass.id,
        is_attendance_recorder: true
      },
      {
        name: 'Regular Student',
        student_id: 'STU003',
        class_id: testClass.id,
        is_attendance_recorder: false
      }
    ];

    await db.insert(studentsTable)
      .values(studentData)
      .execute();

    const result = await getAttendanceRecorders(testClass.id);

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('John Recorder');
    expect(result[0].is_attendance_recorder).toBe(true);
    expect(result[1].name).toEqual('Jane Recorder');
    expect(result[1].is_attendance_recorder).toBe(true);
  });

  it('should return empty array when no attendance recorders exist', async () => {
    // Create a test class
    const classData: CreateClassInput = {
      name: 'Class B',
      grade: '11',
      academic_year: '2024/2025'
    };

    const [testClass] = await db.insert(classesTable)
      .values(classData)
      .returning()
      .execute();

    // Create students without attendance recorder flags
    const studentData: CreateStudentInput[] = [
      {
        name: 'Regular Student 1',
        student_id: 'STU004',
        class_id: testClass.id,
        is_attendance_recorder: false
      },
      {
        name: 'Regular Student 2',
        student_id: 'STU005',
        class_id: testClass.id,
        is_attendance_recorder: false
      }
    ];

    await db.insert(studentsTable)
      .values(studentData)
      .execute();

    const result = await getAttendanceRecorders(testClass.id);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-existent class', async () => {
    const result = await getAttendanceRecorders(999);

    expect(result).toHaveLength(0);
  });

  it('should only return recorders from specified class', async () => {
    // Create two test classes
    const classData1: CreateClassInput = {
      name: 'Class C',
      grade: '10',
      academic_year: '2024/2025'
    };

    const classData2: CreateClassInput = {
      name: 'Class D',
      grade: '11',
      academic_year: '2024/2025'
    };

    const [testClass1] = await db.insert(classesTable)
      .values(classData1)
      .returning()
      .execute();

    const [testClass2] = await db.insert(classesTable)
      .values(classData2)
      .returning()
      .execute();

    // Create attendance recorders in both classes
    const studentData: CreateStudentInput[] = [
      {
        name: 'Class C Recorder',
        student_id: 'STU006',
        class_id: testClass1.id,
        is_attendance_recorder: true
      },
      {
        name: 'Class D Recorder',
        student_id: 'STU007',
        class_id: testClass2.id,
        is_attendance_recorder: true
      }
    ];

    await db.insert(studentsTable)
      .values(studentData)
      .execute();

    const result = await getAttendanceRecorders(testClass1.id);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Class C Recorder');
    expect(result[0].class_id).toEqual(testClass1.id);
  });
});
