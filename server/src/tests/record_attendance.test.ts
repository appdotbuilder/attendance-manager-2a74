
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable, studentsTable, attendanceRecordsTable } from '../db/schema';
import { type RecordAttendanceInput } from '../schema';
import { recordAttendance } from '../handlers/record_attendance';
import { eq, and } from 'drizzle-orm';

describe('recordAttendance', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testClass: any;
  let testStudent: any;
  let testRecorder: any;

  const setupTestData = async () => {
    // Create test class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        grade: '10',
        academic_year: '2023/2024'
      })
      .returning()
      .execute();
    testClass = classResult[0];

    // Create test student
    const studentResult = await db.insert(studentsTable)
      .values({
        name: 'Test Student',
        student_id: 'STU001',
        class_id: testClass.id,
        is_attendance_recorder: false
      })
      .returning()
      .execute();
    testStudent = studentResult[0];

    // Create test recorder (attendance recorder)
    const recorderResult = await db.insert(studentsTable)
      .values({
        name: 'Test Recorder',
        student_id: 'REC001',
        class_id: testClass.id,
        is_attendance_recorder: true
      })
      .returning()
      .execute();
    testRecorder = recorderResult[0];
  };

  it('should record attendance successfully', async () => {
    await setupTestData();

    const testInput: RecordAttendanceInput = {
      student_id: testStudent.id,
      class_id: testClass.id,
      status: 'Hadir',
      date: new Date('2023-12-01'),
      recorded_by: testRecorder.id,
      notes: 'Present on time'
    };

    const result = await recordAttendance(testInput);

    expect(result.student_id).toEqual(testStudent.id);
    expect(result.class_id).toEqual(testClass.id);
    expect(result.status).toEqual('Hadir');
    expect(result.date).toEqual(new Date('2023-12-01'));
    expect(result.recorded_by).toEqual(testRecorder.id);
    expect(result.notes).toEqual('Present on time');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should record attendance without notes', async () => {
    await setupTestData();

    const testInput: RecordAttendanceInput = {
      student_id: testStudent.id,
      class_id: testClass.id,
      status: 'Sakit',
      date: new Date('2023-12-01'),
      recorded_by: testRecorder.id
    };

    const result = await recordAttendance(testInput);

    expect(result.status).toEqual('Sakit');
    expect(result.notes).toBeNull();
  });

  it('should save attendance record to database', async () => {
    await setupTestData();

    const testInput: RecordAttendanceInput = {
      student_id: testStudent.id,
      class_id: testClass.id,
      status: 'Izin',
      date: new Date('2023-12-01'),
      recorded_by: testRecorder.id,
      notes: 'Permission granted'
    };

    const result = await recordAttendance(testInput);

    const records = await db.select()
      .from(attendanceRecordsTable)
      .where(eq(attendanceRecordsTable.id, result.id))
      .execute();

    expect(records).toHaveLength(1);
    expect(records[0].student_id).toEqual(testStudent.id);
    expect(records[0].class_id).toEqual(testClass.id);
    expect(records[0].status).toEqual('Izin');
    expect(records[0].date).toEqual('2023-12-01');
    expect(records[0].recorded_by).toEqual(testRecorder.id);
    expect(records[0].notes).toEqual('Permission granted');
    expect(records[0].created_at).toBeInstanceOf(Date);
  });

  it('should reject recording when class not found', async () => {
    await setupTestData();

    const testInput: RecordAttendanceInput = {
      student_id: testStudent.id,
      class_id: 99999, // Non-existent class
      status: 'Hadir',
      date: new Date('2023-12-01'),
      recorded_by: testRecorder.id
    };

    expect(recordAttendance(testInput)).rejects.toThrow(/class not found/i);
  });

  it('should reject recording when student not found', async () => {
    await setupTestData();

    const testInput: RecordAttendanceInput = {
      student_id: 99999,
      class_id: testClass.id,
      status: 'Hadir',
      date: new Date('2023-12-01'),
      recorded_by: testRecorder.id
    };

    expect(recordAttendance(testInput)).rejects.toThrow(/student not found/i);
  });

  it('should reject recording when student not in specified class', async () => {
    await setupTestData();

    // Create another class
    const anotherClassResult = await db.insert(classesTable)
      .values({
        name: 'Another Class',
        grade: '11',
        academic_year: '2023/2024'
      })
      .returning()
      .execute();

    const testInput: RecordAttendanceInput = {
      student_id: testStudent.id,
      class_id: anotherClassResult[0].id, // Different class
      status: 'Hadir',
      date: new Date('2023-12-01'),
      recorded_by: testRecorder.id
    };

    expect(recordAttendance(testInput)).rejects.toThrow(/student not found in the specified class/i);
  });

  it('should reject recording when recorder not found', async () => {
    await setupTestData();

    const testInput: RecordAttendanceInput = {
      student_id: testStudent.id,
      class_id: testClass.id,
      status: 'Hadir',
      date: new Date('2023-12-01'),
      recorded_by: 99999
    };

    expect(recordAttendance(testInput)).rejects.toThrow(/recorder not found/i);
  });

  it('should reject recording when recorder is not authorized', async () => {
    await setupTestData();

    const testInput: RecordAttendanceInput = {
      student_id: testStudent.id,
      class_id: testClass.id,
      status: 'Hadir',
      date: new Date('2023-12-01'),
      recorded_by: testStudent.id // Regular student, not recorder
    };

    expect(recordAttendance(testInput)).rejects.toThrow(/not authorized/i);
  });

  it('should handle all attendance statuses correctly', async () => {
    await setupTestData();

    const statuses = ['Hadir', 'Sakit', 'Izin', 'Alfa', 'Dispen'] as const;

    for (const status of statuses) {
      const testInput: RecordAttendanceInput = {
        student_id: testStudent.id,
        class_id: testClass.id,
        status: status,
        date: new Date('2023-12-01'),
        recorded_by: testRecorder.id,
        notes: `Status: ${status}`
      };

      const result = await recordAttendance(testInput);
      expect(result.status).toEqual(status);
      expect(result.notes).toEqual(`Status: ${status}`);
    }
  });
});
