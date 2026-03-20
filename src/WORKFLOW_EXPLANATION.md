# University Enrollment System — Workflow Explanation

## How the whole system fits together

This project has three layers that build on each other:

```
Layer 1: Branded Types (brands.ts)
    ↓ used by
Layer 2: Entities (student.ts, course.ts, enrollment.ts) + Events (events.ts)
    ↓ used by
Layer 3: Infrastructure (EventEmitter) + Service (EnrollmentService)
    ↓ wired together in
Entry Point: index.ts (CLI demo)
```

Every layer depends on the one above it, never the reverse. This is the "separated concerns" principle from DDD — each file has one job.

---

## Layer 1: Branded Types (brands.ts)

### What problem do they solve?

Without branded types, a `StudentId` and an `Email` are both just `string`. TypeScript can't stop you from accidentally passing an email where a student ID is expected. Branded types add an invisible tag so the compiler treats them as different types.

### How the Brand utility works

```typescript
type Brand<K, T> = K & { __brand: T };
```

This intersects a base type `K` (like `string`) with an object that has a `__brand` property. The result is a type that is *structurally* a string at runtime, but *nominally* a unique type at compile time. The `__brand` property never exists in the actual JavaScript — it only lives in TypeScript's type system.

### How a smart constructor works

```typescript
export function createStudentId(value: string): StudentId | Error {
  if (!/^STU\d{6}$/.test(value)) {
    return new Error("StudentId must be STU followed by 6 digits");
  }
  return value as StudentId;
}
```

Step by step:
1. Takes a raw `string` (untrusted input)
2. Tests it against the regex pattern
3. If it fails → returns an `Error` (not throws — returns)
4. If it passes → casts the string to `StudentId` with `as`

The `as` cast is safe here because we just validated the format. This is the "Parse, Don't Validate" principle: once a value passes through the constructor, its *type* proves it was validated. No downstream code ever needs to re-check.

### Why return Error instead of throwing?

Returning `Type | Error` forces the caller to handle both cases with `instanceof Error`. You can't accidentally ignore a failure. If we threw exceptions, a caller could forget to try/catch and the program would crash.

### The six branded types and their rules

| Type | Base | Validation |
|------|------|------------|
| `StudentId` | string | Must match `STU` + exactly 6 digits |
| `CourseCode` | string | Must match 2-4 uppercase letters + 3 digits |
| `Email` | string | Must contain `@` and `.` with no spaces |
| `Credits` | number | Must be one of: 1, 2, 3, 4, 6 |
| `Semester` | string | Must match Fall/Spring/Summer + 4-digit year |
| `EnrollmentId` | string | Must start with `ENR-` |

---

## Layer 2: Entities

### What makes an entity different from a value object?

An entity has **identity** — two students with the same name are different people because they have different IDs. A value object has **no identity** — two `Email` objects with "alice@epita.fr" are interchangeable. The branded types ARE the value objects. Student, Course, and Enrollment are the entities.

### Student entity

```
Properties: id (StudentId), name (string), email (Email), _enrolledCredits (number)
Invariant: Cannot exceed 18 credits per semester
```

Key methods:
- `static create()` — Factory method. The ONLY way to create a Student. Validates that the name is non-empty. Returns `Student | Error`.
- `canEnroll(credits)` — Checks if adding these credits would exceed 18. Returns boolean.
- `addCredits(credits)` — Increases `_enrolledCredits`. Throws if it would exceed 18 (this is a safety net — `canEnroll` should always be checked first).
- `removeCredits(credits)` — Decreases `_enrolledCredits` (used when cancelling an enrollment). Uses `Math.max(0, ...)` to prevent negative credits.

**Why is the constructor private?** If it were public, anyone could write `new Student(badId, "", badEmail, -5)` and create an invalid student. The private constructor forces everyone through `Student.create()`, which validates first.

### Course entity

```
Properties: code (CourseCode), name (string), credits (Credits), capacity (number), _enrolledCount (number)
Invariants: Capacity must be 1-200, cannot enroll beyond capacity
```

