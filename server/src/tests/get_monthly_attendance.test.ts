
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { classesTable, studentsTable, attendanceRecordsTable } from '../db/schema';
import { type MonthlyAttendanceQuery } from '../schema';
import { getMonthlyAttendance } from '../handlers/get_monthly_attendance';

describe('getMonthlyAttendance', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return monthly attendance summary for all students in class', async () => {
    // Create test class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Class A',
        grade: '10',
        academic_year: '2024'
      })
      .returning()
      .execute();
    const classId = classResult[0].id;

    // Create test students
    const studentResults = await db.insert(studentsTable)
      .values([
        {
          name: 'Alice Johnson',
          student_id: 'S001',
          class_id: classId,
          is_attendance_recorder: false
        },
        {
          name: 'Bob Smith',
          student_id: 'S002', 
          class_id: classId,
          is_attendance_recorder: true
        }
      ])
      .returning()
      .execute();
    const aliceId = studentResults[0].id;
    const bobId = studentResults[1].id;

    // Create attendance records for March 2024
    await db.insert(attendanceRecordsTable)
      .values([
        // Alice's records
        {
          student_id: aliceId,
          class_id: classId,
          status: 'Hadir',
          date: '2024-03-01',
          recorded_by: bobId,
          notes: null
        },
        {
          student_id: aliceId,
          class_id: classId,
          status: 'Hadir',
          date: '2024-03-02',
          recorded_by: bobId,
          notes: null
        },
        {
          student_id: aliceId,
          class_id: classId,
          status: 'Sakit',
          date: '2024-03-03',
          recorded_by: bobId,
          notes: 'Flu'
        },
        // Bob's records
        {
          student_id: bobId,
          class_id: classId,
          status: 'Hadir',
          date: '2024-03-01',
          recorded_by: bobId,
          notes: null
        },
        {
          student_id: bobId,
          class_id: classId,
          status: 'Alfa',
          date: '2024-03-02',
          recorded_by: aliceId,
          notes: null
        }
      ])
      .execute();

    const query: MonthlyAttendanceQuery = {
      class_id: classId,
      month: 3,
      year: 2024
    };

    const result = await getMonthlyAttendance(query);

    expect(result).toHaveLength(2);
    
    // Find Alice's summary (sorted alphabetically)
    const aliceSummary = result.find(s => s.student_name === 'Alice Johnson');
    expect(aliceSummary).toBeDefined();
    expect(aliceSummary!.student_id).toEqual(aliceId);
    expect(aliceSummary!.total_days).toEqual(3);
    expect(aliceSummary!.hadir).toEqual(2);
    expect(aliceSummary!.sakit).toEqual(1);
    expect(aliceSummary!.izin).toEqual(0);
    expect(aliceSummary!.alfa).toEqual(0);
    expect(aliceSummary!.dispen).toEqual(0);
    expect(aliceSummary!.attendance_percentage).toEqual(67); // 2/3 * 100 = 66.67 rounded to 67

    // Find Bob's summary
    const bobSummary = result.find(s => s.student_name === 'Bob Smith');
    expect(bobSummary).toBeDefined();
    expect(bobSummary!.student_id).toEqual(bobId);
    expect(bobSummary!.total_days).toEqual(2);
    expect(bobSummary!.hadir).toEqual(1);
    expect(bobSummary!.sakit).toEqual(0);
    expect(bobSummary!.izin).toEqual(0);
    expect(bobSummary!.alfa).toEqual(1);
    expect(bobSummary!.dispen).toEqual(0);
    expect(bobSummary!.attendance_percentage).toEqual(50); // 1/2 * 100 = 50
  });

  it('should return students with zero attendance when no records exist', async () => {
    // Create test class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Empty Class',
        grade: '11',
        academic_year: '2024'
      })
      .returning()
      .execute();
    const classId = classResult[0].id;

    // Create student without attendance records
    await db.insert(studentsTable)
      .values({
        name: 'Charlie Brown',
        student_id: 'S003',
        class_id: classId,
        is_attendance_recorder: false
      })
      .execute();

    const query: MonthlyAttendanceQuery = {
      class_id: classId,
      month: 4,
      year: 2024
    };

    const result = await getMonthlyAttendance(query);

    expect(result).toHaveLength(1);
    expect(result[0].student_name).toEqual('Charlie Brown');
    expect(result[0].total_days).toEqual(0);
    expect(result[0].hadir).toEqual(0);
    expect(result[0].sakit).toEqual(0);
    expect(result[0].izin).toEqual(0);
    expect(result[0].alfa).toEqual(0);
    expect(result[0].dispen).toEqual(0);
    expect(result[0].attendance_percentage).toEqual(0);
  });

  it('should handle different month boundaries correctly', async () => {
    // Create test class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Test Class',
        grade: '12',
        academic_year: '2024'
      })
      .returning()
      .execute();
    const classId = classResult[0].id;

    // Create test student
    const studentResult = await db.insert(studentsTable)
      .values({
        name: 'Diana Prince',
        student_id: 'S004',
        class_id: classId,
        is_attendance_recorder: true
      })
      .returning()
      .execute();
    const dianaId = studentResult[0].id;

    // Create attendance records spanning multiple months
    await db.insert(attendanceRecordsTable)
      .values([
        // February record (should not be included)
        {
          student_id: dianaId,
          class_id: classId,
          status: 'Hadir',
          date: '2024-02-29',
          recorded_by: dianaId,
          notes: null
        },
        // March records (should be included)
        {
          student_id: dianaId,
          class_id: classId,
          status: 'Hadir',
          date: '2024-03-01',
          recorded_by: dianaId,
          notes: null
        },
        {
          student_id: dianaId,
          class_id: classId,
          status: 'Izin',
          date: '2024-03-31',
          recorded_by: dianaId,
          notes: 'Family event'
        },
        // April record (should not be included)
        {
          student_id: dianaId,
          class_id: classId,
          status: 'Hadir',
          date: '2024-04-01',
          recorded_by: dianaId,
          notes: null
        }
      ])
      .execute();

    const query: MonthlyAttendanceQuery = {
      class_id: classId,
      month: 3,
      year: 2024
    };

    const result = await getMonthlyAttendance(query);

    expect(result).toHaveLength(1);
    expect(result[0].total_days).toEqual(2); // Only March records
    expect(result[0].hadir).toEqual(1);
    expect(result[0].izin).toEqual(1);
    expect(result[0].attendance_percentage).toEqual(50);
  });

  it('should return empty array for class with no students', async () => {
    // Create empty class
    const classResult = await db.insert(classesTable)
      .values({
        name: 'Empty Class',
        grade: '9',
        academic_year: '2024'
      })
      .returning()
      .execute();
    const classId = classResult[0].id;

    const query: MonthlyAttendanceQuery = {
      class_id: classId,
      month: 5,
      year: 2024
    };

    const result = await getMonthlyAttendance(query);

    expect(result).toHaveLength(0);
  });
});
