
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable, studentsTable, attendanceRecordsTable } from '../db/schema';
import { type WeeklyAttendanceQuery } from '../schema';
import { getWeeklyAttendance } from '../handlers/get_weekly_attendance';

describe('getWeeklyAttendance', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return attendance records for a specific week', async () => {
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
    const recorder = studentResults[0];
    const student = studentResults[1];

    // Create attendance records for the week
    const weekStart = new Date('2024-01-01'); // Monday
    const weekDates = [
      '2024-01-01', // Monday (start of week)
      '2024-01-02', // Tuesday
      '2024-01-03', // Wednesday
      '2024-01-07'  // Sunday (end of week)
    ];

    await db.insert(attendanceRecordsTable)
      .values([
        {
          student_id: student.id,
          class_id: testClass.id,
          status: 'Hadir',
          date: weekDates[0],
          recorded_by: recorder.id,
          notes: 'On time'
        },
        {
          student_id: student.id,
          class_id: testClass.id,
          status: 'Sakit',
          date: weekDates[1],
          recorded_by: recorder.id,
          notes: 'Fever'
        },
        {
          student_id: student.id,
          class_id: testClass.id,
          status: 'Hadir',
          date: weekDates[2],
          recorded_by: recorder.id
        },
        {
          student_id: student.id,
          class_id: testClass.id,  
          status: 'Izin',
          date: weekDates[3],
          recorded_by: recorder.id,
          notes: 'Family event'
        }
      ])
      .execute();

    // Query weekly attendance
    const query: WeeklyAttendanceQuery = {
      class_id: testClass.id,
      week_start: weekStart
    };

    const result = await getWeeklyAttendance(query);

    // Verify results
    expect(result).toHaveLength(4);
    
    // Check that all records belong to the correct class
    result.forEach(record => {
      expect(record.class_id).toEqual(testClass.id);
      expect(record.student_id).toEqual(student.id);
      expect(record.recorded_by).toEqual(recorder.id);
      expect(record.date).toBeInstanceOf(Date);
      expect(record.created_at).toBeInstanceOf(Date);
    });

    // Verify specific attendance statuses
    const statuses = result.map(r => r.status).sort();
    expect(statuses).toEqual(['Hadir', 'Hadir', 'Izin', 'Sakit']);
  });

  it('should return empty array when no attendance records exist for the week', async () => {
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

    const query: WeeklyAttendanceQuery = {
      class_id: testClass.id,
      week_start: new Date('2024-01-01')
    };

    const result = await getWeeklyAttendance(query);

    expect(result).toHaveLength(0);
  });

  it('should not return records outside the week range', async () => {
    // Create test class and student
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Range Test Class',
        grade: '12',
        academic_year: '2024/2025'
      })
      .returning()
      .execute();
    const testClass = classResult[0];

    const studentResults = await db.insert(studentsTable)
      .values([
        {
          name: 'Test Student',
          student_id: 'S003',
          class_id: testClass.id,
          is_attendance_recorder: true
        }
      ])
      .returning()
      .execute();
    const student = studentResults[0];

    // Create records before, during, and after the target week
    await db.insert(attendanceRecordsTable)
      .values([
        {
          student_id: student.id,
          class_id: testClass.id,
          status: 'Hadir',
          date: '2023-12-31', // Day before week starts
          recorded_by: student.id
        },
        {
          student_id: student.id,
          class_id: testClass.id,
          status: 'Hadir',
          date: '2024-01-01', // Week start (should be included)
          recorded_by: student.id
        },
        {
          student_id: student.id,
          class_id: testClass.id,
          status: 'Hadir',
          date: '2024-01-07', // Week end (should be included)
          recorded_by: student.id
        },
        {
          student_id: student.id,
          class_id: testClass.id,
          status: 'Hadir',
          date: '2024-01-08', // Day after week ends
          recorded_by: student.id
        }
      ])
      .execute();

    const query: WeeklyAttendanceQuery = {
      class_id: testClass.id,
      week_start: new Date('2024-01-01')
    };

    const result = await getWeeklyAttendance(query);

    // Should only return records from Jan 1-7 (2 records)
    expect(result).toHaveLength(2);
    
    const dates = result.map(r => r.date.toISOString().split('T')[0]).sort();
    expect(dates).toEqual(['2024-01-01', '2024-01-07']);
  });

  it('should only return records for the specified class', async () => {
    // Create two test classes
    const classResults = await db.insert(classesTable)
      .values([
        {
          name: 'Class A',
          grade: '10',
          academic_year: '2024/2025'
        },
        {
          name: 'Class B',
          grade: '11',
          academic_year: '2024/2025'
        }
      ])
      .returning()
      .execute();
    const classA = classResults[0];
    const classB = classResults[1];

    // Create students for both classes
    const studentResults = await db.insert(studentsTable)
      .values([
        {
          name: 'Student A',
          student_id: 'SA001',
          class_id: classA.id,
          is_attendance_recorder: true
        },
        {
          name: 'Student B',
          student_id: 'SB001',
          class_id: classB.id,
          is_attendance_recorder: true
        }
      ])
      .returning()
      .execute();
    const studentA = studentResults[0];
    const studentB = studentResults[1];

    // Create attendance records for both classes on the same date
    await db.insert(attendanceRecordsTable)
      .values([
        {
          student_id: studentA.id,
          class_id: classA.id,
          status: 'Hadir',
          date: '2024-01-01',
          recorded_by: studentA.id
        },
        {
          student_id: studentB.id,
          class_id: classB.id,
          status: 'Sakit',
          date: '2024-01-01',
          recorded_by: studentB.id
        }
      ])
      .execute();

    // Query attendance for Class A only
    const query: WeeklyAttendanceQuery = {
      class_id: classA.id,
      week_start: new Date('2024-01-01')
    };

    const result = await getWeeklyAttendance(query);

    // Should only return records for Class A
    expect(result).toHaveLength(1);
    expect(result[0].class_id).toEqual(classA.id);
    expect(result[0].student_id).toEqual(studentA.id);
    expect(result[0].status).toEqual('Hadir');
  });
});
