import { EventEmitter } from "../infrastructure/eventsEmitter.js";

const emitter = new EventEmitter();

// Subscribe
emitter.subscribe("CourseFull", (event) => {
  console.log("HEARD CourseFull:", event.courseCode, "capacity:", event.capacity);
});

// Emit -- handler should fire
emitter.emit("CourseFull", {
  type: "CourseFull",
  courseCode: "CS101" as any,  // just for testing, we use branded types properly later
  capacity: 30
});

// Test unsubscribe
const handler = (event: any) => console.log("This should NOT print");
emitter.subscribe("CourseFull", handler);
emitter.unsubscribe("CourseFull", handler);
emitter.emit("CourseFull", {
  type: "CourseFull",
  courseCode: "CS101" as any,
  capacity: 30
});

console.log("(If you only see one HEARD, unsubscribe works)");