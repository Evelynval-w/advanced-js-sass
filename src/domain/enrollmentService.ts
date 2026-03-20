import { v4 as uuidv4 } from "uuid";
import type { StudentId, CourseCode, Semester } from "./brands.js";
import { createEnrollmentId } from "./brands.js";
import { Student } from "./student.js";
import { Course } from "./course.js";
import { Enrollment } from "./enrollment.js";
import type {
  StudentEnrolledEvent,
  EnrollmentCancelledEvent,
  CourseCapacityReachedEvent,
  CourseFullEvent,
} from "./events.js";
import { EventEmitter } from "../infrastructure/eventsEmitter.js";

export class EnrollmentService {
  private students: Map<string, Student> = new Map();
  private courses: Map<string, Course> = new Map();
  private enrollments: Enrollment[] = [];
  public readonly eventEmitter: EventEmitter;

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  registerStudent(student: Student): void {
    this.students.set(student.id, student);
  }

  registerCourse(course: Course): void {
    this.courses.set(course.code, course);
  }

  enroll(
    studentId: StudentId,
    courseCode: CourseCode,
    semester: Semester
  ): Enrollment | Error {
    const student = this.students.get(studentId);
    if (!student) return new Error(`Student ${studentId} not found`);

    const course = this.courses.get(courseCode);
    if (!course) return new Error(`Course ${courseCode} not found`);

    // Rule 4: no duplicate enrollment
    const duplicate = this.enrollments.find(
      (e) =>
        e.studentId === studentId &&
        e.courseCode === courseCode &&
        e.semester === semester &&
        e.isActive
    );
    if (duplicate) {
      return new Error(`Already enrolled in ${courseCode} for ${semester}`);
    }

    // Rule 2: credit limit
    if (!student.canEnroll(course.credits)) {
      return new Error(
        `Would exceed 18 credits (current: ${student.enrolledCredits}, course: ${course.credits})`
      );
    }

    // Rule 1: capacity
    if (course.isFull) {
      return new Error(`Course ${courseCode} is full`);
    }

    // All rules pass -- create enrollment
    const enrollmentId = createEnrollmentId(`ENR-${uuidv4()}`);
    if (enrollmentId instanceof Error) return enrollmentId;

    const enrollment = Enrollment.create(enrollmentId, studentId, courseCode, semester);

    student.addCredits(course.credits);
    course.enroll();
    this.enrollments.push(enrollment);

    // Emit StudentEnrolled
    this.eventEmitter.emit("StudentEnrolled", {
      type: "StudentEnrolled",
      studentId,
      courseCode,
      semester,
      enrollmentId: enrollment.id,
      credits: course.credits,
    });

    // Emit capacity events
    if (course.isFull) {
      this.eventEmitter.emit("CourseFull", {
        type: "CourseFull",
        courseCode,
        capacity: course.capacity,
      });
    } else if (course.capacityPercentage >= 80) {
      this.eventEmitter.emit("CourseCapacityReached", {
        type: "CourseCapacityReached",
        courseCode,
        enrolledCount: course.enrolledCount,
        capacity: course.capacity,
        percentFull: course.capacityPercentage,
      });
    }

    return enrollment;
  }

  cancelEnrollment(enrollmentId: string): void | Error {
    const enrollment = this.enrollments.find((e) => e.id === enrollmentId);
    if (!enrollment) return new Error(`Enrollment ${enrollmentId} not found`);

    const cancelResult = enrollment.cancel();
    if (cancelResult instanceof Error) return cancelResult;

    const student = this.students.get(enrollment.studentId);
    const course = this.courses.get(enrollment.courseCode);

    if (course) {
      student?.removeCredits(course.credits);
      course.unenroll();
    }

    this.eventEmitter.emit("EnrollmentCancelled", {
      type: "EnrollmentCancelled",
      enrollmentId: enrollment.id,
      studentId: enrollment.studentId,
      courseCode: enrollment.courseCode,
      semester: enrollment.semester,
    });
  }
}
