# Beginner lessons

The name badge, shopping list, and advanced audio queue remain available. The universe workshop has its own entry and does not require completing these lessons.

## Critical paths, in pictures

### 1. Choose a rule you can see

Start with fictional Maya Chen. Choose first name or full name and review the exact badge before approving the rule.

![Choose a name-badge rule](images/name-badge.png)

### 2. Inspect an actual computed mistake

The prepared faulty formatter reads the wrong field. The checker compares its real output with an independent expected answer: **Maya** was requested, but **Chen** was produced. This is a reproducible result, not a staged failure screen.

![Expected Maya versus actual Chen](images/badge-failure.png)

Use **Apply prepared repair & check** to replace the program while keeping the same rule. Try another fictional person after the check passes. The sample runs the same stored module that was checked.

![Repaired badge and live example after a passing check](images/badge-repaired.png)

### 3. Change your mind without calling correct code a bug

The optional second lesson compares first-name and full-name badges for two people named Maya. Review the old and proposed output together. **Keep my rule** is a valid decision; choosing a new rule requires a new check.

![Compare the old and proposed badge rules](images/badge-change.png)

### 4. Finish without being forced to accept

A completed check, an accepted version, and a finished lesson are different things. You can leave the version undecided and still finish. The next step offers the more interactive shopping list.

<img src="images/next-example-mobile.png" alt="Finish the badge lesson undecided and continue to the shopping list" width="390" />

### 5. Try the shopping list

The promise is simple: after buying Milk, hide Milk but keep still-needed Bread visible. Nothing is actually purchased, and hiding an item does not delete it.

![Shopping-list rule preview](images/shopping-list.png)

### 6. Reproduce and repair the disappearing-Bread defect

The first filter hides both items. Compare the expected remaining Bread with the empty actual result, then apply the prepared repair and try the list yourself.

![The computed shopping-list counterexample](images/shopping-failure.png)

The repaired program keeps Bread visible. The interactive controls also ignore the second pointer click in a double-click, so a moving button cannot accidentally buy the next item.

![Repaired list retains Bread after buying Milk](images/shopping-double-click-fixed.png)

### 7. Review a new shopping preference

Would you rather see bought items too? The optional comparison shows the same shopping state under both rules before approval. The new program receives fresh evidence; old results remain in history.

<img src="images/shopping-change-mobile.png" alt="Compare hiding bought items with showing all items before approving the new rule" width="390" />

### 8. Inspect source, history, and scope when you need them

Expand **What was checked? Source & history** for exact source, per-case expected/actual outputs, revisions, and past decisions. Earlier checks can remain **passed** while becoming **stale** for the current version. Export both lesson histories or download the exact module. Each example can be restarted independently after confirmation.

The original **audio queue** remains under **More**, or at `/?example=audio`; its saved workspace is separate from the beginner lessons.
