import { createEnrollmentId, createStudentId, createCourseCode, createSemester } from "../domain/brands.js";
import { Enrollment } from "../domain/enrollment.js";

const eid = createEnrollmentId("ENR-test123");
const sid = createStudentId("STU000001");
const code = createCourseCode("CS101");
const sem = createSemester("Fall2024");

if (eid instanceof Error || sid instanceof Error || code instanceof Error || sem instanceof Error) {
  console.log("Bad input");
} else {
  const enrollment = Enrollment.create(eid, sid, code, sem);
  console.log("Status:", enrollment.status);
  console.log("Is active?", enrollment.isActive);
  enrollment.cancel();
  console.log("After cancel:", enrollment.status);
  const result = enrollment.cancel();
  if (result instanceof Error) {
    console.log("Double cancel:", result.message);
  }
}