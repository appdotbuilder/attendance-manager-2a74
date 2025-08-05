
import { serial, text, pgTable, timestamp, integer, boolean, date, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Attendance status enum
export const attendanceStatusEnum = pgEnum('attendance_status', ['Hadir', 'Sakit', 'Izin', 'Alfa', 'Dispen']);

// Classes table
export const classesTable = pgTable('classes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  grade: text('grade').notNull(),
  academic_year: text('academic_year').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Students table
export const studentsTable = pgTable('students', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  student_id: text('student_id').notNull().unique(),
  class_id: integer('class_id').notNull().references(() => classesTable.id),
  is_attendance_recorder: boolean('is_attendance_recorder').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Teachers table
export const teachersTable = pgTable('teachers', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Attendance records table
export const attendanceRecordsTable = pgTable('attendance_records', {
  id: serial('id').primaryKey(),
  student_id: integer('student_id').notNull().references(() => studentsTable.id),
  class_id: integer('class_id').notNull().references(() => classesTable.id),
  status: attendanceStatusEnum('status').notNull(),
  date: date('date').notNull(),
  recorded_by: integer('recorded_by').notNull().references(() => studentsTable.id),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const classesRelations = relations(classesTable, ({ many }) => ({
  students: many(studentsTable),
  attendanceRecords: many(attendanceRecordsTable),
}));

export const studentsRelations = relations(studentsTable, ({ one, many }) => ({
  class: one(classesTable, {
    fields: [studentsTable.class_id],
    references: [classesTable.id],
  }),
  attendanceRecords: many(attendanceRecordsTable, {
    relationName: 'student_attendance',
  }),
  recordedAttendances: many(attendanceRecordsTable, {
    relationName: 'recorder_attendance',
  }),
}));

export const attendanceRecordsRelations = relations(attendanceRecordsTable, ({ one }) => ({
  student: one(studentsTable, {
    fields: [attendanceRecordsTable.student_id],
    references: [studentsTable.id],
    relationName: 'student_attendance',
  }),
  recorder: one(studentsTable, {
    fields: [attendanceRecordsTable.recorded_by],
    references: [studentsTable.id],
    relationName: 'recorder_attendance',
  }),
  class: one(classesTable, {
    fields: [attendanceRecordsTable.class_id],
    references: [classesTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Class = typeof classesTable.$inferSelect;
export type NewClass = typeof classesTable.$inferInsert;
export type Student = typeof studentsTable.$inferSelect;
export type NewStudent = typeof studentsTable.$inferInsert;
export type Teacher = typeof teachersTable.$inferSelect;
export type NewTeacher = typeof teachersTable.$inferInsert;
export type AttendanceRecord = typeof attendanceRecordsTable.$inferSelect;
export type NewAttendanceRecord = typeof attendanceRecordsTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  classes: classesTable,
  students: studentsTable,
  teachers: teachersTable,
  attendanceRecords: attendanceRecordsTable,
};
