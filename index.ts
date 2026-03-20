import {
  createStudentId,
  createCourseCode,
  createEmail,
  createCredits,
  createSemester,
} from "./src/domain/brands.js";
import { Student } from "./src/domain/student.js";
import { Course } from "./src/domain/course.js";
import { EnrollmentService } from "./src/domain/enrollmentService.js";
import { EventEmitter } from "./src/infrastructure/eventsEmitter.js";
import type { DomainEventMap } from "./src/domain/events.js";

//Setup 

const emitter = new EventEmitter();

// Log every event that fires
const eventTypes: (keyof DomainEventMap)[] = [
  "StudentEnrolled",
  "EnrollmentCancelled",
  "CourseCapacityReached",
  "CourseFull",
];

for (const eventType of eventTypes) {
  emitter.subscribe(eventType, (event) => {
    console.log(`  [EVENT] ${event.type}:`, JSON.stringify(event, null, 2));
  });
}

const service = new EnrollmentService(emitter);
const semester = createSemester("Fall2024");
if (semester instanceof Error) throw semester;

// Helper to create validated values or throw
function must<T>(result: T | Error, label: string): T {
  if (result instanceof Error) throw new Error(`${label}: ${result.message}`);
  return result;
}

//SCENARIO 1: Successful enrollment

console.log("\n SCENARIO 1: Successful Enrollment\n");

const alice = must(
  Student.create(
    must(createStudentId("STU000001"), "id"),
    "Alice Martin",
    must(createEmail("alice@epita.fr"), "email"),
  ),
  "student",
);

const csDDD = must(
  Course.create(
    must(createCourseCode("CS101"), "code"),
    "Domain-Driven Design",
    must(createCredits(3), "credits"),
    30,
  ),
  "course",
);

service.registerStudent(alice);
service.registerCourse(csDDD);

const enroll1 = service.enroll(alice.id, csDDD.code, semester);
if (enroll1 instanceof Error) {
  console.log("  FAIL:", enroll1.message);
} else {
  console.log("  OK: Enrolled", enroll1.id);
}

// SCENARIO 2: Course reaches 80% capacity

console.log("\nSCENARIO 2: Course Reaches 80% \n");

const smallCourse = must(
  Course.create(
    must(createCourseCode("WEB201"), "code"),
    "Advanced Web Dev",
    must(createCredits(2), "credits"),
    5,
  ),
  "course",
);
service.registerCourse(smallCourse);

for (let i = 2; i <= 5; i++) {
  const padded = String(i).padStart(6, "0");
  const stu = must(
    Student.create(
      must(createStudentId(`STU${padded}`), "id"),
      `Student ${i}`,
      must(createEmail(`student${i}@epita.fr`), "email"),
    ),
    "student",
  );
  service.registerStudent(stu);
  const res = service.enroll(stu.id, smallCourse.code, semester);
  if (res instanceof Error) {
    console.log(`  FAIL Student ${i}:`, res.message);
  } else {
    console.log(
      `  OK: Student ${i} enrolled (${smallCourse.enrolledCount}/${smallCourse.capacity})`,
    );
  }
}

//SCENARIO 3: Course becomes full

console.log("\n SCENARIO 3: Course Becomes Full \n");

const stu6 = must(
  Student.create(
    must(createStudentId("STU000006"), "id"),
    "Student 6",
    must(createEmail("student6@epita.fr"), "email"),
  ),
  "student",
);
service.registerStudent(stu6);

const fullResult = service.enroll(stu6.id, smallCourse.code, semester);
if (fullResult instanceof Error) {
  console.log("  FAIL:", fullResult.message);
} else {
  console.log(
    `  OK: Student 6 enrolled (${smallCourse.enrolledCount}/${smallCourse.capacity})`,
  );
}

//SCENARIO 4: Student exceeds 18 credits

console.log("\n SCENARIO 4: Exceeds 18 Credits \n");

// Alice has 3 credits from CS101, add more courses to reach 18
const extraCourses = [
  { code: "MATH301", name: "Linear Algebra", credits: 4 },
  { code: "PHYS201", name: "Mechanics", credits: 4 },
  { code: "ENG101", name: "Technical Writing", credits: 4 },
  { code: "STAT101", name: "Probability", credits: 3 },
];

for (const c of extraCourses) {
  const course = must(
    Course.create(
      must(createCourseCode(c.code), "code"),
      c.name,
      must(createCredits(c.credits), "credits"),
      50,
    ),
    "course",
  );
  service.registerCourse(course);
  const res = service.enroll(alice.id, course.code, semester);
  if (res instanceof Error) {
    console.log(`  FAIL ${c.code}:`, res.message);
  } else {
    console.log(`  OK: ${c.code} (total credits: ${alice.enrolledCredits})`);
  }
}

// Now try one more -- should fail
const artCourse = must(
  Course.create(
    must(createCourseCode("ART100"), "code"),
    "Art History",
    must(createCredits(2), "credits"),
    50,
  ),
  "course",
);
service.registerCourse(artCourse);

console.log(
  `\n  Trying ART100 (2 credits) with ${alice.enrolledCredits} current credits...`,
);
const overflow = service.enroll(alice.id, artCourse.code, semester);
if (overflow instanceof Error) {
  console.log("  EXPECTED FAIL:", overflow.message);
} else {
  console.log("  UNEXPECTED: This should not happen");
}

//SCENARIO 5: Cancel an enrollment

console.log("\n SCENARIO 5: Cancel Enrollment \n");

if (!(enroll1 instanceof Error)) {
  console.log(`  Cancelling ${enroll1.id}...`);
  const cancelResult = service.cancelEnrollment(enroll1.id);
  if (cancelResult instanceof Error) {
    console.log("  FAIL:", cancelResult.message);
  } else {
    console.log(`  OK: Cancelled. Alice credits now: ${alice.enrolledCredits}`);
  }
}
