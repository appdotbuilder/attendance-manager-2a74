
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createClassInputSchema,
  createStudentInputSchema,
  createTeacherInputSchema,
  recordAttendanceInputSchema,
  teacherLoginInputSchema,
  dailyAttendanceQuerySchema,
  weeklyAttendanceQuerySchema,
  monthlyAttendanceQuerySchema,
  updateClassInputSchema,
  updateStudentInputSchema
} from './schema';

// Import handlers
import { createClass } from './handlers/create_class';
import { getClasses } from './handlers/get_classes';
import { createStudent } from './handlers/create_student';
import { getStudentsByClass } from './handlers/get_students_by_class';
import { getAttendanceRecorders } from './handlers/get_attendance_recorders';
import { recordAttendance } from './handlers/record_attendance';
import { createTeacher } from './handlers/create_teacher';
import { teacherLogin } from './handlers/teacher_login';
import { getDailyAttendance } from './handlers/get_daily_attendance';
import { getWeeklyAttendance } from './handlers/get_weekly_attendance';
import { getMonthlyAttendance } from './handlers/get_monthly_attendance';
import { updateClass } from './handlers/update_class';
import { updateStudent } from './handlers/update_student';
import { deleteClass } from './handlers/delete_class';
import { deleteStudent } from './handlers/delete_student';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Class management routes
  createClass: publicProcedure
    .input(createClassInputSchema)
    .mutation(({ input }) => createClass(input)),
  
  getClasses: publicProcedure
    .query(() => getClasses()),
  
  updateClass: publicProcedure
    .input(updateClassInputSchema)
    .mutation(({ input }) => updateClass(input)),
  
  deleteClass: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteClass(input.id)),

  // Student management routes
  createStudent: publicProcedure
    .input(createStudentInputSchema)
    .mutation(({ input }) => createStudent(input)),
  
  getStudentsByClass: publicProcedure
    .input(z.object({ classId: z.number() }))
    .query(({ input }) => getStudentsByClass(input.classId)),
  
  getAttendanceRecorders: publicProcedure
    .input(z.object({ classId: z.number() }))
    .query(({ input }) => getAttendanceRecorders(input.classId)),
  
  updateStudent: publicProcedure
    .input(updateStudentInputSchema)
    .mutation(({ input }) => updateStudent(input)),
  
  deleteStudent: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteStudent(input.id)),

  // Attendance recording routes (public - no login required)
  recordAttendance: publicProcedure
    .input(recordAttendanceInputSchema)
    .mutation(({ input }) => recordAttendance(input)),

  // Teacher authentication routes
  createTeacher: publicProcedure
    .input(createTeacherInputSchema)
    .mutation(({ input }) => createTeacher(input)),
  
  teacherLogin: publicProcedure
    .input(teacherLoginInputSchema)
    .mutation(({ input }) => teacherLogin(input)),

  // Attendance reporting routes (for teachers)
  getDailyAttendance: publicProcedure
    .input(dailyAttendanceQuerySchema)
    .query(({ input }) => getDailyAttendance(input)),
  
  getWeeklyAttendance: publicProcedure
    .input(weeklyAttendanceQuerySchema)
    .query(({ input }) => getWeeklyAttendance(input)),
  
  getMonthlyAttendance: publicProcedure
    .input(monthlyAttendanceQuerySchema)
    .query(({ input }) => getMonthlyAttendance(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
