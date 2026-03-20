import type { StudentId, Email } from "./brands.js";

export class Student {
  // Private constructor -- nobody can call "new Student()" directly
  private constructor(
    public readonly id: StudentId,
    public readonly name: string,
    public readonly email: Email,
    private _enrolledCredits: number
  ) {}

  // Factory method -- the ONLY way to create a Student
  static create(id: StudentId, name: string, email: Email): Student | Error {
    if (!name || name.trim().length === 0) {
      return new Error("Student name cannot be empty");
    }
    return new Student(id, name.trim(), email, 0);
  }

  get enrolledCredits(): number {
    return this._enrolledCredits;
  }

  canEnroll(additionalCredits: number): boolean {
    return this._enrolledCredits + additionalCredits <= 18;
  }

  addCredits(credits: number): void {
    if (!this.canEnroll(credits)) {
      throw new Error("Would exceed 18 credit limit");
    }
    this._enrolledCredits += credits;
  }

  removeCredits(credits: number): void {
    this._enrolledCredits = Math.max(0, this._enrolledCredits - credits);
  }
}