import type { CourseCode, Credits } from "./brands.js";

export class Course {
  private constructor(
    public readonly code: CourseCode,
    public readonly name: string,
    public readonly credits: Credits,
    public readonly capacity: number,
    private _enrolledCount: number
  ) {}

  static create(
    code: CourseCode, name: string, credits: Credits, capacity: number
  ): Course | Error {
    if (!name || name.trim().length === 0) {
      return new Error("Course name cannot be empty");
    }
    if (capacity < 1 || capacity > 200) {
      return new Error("Capacity must be between 1 and 200");
    }
    return new Course(code, name.trim(), credits, capacity, 0);
  }

  get enrolledCount(): number {
    return this._enrolledCount;
  }

  get isFull(): boolean {
    return this._enrolledCount >= this.capacity;
  }

  get capacityPercentage(): number {
    return Math.round((this._enrolledCount / this.capacity) * 100);
  }

  enroll(): boolean {
    if (this.isFull) return false;
    this._enrolledCount += 1;
    return true;
  }

  unenroll(): void {
    if (this._enrolledCount > 0) {
      this._enrolledCount -= 1;
    }
  }
}