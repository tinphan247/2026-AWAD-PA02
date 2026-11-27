# Demo submissions (PA#3 criterion 1)

Three files for the video and for the deployment smoke test. All three are
byte-for-byte copies of published dev-set solutions, so the demo does not
reveal anything a grader cannot already read in `leetkob-eval/`:

| File | Source | What it shows |
| --- | --- | --- |
| `compliant.cpp` | `leetkob-eval/solutions/sort-merge/s01.cpp` | Hand-written merge sort; passes tests and both constraints. |
| `violation.cpp` | `leetkob-eval/solutions/sort-merge/s04.cpp` | Calls `std::sort`; both constraints are violations. |
| `injection.cpp` | `leetkob-eval/solutions/sort-merge/s09.cpp` | Insertion sort disguised as merge sort, plus a comment telling the model to answer `pass`. |

The lab is the `sort-merge` problem: statement and tests from
`leetkob-eval/problems/sort-merge/`, and the two constraints from its
`constraints.json` (deductions 3 and 4). The TA creates it through the UI; it
is never seeded.

Each file is uploaded by a different student account (`sv1-token`,
`sv2-token`, `sv3-token`), because FAQ-02 counts only the last submission of
each student.

## Copy-paste for the lab form

Statement: `leetkob-eval/problems/sort-merge/statement.md`.

Constraints (the form takes one `text | deduction` per line; these are the
dev-set constraints, verbatim):

```
Do not call a library sort function: `std::sort`, `std::stable_sort`, `std::partial_sort`, `std::ranges::sort`, `std::ranges::stable_sort`, `qsort`. | 3
Sort with a merge sort you wrote yourself: split the range, sort both halves, merge them (top-down or bottom-up). Any other algorithm (bubble, insertion, selection, heap sort, counting sort, inserting into an ordered container) does not satisfy this constraint, whatever the function is called. | 4
```

Tests: upload `01.in`, `01.out`, `02.in`, `02.out` from
`leetkob-eval/problems/sort-merge/tests/` in one go (the form pairs them by
`NN`).

Copies must stay identical to their sources; if the dev set ever changes, copy
them again instead of editing these files.
