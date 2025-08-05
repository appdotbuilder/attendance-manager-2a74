
import { z } from 'zod';

// Attendance status enum
export const attendanceStatusSchema = z.enum(['Hadir', 'Sakit', 'Izin', 'Alfa', 'Dispen']);
export type AttendanceStatus = z.infer<typeof attendanceStatusSchema>;

// Class schema
export const classSchema = z.object({
  id: z.number(),
  name: z.string(),
  grade: z.string(),
  academic_year: z.string(),
  created_at: z.coerce.date()
});
export type Class = z.infer<typeof classSchema>;

// Student schema
export const studentSchema = z.object({
  id: z.number(),
  name: z.string(),
  student_id: z.string(),
  class_id: z.number(),
  is_attendance_recorder: z.boolean(),
  created_at: z.coerce.date()
});
export type Student = z.infer<typeof studentSchema>;

// Teacher schema
export const teacherSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  password_hash: z.string(),
  created_at: z.coerce.date()
});
export type Teacher = z.infer<typeof teacherSchema>;

// Attendance record schema
export const attendanceRecordSchema = z.object({
  id: z.number(),
  student_id: z.number(),
  class_id: z.number(),
  status: attendanceStatusSchema,
  date: z.coerce.date(),
  recorded_by: z.number(),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});
export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>;

// Input schemas for creating entities
export const createClassInputSchema = z.object({
  name: z.string(),
  grade: z.string(),
  academic_year: z.string()
});
export type CreateClassInput = z.infer<typeof createClassInputSchema>;

export const createStudentInputSchema = z.object({
  name: z.string(),
  student_id: z.string(),
  class_id: z.number(),
  is_attendance_recorder: z.boolean().default(false)
});
export type CreateStudentInput = z.infer<typeof createStudentInputSchema>;

export const createTeacherInputSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(6)
});
export type CreateTeacherInput = z.infer<typeof createTeacherInputSchema>;

export const recordAttendanceInputSchema = z.object({
  student_id: z.number(),
  class_id: z.number(),
  status: attendanceStatusSchema,
  date: z.coerce.date(),
  recorded_by: z.number(),
  notes: z.string().nullable().optional()
});
export type RecordAttendanceInput = z.infer<typeof recordAttendanceInputSchema>;

// Teacher login schema
export const teacherLoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});
export type TeacherLoginInput = z.infer<typeof teacherLoginInputSchema>;

// Attendance report query schemas
export const dailyAttendanceQuerySchema = z.object({
  class_id: z.number(),
  date: z.coerce.date()
});
export type DailyAttendanceQuery = z.infer<typeof dailyAttendanceQuerySchema>;

export const weeklyAttendanceQuerySchema = z.object({
  class_id: z.number(),
  week_start: z.coerce.date()
});
export type WeeklyAttendanceQuery = z.infer<typeof weeklyAttendanceQuerySchema>;

export const monthlyAttendanceQuerySchema = z.object({
  class_id: z.number(),
  month: z.number().min(1).max(12),
  year: z.number()
});
export type MonthlyAttendanceQuery = z.infer<typeof monthlyAttendanceQuerySchema>;

// Update schemas
export const updateClassInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  grade: z.string().optional(),
  academic_year: z.string().optional()
});
export type UpdateClassInput = z.infer<typeof updateClassInputSchema>;

export const updateStudentInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  student_id: z.string().optional(),
  class_id: z.number().optional(),
  is_attendance_recorder: z.boolean().optional()
});
export type UpdateStudentInput = z.infer<typeof updateStudentInputSchema>;

// Attendance summary schema
export const attendanceSummarySchema = z.object({
  student_id: z.number(),
  student_name: z.string(),
  total_days: z.number(),
  hadir: z.number(),
  sakit: z.number(),
  izin: z.number(),
  alfa: z.number(),
  dispen: z.number(),
  attendance_percentage: z.number()
});
export type AttendanceSummary = z.infer<typeof attendanceSummarySchema>;