Key methods:
- `static create()` — Validates capacity range (1-200) and non-empty name.
- `enroll()` — Increments `_enrolledCount` by 1. Returns `false` if course is already full.
- `unenroll()` — Decrements `_enrolledCount` by 1 (cancellation).
- `isFull` (getter) — Returns true when `_enrolledCount >= capacity`.
- `capacityPercentage` (getter) — Returns the percentage as a whole number. Used to check the 80% warning threshold.

### Enrollment entity

```
Properties: id (EnrollmentId), studentId, courseCode, semester, _status ("active" | "cancelled")
Invariant: Can only cancel an active enrollment
```

Key methods:
- `static create()` — Creates a new enrollment with status "active".
- `cancel()` — Sets status to "cancelled". Returns an `Error` if already cancelled (you can't cancel twice).
- `isActive` (getter) — Returns true if status is "active".

---

## Layer 2B: Domain Events (events.ts)

Events are just data — they describe something that happened. They use `interface` because they have no behavior, only shape.

| Event | When it fires | Key data |
|-------|--------------|----------|
| `StudentEnrolledEvent` | Student successfully enrolls | studentId, courseCode, semester, credits |
| `CourseCapacityReachedEvent` | Course hits 80% capacity | courseCode, enrolledCount, capacity, percentFull |
| `CourseFullEvent` | Course hits 100% capacity | courseCode, capacity |
| `EnrollmentCancelledEvent` | An enrollment is cancelled | enrollmentId, studentId, courseCode, semester |

The `DomainEventMap` interface ties event names to their payload types:

```typescript
interface DomainEventMap {
  StudentEnrolled: StudentEnrolledEvent;
  EnrollmentCancelled: EnrollmentCancelledEvent;
  CourseCapacityReached: CourseCapacityReachedEvent;
  CourseFull: CourseFullEvent;
}
```

This map is what makes the Observer pattern type-safe. When you call `subscribe("CourseFull", handler)`, TypeScript knows the handler must accept a `CourseFullEvent`.

---

## Layer 3: EventEmitter (infrastructure/EventEmitter.ts)

### The Observer Pattern

Think of it like a notification system. Components "subscribe" to events they care about. When something happens, the emitter "emits" the event and all subscribers get notified automatically. The emitter doesn't know or care who is listening.

### Internal structure

```typescript
private handlers: Map<string, Set<EventHandler<unknown>>>
```

A `Map` where:
- Key = event type name (e.g., "StudentEnrolled")
- Value = a `Set` of handler functions

Using a `Set` (not an array) means the same handler can't accidentally be registered twice.

### The three methods

**subscribe** — Adds a handler function to the set for that event type. If no set exists yet, creates one.

**unsubscribe** — Removes a handler from the set. Uses `Set.delete()` which matches by reference — you must pass the exact same function object you subscribed with.

**emit** — Looks up the set for that event type, loops through every handler, and calls it with the event payload.

### Type safety with generics

```typescript
subscribe<K extends keyof DomainEventMap>(
  eventType: K,
  handler: EventHandler<DomainEventMap[K]>
): void
```

`K extends keyof DomainEventMap` means K can only be "StudentEnrolled", "EnrollmentCancelled", "CourseCapacityReached", or "CourseFull". `DomainEventMap[K]` resolves to the matching event interface. So if K is "CourseFull", the handler must accept `CourseFullEvent`. TypeScript enforces this at compile time.

---

## Layer 3B: EnrollmentService

This is the orchestrator. It holds all the state (students, courses, enrollments) and enforces all four business rules when enrolling or cancelling.

### The enroll() method — step by step

```
1. Look up the student by ID → Error if not found
2. Look up the course by code → Error if not found
3. Check uniqueness: is there already an active enrollment
   for this student + course + semester? → Error if duplicate
4. Check credit limit: can the student take on these credits
   without exceeding 18? → Error if over limit
5. Check capacity: is the course full? → Error if full
--- All rules pass ---
6. Generate a new EnrollmentId (ENR- + UUID)
7. Create the Enrollment entity
8. Update state: student.addCredits(), course.enroll()
9. Store the enrollment
10. Emit "StudentEnrolled" event
11. Check capacity percentage:
    - If 100% → emit "CourseFull"
    - Else if >= 80% → emit "CourseCapacityReached"
12. Return the enrollment
```

The order of checks matters. We check uniqueness before credits because a duplicate enrollment message is more helpful than "would exceed credits" for an enrollment that already exists.

### The cancelEnrollment() method — step by step

```
1. Find the enrollment by ID → Error if not found
2. Call enrollment.cancel() → Error if already cancelled
3. Restore state: student.removeCredits(), course.unenroll()
4. Emit "EnrollmentCancelled" event
```

---

## The CLI (index.ts) — execution flow

When you run `npm run dev`, here's exactly what happens:

### Setup phase
1. Create an `EventEmitter` instance
2. Subscribe a logging handler to ALL four event types — this is what prints `[EVENT]` lines
3. Create an `EnrollmentService` with the emitter
4. Create a shared `Semester` value ("Fall2024")

### Scenario 1: Successful enrollment
- Creates Alice (STU000001) and course CS101 (3 credits, capacity 30)
- Registers both with the service
- Calls `service.enroll(alice.id, cs101.code, semester)`
- All rules pass → enrollment created
- **Expected output:** `[EVENT] StudentEnrolled` fires

### Scenario 2: Course reaches 80%
- Creates WEB201 (2 credits, capacity 5)
- Enrolls students 2, 3, 4, 5 one by one
- At student 4: enrolledCount = 4, capacity = 5 → 80%
- **Expected output:** `[EVENT] CourseCapacityReached` fires on the 4th enrollment

### Scenario 3: Course becomes full
- Enrolls student 6 into WEB201
- enrolledCount = 5, capacity = 5 → 100%
- **Expected output:** `[EVENT] CourseFull` fires

### Scenario 4: Exceeds 18 credits
- Alice already has 3 credits (CS101)
- Enrolls in MATH301 (4), PHYS201 (4), ENG101 (4), STAT101 (3) → total 18
- Tries ART100 (2 credits) → 18 + 2 = 20 > 18
- **Expected output:** Error returned, NO event fires

### Scenario 5: Cancel enrollment
- Cancels Alice's CS101 enrollment from Scenario 1
- Enrollment status → "cancelled"
- Alice's credits decrease by 3
- Course enrolled count decreases by 1
- **Expected output:** `[EVENT] EnrollmentCancelled` fires

---

## Project file map

```
advanced-js-sass/
├── index.ts                          ← CLI entry point (5 scenarios)
├── src/
│   ├── domain/
│   │   ├── brands.ts                 ← Brand<K,T>, 6 types, 6 smart constructors
│   │   ├── events.ts                 ← 4 event interfaces + DomainEventMap
│   │   ├── student.ts                ← Student entity (18-credit invariant)
│   │   ├── course.ts                 ← Course entity (capacity invariant)
│   │   ├── enrollment.ts             ← Enrollment entity (cancel invariant)
│   │   └── EnrollmentService.ts      ← Orchestrator (all 4 business rules)
│   ├── infrastructure/
│   │   └── EventEmitter.ts           ← Observer pattern implementation
│   └── test/
│       ├── brands_test.ts            ← Branded type validation tests
│       ├── student_test.ts           ← Student entity tests
│       ├── course_test.ts            ← Course entity tests
│       ├── enrollment_test.ts        ← Enrollment entity tests
│       └── emitter_test.ts           ← EventEmitter tests
├── docs/
│   └── spec.md                       ← Project specification
├── package.json
└── tsconfig.json
```

---

## Evaluation checklist

| Criterion (weight) | How this project satisfies it |
|---|---|
| Type Safety — 30% | 6 branded types, zero `any` in source files, all values flow through smart constructors, DomainEventMap enforces correct event payloads |
| Domain Design — 30% | Private constructors on all entities, factory methods validate invariants, 18-credit cap, capacity 1-200, cancel-only-active rule |
| Observer Pattern — 20% | EventEmitter with typed subscribe/unsubscribe/emit, events fire at correct moments (enrolled, 80%, 100%, cancelled) |
| Code Quality — 10% | Separated concerns (domain vs infrastructure), each file has one responsibility, test files verify each component |
| Working Demo — 10% | All 5 CLI scenarios produce correct output with `npm run dev` |
