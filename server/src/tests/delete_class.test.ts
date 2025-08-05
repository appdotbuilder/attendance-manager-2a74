
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable, studentsTable, attendanceRecordsTable } from '../db/schema';
import { deleteClass } from '../handlers/delete_class';
import { eq } from 'drizzle-orm';

describe('deleteClass', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a class that exists', async () => {
    // Create test class
    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        grade: '12',
        academic_year: '2024/2025'
      })
      .returning()
      .execute();

    const result = await deleteClass(testClass.id);

    expect(result).toBe(true);

    // Verify class is deleted
    const classes = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, testClass.id))
      .execute();

    expect(classes).toHaveLength(0);
  });

  it('should return false when deleting non-existent class', async () => {
    const result = await deleteClass(999);

    expect(result).toBe(false);
  });

  it('should cascade delete students in the class', async () => {
    // Create test class
    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        grade: '12',
        academic_year: '2024/2025'
      })
      .returning()
      .execute();

    // Create test students
    const [student1, student2] = await db.insert(studentsTable)
      .values([
        {
          name: 'Student 1',
          student_id: 'S001',
          class_id: testClass.id,
          is_attendance_recorder: false
        },
        {
          name: 'Student 2',
          student_id: 'S002',
          class_id: testClass.id,
          is_attendance_recorder: true
        }
      ])
      .returning()
      .execute();

    const result = await deleteClass(testClass.id);

    expect(result).toBe(true);

    // Verify students are deleted
    const students = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.class_id, testClass.id))
      .execute();

    expect(students).toHaveLength(0);
  });

  it('should cascade delete attendance records for the class', async () => {
    // Create test class
    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        grade: '12',
        academic_year: '2024/2025'
      })
      .returning()
      .execute();

    // Create test students
    const [student1, student2] = await db.insert(studentsTable)
      .values([
        {
          name: 'Student 1',
          student_id: 'S001',
          class_id: testClass.id,
          is_attendance_recorder: false
        },
        {
          name: 'Student 2',
          student_id: 'S002',
          class_id: testClass.id,
          is_attendance_recorder: true
        }
      ])
      .returning()
      .execute();

    // Create test attendance records
    await db.insert(attendanceRecordsTable)
      .values([
        {
          student_id: student1.id,
          class_id: testClass.id,
          status: 'Hadir',
          date: '2024-01-15',
          recorded_by: student2.id,
          notes: 'Present today'
        },
        {
          student_id: student2.id,
          class_id: testClass.id,
          status: 'Sakit',
          date: '2024-01-15',
          recorded_by: student2.id,
          notes: 'Sick leave'
        }
      ])
      .execute();

    const result = await deleteClass(testClass.id);

    expect(result).toBe(true);

    // Verify attendance records are deleted
    const attendanceRecords = await db.select()
      .from(attendanceRecordsTable)
      .where(eq(attendanceRecordsTable.class_id, testClass.id))
      .execute();

    expect(attendanceRecords).toHaveLength(0);
  });

  it('should handle deletion of class with no students or attendance records', async () => {
    // Create test class with no students
    const [testClass] = await db.insert(classesTable)
      .values({
        name: 'Empty Class',
        grade: '10',
        academic_year: '2024/2025'
      })
      .returning()
      .execute();

    const result = await deleteClass(testClass.id);

    expect(result).toBe(true);

    // Verify class is deleted
    const classes = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, testClass.id))
      .execute();

    expect(classes).toHaveLength(0);
  });
});
