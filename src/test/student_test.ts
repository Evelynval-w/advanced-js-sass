import { createStudentId, createEmail } from "../domain/brands.js";
import { Student } from "../domain/student.js";

const id = createStudentId("STU000001");
const email = createEmail("makuo@epita.fr");

if (id instanceof Error || email instanceof Error) {
  console.log("Bad input");
} else {
  const student = Student.create(id, "Makuo", email);
  if (student instanceof Error) {
    console.log("FAIL:", student.message);
  } else {
    console.log("Created:", student.name, student.enrolledCredits);
    console.log("Can enroll 15?", student.canEnroll(15));
    student.addCredits(15);
    console.log("Credits now:", student.enrolledCredits);
    console.log("Can enroll 4 more?", student.canEnroll(4));
  }
}