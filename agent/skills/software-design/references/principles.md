# Software Design Principles

Comprehensive reference based on "A Philosophy of Software Design" by John Ousterhout.

## Table of Contents

1. [The Nature of Complexity](#the-nature-of-complexity)
2. [Strategic vs Tactical Programming](#strategic-vs-tactical-programming)
3. [Deep Modules](#deep-modules)
4. [Information Hiding](#information-hiding)
5. [General-Purpose Modules](#general-purpose-modules)
6. [Different Layer, Different Abstraction](#different-layer-different-abstraction)
7. [Pull Complexity Downwards](#pull-complexity-downwards)
8. [Better Together or Better Apart](#better-together-or-better-apart)
9. [Define Errors Out of Existence](#define-errors-out-of-existence)
10. [Design It Twice](#design-it-twice)
11. [Comments and Documentation](#comments-and-documentation)
12. [Naming](#naming)
13. [Consistency](#consistency)
14. [Code Should Be Obvious](#code-should-be-obvious)
15. [Designing for Performance](#designing-for-performance)

---

## The Nature of Complexity

**Definition:** Complexity is anything related to the structure of a software system that makes it hard to understand and modify.

**Core formula:** Overall complexity (C) = sum of each part's complexity (cp) weighted by time developers spend on that part (tp). Isolating complexity where it is never seen is almost as good as eliminating it.

**Key insight:** Complexity is more apparent to readers than writers. If others think code is complex, it is complex.

### Three Symptoms of Complexity

1. **Change amplification** -- A seemingly simple change requires modifications in many different places. Example: a color value hardcoded on every page instead of stored in one central place.

2. **Cognitive load** -- How much a developer must know to complete a task. More methods, global variables, inconsistencies, and inter-module dependencies all increase cognitive load. Note: fewer lines of code does not always mean less complexity; sometimes more lines reduce cognitive load.

3. **Unknown unknowns** -- It is not obvious which code must be modified or what information is needed. This is the worst symptom because you cannot even discover what you do not know. The only remedy is to make systems obvious.

### Two Causes of Complexity

1. **Dependencies** -- When code cannot be understood or modified in isolation. Dependencies are unavoidable but should be minimized and made simple and obvious.

2. **Obscurity** -- When important information is not obvious. Includes vague variable names, undocumented units, hidden relationships between pieces of code. Often caused by inadequate documentation, but also by poor design.

**Complexity is incremental.** No single dependency or obscurity matters much alone, but hundreds accumulate into an unmanageable system. Adopt a zero-tolerance philosophy.

---

## Strategic vs Tactical Programming

### Tactical Programming (avoid)

- Primary goal: get something working as quickly as possible.
- Introduces small bits of complexity with each change.
- Creates "tactical tornadoes" -- developers who ship fast but leave destruction in their wake.
- The code eventually becomes a mess that takes months to clean up.
- Once started, the tactical path is hard to leave.

### Strategic Programming (prefer)

- Primary goal: produce a great design that also happens to work.
- Requires an investment mindset: spend 10-20% of development time on design improvements.
- Investments are both proactive (trying multiple designs, writing good docs) and reactive (fixing design problems when discovered).
- The initial slowdown pays for itself quickly; within months you develop faster than the tactical approach.
- Every engineer should make continuous small investments in good design.

**Working code is not enough.** Do not introduce unnecessary complexity to finish a task faster. The long-term structure of the system is the most important thing.

---

## Deep Modules

**Core concept:** The best modules provide powerful functionality behind simple interfaces. Visualize a module as a rectangle: the top edge (width) is its interface complexity, and the area is its functionality. Deep modules have a narrow top edge and large area.

**Module depth = benefit (functionality) vs cost (interface complexity).**

### Deep Module Characteristics

- Simple interface with few methods.
- Hides significant implementation complexity.
- Common use cases require minimal knowledge of the module.
- Example: Unix file I/O (5 system calls hide hundreds of thousands of lines of implementation).
- Example: garbage collector (zero interface; works invisibly).

### Shallow Module Characteristics

- Interface complexity is comparable to implementation complexity.
- Provides little abstraction; callers must understand internals anyway.
- Example: a one-line method wrapped in a named function that adds interface cost but no real value.

### Classitis

The mistaken belief that "classes are good, so more classes are better." Results in many shallow classes with accumulated interface complexity. Small classes contribute little functionality and require verbose boilerplate.

**Interfaces should be designed to make the common case as simple as possible.** If an interface has many features but most users only need a few, the effective complexity is just the commonly used features.

---

## Information Hiding

**The most important technique for achieving deep modules.**

Each module should encapsulate design decisions in its implementation, invisible through its interface. Hidden information includes data structures, algorithms, lower-level details, and higher-level assumptions.

### Benefits

1. Simplifies the interface, reducing cognitive load.
2. Makes evolution easier -- changing hidden information affects only one module.

### Information Leakage (Red Flag)

Occurs when a design decision is reflected in multiple modules. Creates dependencies. Even back-door leakage (not visible in interfaces) is dangerous.

**When you encounter leakage, ask:** "How can I reorganize so this knowledge affects only a single class?"

Solutions:
- Merge the classes that share the knowledge.
- Extract the shared knowledge into a new class with a simple interface.

### Temporal Decomposition (Red Flag)

Structuring code around the time order of operations rather than around information hiding. Example: separate classes for reading and writing a file format -- both must know the format, creating leakage.

**Focus on the knowledge needed for each task, not the order in which tasks occur.**

### Key Practices

- Do not expose internal data structures through public methods (e.g., returning a raw Map).
- Provide sensible defaults so callers need not know about rarely-used options.
- Classes should "do the right thing" without being explicitly asked.
- Private methods within a class should also encapsulate information from the rest of the class.
- Minimize the number of places each instance variable is used.

---

## General-Purpose Modules

**General-purpose modules are deeper.** The sweet spot: functionality reflects current needs, but the interface is general enough to support multiple uses.

### Why General-Purpose is Better

- Results in simpler, deeper interfaces than special-purpose approaches.
- Provides cleaner separation between classes.
- Reduces information leakage.
- Fewer methods, each handling more situations.

### Example: Text Editor

Bad (special-purpose): `backspace(cursor)`, `delete(cursor)`, `deleteSelection(selection)` -- many shallow methods tied to UI operations.

Good (general-purpose): `insert(position, text)`, `delete(start, end)` -- two methods that handle all text manipulation, with the UI layer composing them as needed.

### Self-Check Questions

1. What is the simplest interface that covers all my current needs?
2. In how many situations will this method be used? (If only one, it may be too special-purpose.)
3. Is this API easy to use for my current needs? (If you need lots of extra code, the interface may be too general.)

---

## Different Layer, Different Abstraction

In a well-designed system, each layer provides a different abstraction from adjacent layers. If adjacent layers have similar abstractions, something is wrong.

### Pass-Through Methods (Red Flag)

A method that does nothing except invoke another method with the same or similar signature. Indicates confusion over division of responsibility.

**Solutions:**
- Expose the lower-level class directly to callers.
- Redistribute functionality between the classes.
- Merge the classes.

### Decorators

Tend to be shallow: lots of boilerplate for a small amount of new functionality. Before creating a decorator, consider:
- Adding the functionality directly to the underlying class.
- Merging with the use case or an existing decorator.
- Implementing as a standalone class.

### Interface vs Implementation

The interface of a class should normally differ from its implementation. If they mirror each other, the class is probably shallow. Example: a text class that stores lines internally should expose a character-oriented interface, not a line-oriented one.

### Pass-Through Variables

Variables passed through a chain of methods that don't use them. Solutions:
- Store in a shared object accessible to both endpoints.
- Use a context object that stores application-wide state and is passed via constructors.

---

## Pull Complexity Downwards

When unavoidable complexity exists, handle it inside the module rather than pushing it to users. Most modules have more users than developers, so developers should suffer rather than users.

**It is more important for a module to have a simple interface than a simple implementation.**

### Configuration Parameters (anti-pattern)

Exporting configuration parameters pushes complexity upward. Before exporting a parameter, ask: "Will users determine a better value than we can here?" Compute reasonable defaults automatically. Configuration parameters result in an incomplete solution.

### When to Pull Down

- The complexity is closely related to the class's existing functionality.
- Pulling down simplifies many callers elsewhere.
- Pulling down simplifies the class's interface.

### When Not to Pull Down

- The knowledge does not relate to the class's core functions (e.g., adding UI knowledge to a text class -- that is information leakage, not pulling complexity down).

---

## Better Together or Better Apart

### When to Combine

- **Shared information:** Both pieces depend on the same knowledge (e.g., file format).
- **Simplifies the interface:** Combining eliminates intermediate interfaces.
- **Eliminates duplication:** Factor repeated code into a shared method or class.

### When to Separate

- **General-purpose vs special-purpose code:** Put general-purpose mechanisms in one module, special-purpose usage in another. The lower layers tend to be more general-purpose; pull special-purpose code upward.
- **Unrelated functionality:** If the pieces are not conceptually related.
- **Combined object is more complex to use:** If callers still need to treat the parts independently.

### Splitting Methods

Length alone is rarely a good reason to split a method. Long methods are fine if they have a simple signature and are easy to read.

**Each method should do one thing and do it completely.**

Split only when it results in cleaner abstractions:
- **Factor out a subtask** into a child method that can be understood independently.
- **Divide into two methods visible to callers** only if the original had an overly complex interface trying to do multiple unrelated things.

### Conjoined Methods (Red Flag)

If you cannot understand one method without understanding another, that is a red flag. Each method should be independently understandable.

---

## Define Errors Out of Existence

Exception handling is one of the worst sources of complexity. The key lesson: reduce the number of places where exceptions must be handled.

### Four Techniques

1. **Define errors out of existence.** Redefine the API so there is no error case. Example: instead of "delete this variable" (error if it does not exist), define "ensure this variable no longer exists" (no error possible). Example: Java substring should clamp indices instead of throwing IndexOutOfBoundsException.

2. **Mask exceptions.** Handle exceptional conditions at a low level so higher levels are unaware. Example: TCP masks packet loss by resending. Example: NFS hangs on server failure rather than reporting errors to applications.

3. **Aggregate exceptions.** Handle many exceptions with a single handler. Let exceptions propagate up to a top-level handler. Example: a web server dispatches requests and catches all parameter errors in one place, rather than wrapping each getParameter call individually.

4. **Just crash.** For rare errors that are difficult to handle (out of memory, internal inconsistencies), print a diagnostic and abort. Do not add complexity for errors that almost never occur.

### Design Special Cases Out of Existence

Represent "no selection" as an empty selection rather than a separate state. This eliminates if-checks throughout the code. Design the normal case to automatically handle the special case.

**Overall, the best way to reduce bugs is to make software simpler.**

---

## Design It Twice

For each major design decision, consider multiple alternatives before committing. Even if you are sure of the best approach, think through at least one alternative.

### Process

1. Sketch a few radically different approaches (just key methods, not full implementations).
2. List pros and cons of each. Consider: ease of use for higher-level code, interface simplicity, generality, implementation efficiency.
3. Pick the best, possibly combining features from multiple alternatives.
4. If none is attractive, use the problems identified to drive new designs.

### Apply at Multiple Levels

- Module interface design.
- Implementation strategy.
- System-level decomposition.
- Feature design.

**The design-it-twice principle improves both designs and design skills.** The process of comparing alternatives teaches you what makes designs better or worse.

---

## Comments and Documentation

### Why Comments Matter

- Comments are essential to abstractions -- without them, you cannot hide complexity.
- Comments capture information that was in the designer's mind but cannot be represented in code.
- Writing comments improves design by forcing you to articulate abstractions clearly.

### The Comments-First Approach

1. Write the class interface comment.
2. Write interface comments and signatures for key public methods (bodies empty).
3. Iterate until the structure feels right.
4. Write declarations and comments for key instance variables.
5. Fill in method bodies, adding implementation comments as needed.

**Comments serve as a canary in the coal mine of complexity.** If a method requires a long comment to describe, it has a complex interface -- redesign it.

### What to Comment

- **Interface comments (every class, every public method, every class variable):** Describe the abstraction. Include behavior, arguments, return values, side effects, exceptions, and preconditions.
- **Data structure members:** Describe what the variable represents (nouns, not verbs). Include units, boundary conditions, null semantics, ownership, and invariants.
- **Implementation comments:** Describe *what* and *why*, not *how*. Use high-level comments before major blocks. For loops, describe what happens in each iteration.
- **Cross-module comments:** Document dependencies that span modules. Use a central `designNotes` file if no obvious single location exists.

### Comment Anti-Patterns

- **Repeating the code:** If a comment could be written by looking only at the code next to it, it has no value.
- **Using the same words as the entity name:** "Returns the count" for a method called getCount adds nothing.
- **Implementation details in interface comments:** Interface comments must not describe internal data structures or algorithms.

### Maintaining Comments

- Keep comments close to the code they describe.
- Avoid duplicating documentation; document each decision exactly once.
- Check diffs before committing to ensure comments are updated.
- Higher-level, more abstract comments are easier to maintain.

---

## Naming

### Principles

- **Create an image:** A good name lets someone guess the entity's purpose without seeing any code.
- **Be precise:** Avoid generic names like `count`, `result`, `data`, `tmp`. Use `activeIndexlets`, `mergedLine`, `fileBlock` vs `diskBlock`.
- **Be consistent:** Use the same name for the same purpose everywhere. Never use the same name for different purposes.
- **Predicates for booleans:** Use names like `cursorVisible`, not `blinkStatus`.

### Red Flags

- **Vague Name:** A name broad enough to refer to many different things.
- **Hard to Pick Name:** Difficulty finding a good name suggests the underlying entity may not have a clean design.

### Consistency Rules

1. Always use the common name for a given purpose.
2. Never use the common name for anything else.
3. Ensure the purpose is narrow enough that all variables with the name behave the same way.

---

## Consistency

Consistency reduces complexity by creating cognitive leverage: learn how something is done once, apply that knowledge everywhere.

### Areas of Consistency

- **Names:** Same names for same purposes.
- **Coding style:** Formatting, conventions, restrictions.
- **Interfaces:** Multiple implementations of the same interface.
- **Design patterns:** Commonly accepted solutions.
- **Invariants:** Properties that are always true (e.g., every line ends with a newline).

### Ensuring Consistency

- Document conventions where developers will see them.
- Enforce with automated tools (linters, pre-commit hooks).
- Use code reviews to educate and enforce.
- Follow existing conventions in the codebase ("When in Rome").
- Do not change existing conventions unless new information justifies it and you update all old uses.

---

## Code Should Be Obvious

Code is obvious when someone can read it quickly and their first guesses about behavior are correct. "Obvious" is determined by readers, not writers.

### Making Code Obvious

- Choose good names.
- Be consistent.
- Use judicious white space (blank lines between blocks, spaces within statements).
- Add comments when code is inherently non-obvious.

### Things That Reduce Obviousness

- **Event-driven programming:** Hard to follow control flow. Document when each handler is invoked.
- **Generic containers (Pair, Tuple):** Obscure element meanings. Define specific types with meaningful field names.
- **Mismatched declaration and allocation types:** Declare variables as the concrete type, not a superclass.
- **Code that violates reader expectations:** If code does something surprising (e.g., constructor spawns threads), document it explicitly.

**Software should be designed for ease of reading, not ease of writing.**

---

## Designing for Performance

### General Approach

- Do not optimize every statement; do not ignore performance entirely.
- Develop awareness of fundamentally expensive operations: network I/O, disk I/O, memory allocation, cache misses.
- Choose "naturally efficient" designs that are also clean and simple.
- Simpler code tends to run faster: fewer special cases, deeper classes with fewer layer crossings.

### When Optimizing

1. **Measure before modifying.** Programmers' intuitions about performance are unreliable. Identify specific hot spots. Establish baselines.
2. **Prefer fundamental fixes:** caching, better algorithms, better data structures.
3. **Design around the critical path:** Identify the minimum code for the common case. Minimize special-case checks on the critical path. Move special-case handling off the critical path.
4. **Back out changes that do not measurably improve performance.** No point retaining complexity without significant speedup.

**Clean design and high performance are compatible.** Complicated code tends to be slow because it does extraneous or redundant work.
