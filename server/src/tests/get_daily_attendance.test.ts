
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable, studentsTable, attendanceRecordsTable } from '../db/schema';
import { type DailyAttendanceQuery } from '../schema';
import { getDailyAttendance } from '../handlers/get_daily_attendance';

describe('getDailyAttendance', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch attendance records for a specific class and date', async () => {
    // Create test class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        grade: '10',
        academic_year: '2024/2025'
      })
      .returning()
      .execute();
    const testClass = classResult[0];

    // Create test students
    const studentResults = await db.insert(studentsTable)
      .values([
        {
          name: 'Student 1',
          student_id: 'S001',
          class_id: testClass.id,
          is_attendance_recorder: true
        },
        {
          name: 'Student 2',
          student_id: 'S002',
          class_id: testClass.id,
          is_attendance_recorder: false
        }
      ])
      .returning()
      .execute();
    const [recorder, student] = studentResults;

    // Create test date and convert to ISO string for database insertion
    const testDate = new Date('2024-01-15');
    const testDateString = testDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD

    // Create attendance records for the test date
    await db.insert(attendanceRecordsTable)
      .values([
        {
          student_id: student.id,
          class_id: testClass.id,
          status: 'Hadir',
          date: testDateString,
          recorded_by: recorder.id,
          notes: 'Present on time'
        },
        {
          student_id: recorder.id,
          class_id: testClass.id,
          status: 'Sakit',
          date: testDateString,
          recorded_by: recorder.id,
          notes: 'Flu symptoms'
        }
      ])
      .execute();

    // Create attendance record for different date (should not be included)
    const differentDate = new Date('2024-01-16');
    const differentDateString = differentDate.toISOString().split('T')[0];
    await db.insert(attendanceRecordsTable)
      .values({
        student_id: student.id,
        class_id: testClass.id,
        status: 'Alfa',
        date: differentDateString,
        recorded_by: recorder.id,
        notes: null
      })
      .execute();

    // Query daily attendance
    const query: DailyAttendanceQuery = {
      class_id: testClass.id,
      date: testDate
    };

    const results = await getDailyAttendance(query);

    // Verify results
    expect(results).toHaveLength(2);
    
    // Check first record
    const hadirRecord = results.find(r => r.status === 'Hadir');
    expect(hadirRecord).toBeDefined();
    expect(hadirRecord!.student_id).toEqual(student.id);
    expect(hadirRecord!.class_id).toEqual(testClass.id);
    expect(hadirRecord!.date).toEqual(testDate);
    expect(hadirRecord!.recorded_by).toEqual(recorder.id);
    expect(hadirRecord!.notes).toEqual('Present on time');
    expect(hadirRecord!.id).toBeDefined();
    expect(hadirRecord!.created_at).toBeInstanceOf(Date);

    // Check second record
    const sakitRecord = results.find(r => r.status === 'Sakit');
    expect(sakitRecord).toBeDefined();
    expect(sakitRecord!.student_id).toEqual(recorder.id);
    expect(sakitRecord!.status).toEqual('Sakit');
    expect(sakitRecord!.notes).toEqual('Flu symptoms');
  });

  it('should return empty array when no attendance records exist for the date', async () => {
    // Create test class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Empty Class',
        grade: '11',
        academic_year: '2024/2025'
      })
      .returning()
      .execute();
    const testClass = classResult[0];

    const query: DailyAttendanceQuery = {
      class_id: testClass.id,
      date: new Date('2024-01-15')
    };

    const results = await getDailyAttendance(query);

    expect(results).toHaveLength(0);
  });

  it('should return empty array for non-existent class', async () => {
    const query: DailyAttendanceQuery = {
      class_id: 999, // Non-existent class ID
      date: new Date('2024-01-15')
    };

    const results = await getDailyAttendance(query);

    expect(results).toHaveLength(0);
  });

  it('should handle records with null notes', async () => {
    // Create test class and student
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        grade: '12',
        academic_year: '2024/2025'
      })
      .returning()
      .execute();
    const testClass = classResult[0];

    const studentResult = await db.insert(studentsTable)
      .values({
        name: 'Test Student',
        student_id: 'S003',
        class_id: testClass.id,
        is_attendance_recorder: true
      })
      .returning()
      .execute();
    const student = studentResult[0];

    const testDate = new Date('2024-01-20');
    const testDateString = testDate.toISOString().split('T')[0];

    // Create attendance record with null notes
    await db.insert(attendanceRecordsTable)
      .values({
        student_id: student.id,
        class_id: testClass.id,
        status: 'Izin',
        date: testDateString,
        recorded_by: student.id,
        notes: null
      })
      .execute();

    const query: DailyAttendanceQuery = {
      class_id: testClass.id,
      date: testDate
    };

    const results = await getDailyAttendance(query);

    expect(results).toHaveLength(1);
    expect(results[0].notes).toBeNull();
    expect(results[0].status).toEqual('Izin');
  });
});
