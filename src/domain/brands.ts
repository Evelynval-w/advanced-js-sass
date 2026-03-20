// type
type Brand<K, T> = K & { __brand: T };
export type CourseCode = Brand<string, "CourseCode">;
export type StudentId = Brand<string, "StudentId">;
export type Email = Brand<string, "Email">;
export type Semester = Brand<string, "Semester">;
export type EnrollmentId = Brand<string, "EnrollmentId">;
export type Credits = Brand<number, "Credits">;


// constructor
export function createStudentId(value: string): StudentId | Error {
  if (!/^STU\d{6}$/.test(value)) {
    return new Error("StudentId must be STU followed by 6 digits");
  }
  return value as StudentId;
}

export function createCourseCode(value: string): CourseCode | Error {
    if (!/^[A-Z]{2,4}\d{3}$/.test(value)) {
        return new Error("Student code most start with 2 - 4 letters and ends with 3 digits");
    }
    return value as CourseCode;
}

export function createEmail(value: string): Email | Error {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return new Error("Invalid email format");
    }
    return value as Email
}

export function createSemester(value: string): Semester | Error {
  if (!/^(Fall|Spring|Summer)\d{4}$/.test(value)) {
    return new Error("Semester must be Fall, Spring, or Summer followed by a year");
  }
  return value as Semester;
}


export function createEnrollmentId(value: string): EnrollmentId | Error {
  if (!/^ENR-.+$/.test(value)) {
    return new Error("EnrollmentId must start with ENR- followed by a unique id");
  }
  return value as EnrollmentId;
}


export function createCredits(value: number): Credits | Error {
  if (![1, 2, 3, 4, 6].includes(value)) {
    return new Error("Credits must be one of: 1, 2, 3, 4, or 6");
  }
  return value as Credits;
}