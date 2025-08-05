
import { db } from '../db';
import { attendanceRecordsTable, studentsTable, classesTable } from '../db/schema';
import { type RecordAttendanceInput, type AttendanceRecord } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function recordAttendance(input: RecordAttendanceInput): Promise<AttendanceRecord> {
  try {
    // Verify that the class exists first
    const classExists = await db.select()
      .from(classesTable)
      .where(eq(classesTable.id, input.class_id))
      .execute();

    if (classExists.length === 0) {
      throw new Error('Class not found');
    }

    // Verify that the student exists
    const studentExists = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, input.student_id))
      .execute();

    if (studentExists.length === 0) {
      throw new Error('Student not found');
    }

    // Verify that the student belongs to the class
    if (studentExists[0].class_id !== input.class_id) {
      throw new Error('Student not found in the specified class');
    }

    // Verify that the recorder exists and is an attendance recorder
    const recorder = await db.select()
      .from(studentsTable)
      .where(eq(studentsTable.id, input.recorded_by))
      .execute();

    if (recorder.length === 0) {
      throw new Error('Recorder not found');
    }

    if (!recorder[0].is_attendance_recorder) {
      throw new Error('Student is not authorized to record attendance');
    }

    // Insert attendance record
    const result = await db.insert(attendanceRecordsTable)
      .values({
        student_id: input.student_id,
        class_id: input.class_id,
        status: input.status,
        date: input.date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        recorded_by: input.recorded_by,
        notes: input.notes || null
      })
      .returning()
      .execute();

    const attendanceRecord = result[0];
    return {
      ...attendanceRecord,
      date: new Date(attendanceRecord.date) // Convert date string back to Date
    };
  } catch (error) {
    console.error('Attendance recording failed:', error);
    throw error;
  }
}
