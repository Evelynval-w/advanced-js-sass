import { createCourseCode, createCredits } from "../domain/brands.js";

import { Course } from "../domain/course.js";

const code = createCourseCode("CS101");
const credits = createCredits(3);

if (code instanceof Error || credits instanceof Error) {
  console.log("Bad input");
} else {
  const course = Course.create(code, "Intro to CS", credits, 5);
  if (course instanceof Error) {
    console.log("FAIL:", course.message);
  } else {
    console.log("Course:", course.name, "Capacity:", course.capacity);
    console.log("Is full?", course.isFull);
    course.enroll();
    course.enroll();
    course.enroll();
    course.enroll();
    console.log("After 4 enrollments:", course.capacityPercentage + "%");
    course.enroll();
    console.log("After 5 enrollments:", course.capacityPercentage + "%");
    console.log("Is full?", course.isFull);
    console.log("Try enroll 6th:", course.enroll());
  }
}