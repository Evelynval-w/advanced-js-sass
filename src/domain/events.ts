import type { StudentId, CourseCode, Semester, EnrollmentId, Credits } from "./brands.js";

export interface StudentEnrolledEvent {
  type: "StudentEnrolled";
  studentId: StudentId;
  courseCode: CourseCode;
  semester: Semester;
  enrollmentId: EnrollmentId;
  credits: Credits;
}

export interface EnrollmentCancelledEvent {
  type: "EnrollmentCancelled";
  enrollmentId: EnrollmentId;
  studentId: StudentId;
  courseCode: CourseCode;
  semester: Semester;
}

export interface CourseCapacityReachedEvent {
  type: "CourseCapacityReached";
  courseCode: CourseCode;
  enrolledCount: number;
  capacity: number;
  percentFull: number;
}

export interface CourseFullEvent {
  type: "CourseFull";
  courseCode: CourseCode;
  capacity: number;
}


export interface DomainEventMap {
  StudentEnrolled: StudentEnrolledEvent;
  EnrollmentCancelled: EnrollmentCancelledEvent;
  CourseCapacityReached: CourseCapacityReachedEvent;
  CourseFull: CourseFullEvent;
}