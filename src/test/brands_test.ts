import { createStudentId, createCourseCode, createEmail,
  createSemester, createEnrollmentId, createCredits } from "../domain/brands";

function printResult(label: string, result: unknown) {
  if (result instanceof Error) {
    console.log(`${label} FAIL:`, result.message);
  } else {
    console.log(`${label} OK:`, result);
  }
}

printResult("StudentId", createStudentId("STU125675"));
printResult("StudentId", createStudentId("Token"));
printResult("CourseCode", createCourseCode("CS890"));
printResult("CourseCode", createCourseCode("AGPM89"));
printResult("Email", createEmail("CS890"));
printResult("Email", createEmail("AGPM@example.com"));
printResult("Semester", createSemester("Fall2024"));
printResult("Semester", createSemester("Winter2024"));
printResult("EnrollmentId", createEnrollmentId("ENR-abc123"));
printResult("EnrollmentId", createEnrollmentId("hello"));
printResult("Credits", createCredits(3));
printResult("Credits", createCredits(5));