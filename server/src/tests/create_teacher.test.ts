
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { teachersTable } from '../db/schema';
import { type CreateTeacherInput } from '../schema';
import { createTeacher } from '../handlers/create_teacher';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateTeacherInput = {
  name: 'John Doe',
  email: 'john.doe@school.edu',
  password: 'secure123'
};

describe('createTeacher', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a teacher', async () => {
    const result = await createTeacher(testInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john.doe@school.edu');
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual('secure123'); // Password should be hashed
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save teacher to database', async () => {
    const result = await createTeacher(testInput);

    // Query using proper drizzle syntax
    const teachers = await db.select()
      .from(teachersTable)
      .where(eq(teachersTable.id, result.id))
      .execute();

    expect(teachers).toHaveLength(1);
    expect(teachers[0].name).toEqual('John Doe');
    expect(teachers[0].email).toEqual('john.doe@school.edu');
    expect(teachers[0].password_hash).toBeDefined();
    expect(teachers[0].created_at).toBeInstanceOf(Date);
  });

  it('should hash the password', async () => {
    const result = await createTeacher(testInput);

    // Password should be hashed and verifiable
    const isValidPassword = await Bun.password.verify('secure123', result.password_hash);
    expect(isValidPassword).toBe(true);

    // Wrong password should not verify
    const isWrongPassword = await Bun.password.verify('wrongpassword', result.password_hash);
    expect(isWrongPassword).toBe(false);
  });

  it('should enforce unique email constraint', async () => {
    // Create first teacher
    await createTeacher(testInput);

    // Try to create second teacher with same email
    const duplicateInput: CreateTeacherInput = {
      name: 'Jane Smith',
      email: 'john.doe@school.edu', // Same email
      password: 'different123'
    };

    expect(createTeacher(duplicateInput)).rejects.toThrow(/unique/i);
  });

  it('should create multiple teachers with different emails', async () => {
    const teacher1 = await createTeacher(testInput);

    const secondInput: CreateTeacherInput = {
      name: 'Jane Smith',
      email: 'jane.smith@school.edu',
      password: 'secure456'
    };

    const teacher2 = await createTeacher(secondInput);

    // Both teachers should be created successfully
    expect(teacher1.id).not.toEqual(teacher2.id);
    expect(teacher1.email).toEqual('john.doe@school.edu');
    expect(teacher2.email).toEqual('jane.smith@school.edu');

    // Verify both are in database
    const allTeachers = await db.select().from(teachersTable).execute();
    expect(allTeachers).toHaveLength(2);
  });
});
