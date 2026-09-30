# Risk Register

| ID  | Risk                  | Likelihood | Impact | Mitigation                               | Owner        |
| --- | --------------------- | ---------- | ------ | ---------------------------------------- | ------------ |
| R1  | Split rounding defect | Medium     | High   | Unit tests and paise arithmetic          | Team         |
| R2  | Scope creep           | Medium     | Medium | Freeze excluded features                 | Team         |
| R3  | Member unavailable    | Medium     | High   | Early task allocation                    | Team         |
| R4  | Integration bug       | Medium     | High   | API tests and demo rehearsal             | Team         |
| R5  | Security flaw         | Low        | High   | JWT, bcrypt, validation                  | Team         |
| R6  | Local data loss       | Low        | Medium | Seed and backups                         | Team         |
| R7  | Deadline crunch       | High       | High   | Weekly checkpoints                       | Team         |
| R8  | Tool/version issue    | Medium     | Medium | Lock dependencies                        | Team         |
| R9  | Unclear contributions | Medium     | High   | Confirmed contribution log               | Team         |
| R10 | Demo failure          | Medium     | High   | Fresh seed and checklist                 | Team         |

Current status: the previous Prisma client initialization issue is resolved: the root `npm test` command passed with 179 tests on 30 September 2026. Current active risks are incomplete submission evidence, missing team-confirmed records, and an inaccessible or missing demo-video link.
