
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { teachersTable } from '../db/schema';
import { type TeacherLoginInput } from '../schema';
import { teacherLogin } from '../handlers/teacher_login';

// Test teacher data
const testTeacher = {
  name: 'Test Teacher',
  email: 'teacher@test.com',
  password: 'securepassword123'
};

const loginInput: TeacherLoginInput = {
  email: 'teacher@test.com',
  password: 'securepassword123'
};

describe('teacherLogin', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should authenticate valid teacher credentials', async () => {
    // Create teacher with hashed password
    const passwordHash = await Bun.password.hash(testTeacher.password);
    
    await db.insert(teachersTable)
      .values({
        name: testTeacher.name,
        email: testTeacher.email,
        password_hash: passwordHash
      })
      .execute();

    const result = await teacherLogin(loginInput);

    expect(result).not.toBeNull();
    expect(result?.name).toEqual('Test Teacher');
    expect(result?.email).toEqual('teacher@test.com');
    expect(result?.id).toBeDefined();
    expect(result?.created_at).toBeInstanceOf(Date);
    expect(result?.password_hash).toBeDefined();
  });

  it('should return null for invalid email', async () => {
    // Create teacher
    const passwordHash = await Bun.password.hash(testTeacher.password);
    
    await db.insert(teachersTable)
      .values({
        name: testTeacher.name,
        email: testTeacher.email,
        password_hash: passwordHash
      })
      .execute();

    const invalidEmailInput: TeacherLoginInput = {
      email: 'nonexistent@test.com',
      password: 'securepassword123'
    };

    const result = await teacherLogin(invalidEmailInput);

    expect(result).toBeNull();
  });

  it('should return null for invalid password', async () => {
    // Create teacher
    const passwordHash = await Bun.password.hash(testTeacher.password);
    
    await db.insert(teachersTable)
      .values({
        name: testTeacher.name,
        email: testTeacher.email,
        password_hash: passwordHash
      })
      .execute();

    const invalidPasswordInput: TeacherLoginInput = {
      email: 'teacher@test.com',
      password: 'wrongpassword'
    };

    const result = await teacherLogin(invalidPasswordInput);

    expect(result).toBeNull();
  });

  it('should return null when no teachers exist', async () => {
    const result = await teacherLogin(loginInput);

    expect(result).toBeNull();
  });

  it('should handle empty password', async () => {
    // Create teacher
    const passwordHash = await Bun.password.hash(testTeacher.password);
    
    await db.insert(teachersTable)
      .values({
        name: testTeacher.name,
        email: testTeacher.email,
        password_hash: passwordHash
      })
      .execute();

    const emptyPasswordInput: TeacherLoginInput = {
      email: 'teacher@test.com',
      password: ''
    };

    const result = await teacherLogin(emptyPasswordInput);

    expect(result).toBeNull();
  });
});
