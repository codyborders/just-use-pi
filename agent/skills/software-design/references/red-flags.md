# Red Flags Checklist

Use this checklist during code review or when writing new code. Each red flag indicates a likely design problem.

## Module Structure

### Shallow Module
- [ ] The interface for a class or method is not much simpler than its implementation.
- [ ] A method's body is trivially short (one or two lines) but its signature and documentation are comparable in size.
- [ ] The class has many methods, each doing very little.

### Classitis
- [ ] The system has many small classes, each with minimal functionality.
- [ ] Using a feature requires creating or coordinating multiple objects that could be one.
- [ ] The number of interfaces grows faster than the total functionality.

## Information Problems

### Information Leakage
- [ ] The same design decision (file format, protocol detail, data representation) is reflected in multiple modules.
- [ ] Changing one implementation detail requires coordinated changes across several classes.
- [ ] Two classes both understand the same internal format even though neither exposes it in its interface.

### Temporal Decomposition
- [ ] Code structure mirrors the time order of operations rather than grouping by knowledge.
- [ ] Separate classes for "read" and "write" operations on the same format, or "parse" and "process" phases that share knowledge.

### Overexposure
- [ ] Using a commonly needed feature forces callers to learn about rarely used features.
- [ ] The API requires callers to provide information that could be defaulted or computed automatically.
- [ ] Creating a simple object requires multiple steps involving auxiliary objects (e.g., Java's FileInputStream + BufferedInputStream + ObjectInputStream).

## Method Problems

### Pass-Through Method
- [ ] A method does almost nothing except invoke another method with the same or similar signature.
- [ ] 50% or more of a class's methods simply delegate to another class.

### Conjoined Methods
- [ ] Understanding one method requires understanding the implementation of another.
- [ ] Two physically separated pieces of code can only be understood together.

### Repetition
- [ ] The same non-trivial code pattern appears in multiple places.
- [ ] A bug fix in one location needs to be replicated in several others.

## Naming and Clarity

### Vague Name
- [ ] A variable or method name is broad enough to refer to many different things (e.g., `data`, `result`, `info`, `tmp`, `count` without context).
- [ ] A boolean variable's name does not clearly convey what true/false means (e.g., `status` instead of `isConnected`).

### Hard to Pick Name
- [ ] It is difficult to find a precise, intuitive name for a variable or method.
- [ ] The entity might be trying to represent multiple things at once.

## Documentation Problems

### Comment Repeats Code
- [ ] The comment restates what the code already says in the same words.
- [ ] The comment could be written by someone who never saw any code except the line next to the comment.

### Implementation Documentation Contaminates Interface
- [ ] An interface comment (class or method) describes implementation details not needed by users.
- [ ] Internal data structure names, algorithm details, or configuration constants appear in public documentation.

### Hard to Describe
- [ ] A complete description of a method or variable requires a long, complicated comment.
- [ ] This suggests the abstraction may not be clean.

## Design Problems

### Special-General Mixture
- [ ] A general-purpose mechanism also contains code specialized for a particular use case.
- [ ] Future changes to the use case will likely require changes to the underlying mechanism.

### Nonobvious Code
- [ ] The behavior or meaning of code cannot be understood with a quick reading.
- [ ] The code does something surprising relative to reader expectations (e.g., a constructor that spawns threads, a method with hidden side effects).

## Exception Handling

### Too Many Exceptions
- [ ] The class throws exceptions for conditions the caller cannot reasonably handle.
- [ ] Each method call is wrapped in its own try-catch block.
- [ ] Error handling code is longer than normal-case code.

### Missing Error Elimination
- [ ] An API defines error conditions that could be eliminated by slightly redefining the operation's semantics.
- [ ] Special cases that could be handled by the normal code path are instead checked explicitly.
