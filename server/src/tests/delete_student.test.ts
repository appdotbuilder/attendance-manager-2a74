
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable, studentsTable, attendanceRecordsTable } from '../db/schema';
import { deleteStudent } from '../handlers/delete_student';
import { eq } from 'drizzle-orm';

describe('deleteStudent', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a student successfully', async () => {
    // Create a class first
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        grade: '10',
        academic_year: '2024'
      })
      .returning()
      .execute();
    const classId = classResult[0].id;

    // Create a student
    const studentResult = await db.insert(studentsTable)
      .values({
        name: 'Test Student',
        student_id: 'ST001',
        class_id: classId,
        is_attendance_recorder: false
      })
      .returning()
      .execute();
    const studentId = studentResult[0].id;

    // Delete the student
    const result = await deleteStudent(studentId);

    expect(result).toBe(true);

    // Verify student is deleted
    const students = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, studentId))
      .execute();

    expect(students).toHaveLength(0);
  });

  it('should return false when deleting non-existent student', async () => {
    const result = await deleteStudent(999);

    expect(result).toBe(false);
  });

  it('should delete related attendance records where student is the subject', async () => {
    // Create a class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        grade: '10',
        academic_year: '2024'
      })
      .returning()
      .execute();
    const classId = classResult[0].id;

    // Create two students - one to delete, one as recorder
    const studentResult = await db.insert(studentsTable)
      .values([
        {
          name: 'Student to Delete',
          student_id: 'ST001',
          class_id: classId,
          is_attendance_recorder: false
        },
        {
          name: 'Recorder Student',
          student_id: 'ST002',
          class_id: classId,
          is_attendance_recorder: true
        }
      ])
      .returning()
      .execute();
    
    const studentToDeleteId = studentResult[0].id;
    const recorderStudentId = studentResult[1].id;

    // Create attendance record for the student to be deleted
    await db.insert(attendanceRecordsTable)
      .values({
        student_id: studentToDeleteId,
        class_id: classId,
        status: 'Hadir',
        date: '2024-01-01',
        recorded_by: recorderStudentId,
        notes: null
      })
      .execute();

    // Delete the student
    const result = await deleteStudent(studentToDeleteId);

    expect(result).toBe(true);

    // Verify attendance records are deleted
    const attendanceRecords = await db.select()
      .from(attendanceRecordsTable)
      .where(eq(attendanceRecordsTable.student_id, studentToDeleteId))
      .execute();

    expect(attendanceRecords).toHaveLength(0);
  });

  it('should delete related attendance records where student is the recorder', async () => {
    // Create a class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        grade: '10',
        academic_year: '2024'
      })
      .returning()
      .execute();
    const classId = classResult[0].id;

    // Create two students - one as recorder to delete, one as subject
    const studentResult = await db.insert(studentsTable)
      .values([
        {
          name: 'Recorder to Delete',
          student_id: 'ST001',
          class_id: classId,
          is_attendance_recorder: true
        },
        {
          name: 'Subject Student',
          student_id: 'ST002',
          class_id: classId,
          is_attendance_recorder: false
        }
      ])
      .returning()
      .execute();
    
    const recorderToDeleteId = studentResult[0].id;
    const subjectStudentId = studentResult[1].id;

    // Create attendance record recorded by the student to be deleted
    await db.insert(attendanceRecordsTable)
      .values({
        student_id: subjectStudentId,
        class_id: classId,
        status: 'Hadir',
        date: '2024-01-01',
        recorded_by: recorderToDeleteId,
        notes: null
      })
      .execute();

    // Delete the recorder student
    const result = await deleteStudent(recorderToDeleteId);

    expect(result).toBe(true);

    // Verify attendance records recorded by deleted student are deleted
    const attendanceRecords = await db.select()
      .from(attendanceRecordsTable)
      .where(eq(attendanceRecordsTable.recorded_by, recorderToDeleteId))
      .execute();

    expect(attendanceRecords).toHaveLength(0);
  });

  it('should handle cascade deletion for student with multiple attendance records', async () => {
    // Create a class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        grade: '10',
        academic_year: '2024'
      })
      .returning()
      .execute();
    const classId = classResult[0].id;

    // Create two students
    const studentResult = await db.insert(studentsTable)
      .values([
        {
          name: 'Student with Records',
          student_id: 'ST001',
          class_id: classId,
          is_attendance_recorder: true
        },
        {
          name: 'Other Student',
          student_id: 'ST002',
          class_id: classId,
          is_attendance_recorder: false
        }
      ])
      .returning()
      .execute();
    
    const mainStudentId = studentResult[0].id;
    const otherStudentId = studentResult[1].id;

    // Create multiple attendance records - both as subject and recorder
    await db.insert(attendanceRecordsTable)
      .values([
        {
          student_id: mainStudentId,
          class_id: classId,
          status: 'Hadir',
          date: '2024-01-01',
          recorded_by: otherStudentId,
          notes: null
        },
        {
          student_id: otherStudentId,
          class_id: classId,
          status: 'Sakit',
          date: '2024-01-02',
          recorded_by: mainStudentId,
          notes: 'Recorded by main student'
        }
      ])
      .execute();

    // Delete the main student
    const result = await deleteStudent(mainStudentId);

    expect(result).toBe(true);

    // Verify all related attendance records are deleted
    const subjectRecords = await db.select()
      .from(attendanceRecordsTable)
      .where(eq(attendanceRecordsTable.student_id, mainStudentId))
      .execute();

    const recorderRecords = await db.select()
      .from(attendanceRecordsTable)
      .where(eq(attendanceRecordsTable.recorded_by, mainStudentId))
      .execute();

    expect(subjectRecords).toHaveLength(0);
    expect(recorderRecords).toHaveLength(0);

    // Verify student is deleted
    const students = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, mainStudentId))
      .execute();

    expect(students).toHaveLength(0);
  });
});
