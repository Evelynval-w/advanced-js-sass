import type { EnrollmentId, StudentId, CourseCode, Semester } from "./brands.js";

export type EnrollmentStatus = "active" | "cancelled";

export class Enrollment {
  private constructor(
    public readonly id: EnrollmentId,
    public readonly studentId: StudentId,
    public readonly courseCode: CourseCode,
    public readonly semester: Semester,
    private _status: EnrollmentStatus
  ) {}

  static create(
    id: EnrollmentId, studentId: StudentId,
    courseCode: CourseCode, semester: Semester
  ): Enrollment {
    return new Enrollment(id, studentId, courseCode, semester, "active");
  }

  get status(): EnrollmentStatus {
    return this._status;
  }

  get isActive(): boolean {
    return this._status === "active";
  }

  cancel(): Error | void {
    if (this._status === "cancelled") {
      return new Error("Enrollment is already cancelled");
    }
    this._status = "cancelled";
  }
}