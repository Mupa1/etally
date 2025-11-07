# Election Types and Workflows

## Overview

This document outlines the different types of elections supported by the system and their specific workflows, requirements, and processes.

## Current Election Types

Based on the existing schema, the system currently supports:

1. **General Election** (`general_election`)
2. **By-Election** (`by_election`)
3. **Referendum** (`referendum`)

---

## 1. General Election

### Description

A nationwide election held at regular intervals (typically every 5 years in Kenya) to elect representatives at multiple levels of government simultaneously.

### Characteristics

- **Scope**: National coverage (all counties, constituencies, and wards)
- **Frequency**: Scheduled (every 5 years)
- **Positions**: Multiple levels simultaneously
  - President & Deputy President
  - Governors & Deputy Governors
  - Senators
  - Members of National Assembly (MPs)
  - Members of County Assembly (MCAs)
  - Women Representatives
- **Complexity**: Highest - multiple contests across all geographic levels

### Workflow

#### Phase 1: Pre-Election Setup

1. **Election Creation**

   - Create election with type `general_election`
   - Set election date (typically announced 60-90 days in advance)
   - Status: `draft`

2. **Contest Configuration**

   - Create contests for each position level:
     - Presidential (national)
     - Gubernatorial (county-level)
     - Senatorial (county-level)
     - National Assembly (constituency-level)
     - County Assembly (ward-level)
     - Women Representative (county-level)
   - Configure geographic scoping for each contest type

3. **Nomination Period**

   - Open candidate nominations
   - Set nomination deadlines
   - Process candidate applications
   - Verify eligibility requirements

4. **Party List Submission**
   - Political parties submit party lists
   - Process coalition agreements
   - Allocate contest positions to coalition members

#### Phase 2: Observer Recruitment & Assignment

5. **Observer Call for Participation**

   - System sends email notification to all approved observers in the pool
   - Email includes:
     - Election details (date, type, scope)
     - Link to express interest
     - Election period and tallying period dates
     - Availability commitment requirement

6. **Observer Interest Expression**

   - Observers log into the system
   - View available polling stations
   - Select specific polling station(s) they want to observe
   - Commit to full availability during:
     - Election day period
     - Tallying period (typically 1-3 days after election)
   - Submit interest application

7. **Observer Application Review**

   - Admin reviews observer applications
   - Verify observer availability and commitment
   - Check polling station coverage (ensure all stations have observers)
   - Approve or reject observer applications
   - Handle cases where multiple observers apply for same station
   - Send approval/rejection notifications

8. **Observer Assignment Finalization**
   - Finalize observer assignments to polling stations
   - Distribute observer credentials for the election
   - Conduct training sessions (election-specific)
   - Confirm observer availability commitments

#### Phase 3: Pre-Election Day

9. **Election Activation**
   - Status: `scheduled` → `active`
   - Enable result submission
   - Activate observer mobile apps for assigned observers only

#### Phase 4: Election Day

10. **Voting & Result Submission**
    - Polling stations open
    - Assigned observers monitor voting process
    - Observers submit results in real-time
    - Preliminary results aggregation
    - Status: `active` (monitoring)

#### Phase 5: Tallying Period

11. **Result Tallying & Verification**
    - Observers continue monitoring during tallying period
    - Verify all polling station results
    - Cross-check with Form 34A submissions
    - Handle disputes and recounts
    - Observers fulfill their availability commitment

#### Phase 6: Post-Election

12. **Certification**
    - Finalize results
    - Status: `completed`
    - Publish official results
    - Release observers from availability commitment

### Special Considerations

- **Geographic Coverage**: Must cover all 47 counties, 290 constituencies, and ~1,450 wards
- **Observer Pool**: System maintains pool of approved observers (from registration system)
- **Observer Availability**: Observers must commit to full election period + tallying period
- **Observer Distribution**: Requires thousands of observers across all polling stations
- **Application Management**: Need to handle multiple observers applying for same station
- **Coverage Gaps**: System must identify and fill polling stations without observer applications
- **Result Aggregation**: Complex multi-level aggregation (station → ward → constituency → county → national)
- **Timeline**: Typically 6-12 months from announcement to certification

---

## 2. By-Election

### Description

An election held to fill a vacancy that occurs between general elections, typically due to:

- Death of an incumbent
- Resignation
- Court nullification of previous election
- Recall petition

### Characteristics

- **Scope**: Localized (single position/constituency/ward)
- **Frequency**: As needed (irregular)
- **Positions**: Single position at a time
  - MP (constituency-level)
  - MCA (ward-level)
  - Governor (county-level) - rare
- **Complexity**: Low to Medium - single contest, limited geographic scope

### Workflow

#### Phase 1: Vacancy Declaration

1. **Vacancy Identification**

   - System detects or admin declares vacancy
   - Determine affected position and geographic area
   - Create election with type `by_election`
   - Status: `draft`

2. **Election Scheduling**
   - Set election date (typically 60-90 days from vacancy)
   - Define affected geographic area (constituency/ward)

#### Phase 2: Contest Setup

3. **Contest Configuration**

   - Create single contest for the vacant position
   - Configure geographic scope (constituency or ward)
   - Set position-specific requirements

4. **Nomination Period**
   - Open nominations (typically 14-21 days)
   - Process candidate applications
   - Verify eligibility (must be registered in affected area)

#### Phase 3: Observer Recruitment & Assignment

5. **Observer Call for Participation**

   - System sends email to all approved observers
   - Focus on observers in or near the affected area
   - Include election details and availability requirements

6. **Observer Interest Expression**

   - Observers express interest
   - Select polling station(s) within affected area
   - Commit to availability for election day + tallying period

7. **Observer Application Review**

   - Review applications for affected polling stations
   - Approve/reject observers
   - Ensure all affected stations have observers

8. **Observer Assignment Finalization**
   - Finalize assignments
   - Distribute credentials
   - Conduct training

#### Phase 4: Pre-Election Day

9. **Election Activation**
   - Status: `scheduled` → `active`
   - Enable result submission for affected area only

#### Phase 5: Election Day

10. **Voting & Result Submission**
    - Polling stations in affected area open
    - Assigned observers monitor and submit results
    - Real-time aggregation for single contest

#### Phase 6: Tallying Period

11. **Result Verification**
    - Observers continue monitoring during tallying
    - Verify results from affected polling stations
    - Handle disputes (common in by-elections)

#### Phase 7: Post-Election

12. **Certification**
    - Finalize results
    - Status: `completed`
    - Announce winner
    - Release observers from availability commitment

### Special Considerations

- **Geographic Scope**: Limited to affected constituency/ward only
- **Observer Pool**: Target observers from affected area or nearby
- **Observer Requirements**: Fewer observers needed (only affected area)
- **Availability Commitment**: Observers commit to full election + tallying period
- **Timeline**: Typically 60-90 days from vacancy to certification
- **Urgency**: Often time-sensitive due to representation gaps
- **Political Sensitivity**: High stakes, often closely contested

---

## 3. Referendum

### Description

A direct vote by the electorate on a specific question or proposal, typically constitutional amendments or major policy decisions.

### Characteristics

- **Scope**: National (all registered voters)
- **Frequency**: As needed (irregular)
- **Positions**: N/A (no candidates, only Yes/No votes)
- **Complexity**: Medium - simple voting but national coverage required

### Workflow

#### Phase 1: Referendum Initiation

1. **Question Formulation**

   - Create election with type `referendum`
   - Define referendum question(s)
   - Set referendum date
   - Status: `draft`

2. **Question Configuration**
   - Create contest(s) for referendum question(s)
   - Configure as Yes/No or multiple choice
   - No candidates needed (only options)

#### Phase 2: Campaign Period

3. **Public Education**

   - Publish referendum question
   - Conduct civic education
   - Set campaign period (typically 60 days)

#### Phase 3: Observer Recruitment & Assignment

4. **Observer Call for Participation**

   - System sends email to all approved observers
   - Include referendum details and availability requirements
   - National coverage needed

5. **Observer Interest Expression**

   - Observers express interest
   - Select polling station(s)
   - Commit to availability for referendum day + tallying period

6. **Observer Application Review**

   - Review applications
   - Ensure national coverage
   - Approve/reject observers
   - Fill coverage gaps

7. **Observer Assignment Finalization**
   - Finalize assignments
   - Train observers on referendum-specific procedures
   - Distribute credentials

#### Phase 4: Pre-Referendum Day

8. **Referendum Activation**
   - Status: `scheduled` → `active`
   - Enable result submission
   - Activate observer apps for assigned observers

#### Phase 5: Referendum Day

9. **Voting & Result Submission**
   - All polling stations open
   - Voters cast Yes/No votes
   - Assigned observers monitor and submit results
   - Real-time aggregation of Yes vs No votes

#### Phase 6: Tallying Period

10. **Result Verification**
    - Observers continue monitoring during tallying
    - Verify all polling station results
    - Calculate national totals
    - Check threshold requirements (e.g., 50%+1 for constitutional amendments)

#### Phase 7: Post-Referendum

11. **Certification**
    - Finalize results
    - Status: `completed`
    - Announce outcome (Passed/Failed)
    - Release observers from availability commitment

### Special Considerations

- **No Candidates**: System must handle Yes/No voting without candidate structure
- **Observer Pool**: Need observers for all polling stations nationwide
- **Availability Commitment**: Observers commit to referendum day + tallying period
- **Threshold Requirements**: May need special validation (e.g., minimum turnout, supermajority)
- **National Coverage**: All polling stations participate
- **Binary Outcome**: Simple aggregation but requires clear pass/fail criteria
- **Legal Implications**: Results may have constitutional/legal consequences

---

## Proposed Additional Election Types

### 4. Re-Run Election

### Description

An election held to redo a previous election that was nullified by court order or due to irregularities.

### Characteristics

- **Scope**: Same as original election (could be general, by-election, or referendum)
- **Frequency**: As needed (irregular)
- **Positions**: Same as original election
- **Complexity**: Similar to original election type

### Workflow

#### Phase 1: Nullification & Setup

1. **Nullification Declaration**

   - Link to original election (parent election reference)
   - Create new election with type `re_run_election`
   - Copy contest structure from original
   - Status: `draft`

2. **Candidate Re-registration**
   - Candidates from original election may re-register
   - New candidates may also register
   - Shorter nomination period (typically 14-21 days)

#### Phase 2: Contest Configuration

3. **Contest Setup**

   - Use same geographic scope as original
   - Update candidate lists
   - Set new election date

#### Phase 3: Observer Recruitment & Assignment

4. **Observer Call for Participation**

   - System sends email to all approved observers
   - May prioritize observers from original election
   - Include re-run election details and availability requirements

5. **Observer Interest Expression**

   - Observers express interest
   - Select polling station(s) (same as original or new)
   - Commit to availability for re-run election + tallying period

6. **Observer Application Review**

   - Review applications
   - May prioritize observers who participated in original
   - Focus on areas with previous irregularities
   - Approve/reject observers

7. **Observer Assignment Finalization**
   - Finalize assignments
   - Enhanced training due to previous issues
   - Distribute credentials

#### Phase 4: Pre-Election Day

8. **Election Activation**
   - Status: `scheduled` → `active`

#### Phase 5: Election Day

9. **Voting & Result Submission**
   - Same process as original election type
   - Enhanced monitoring in previously problematic areas
   - Assigned observers submit results

#### Phase 6: Tallying Period

10. **Result Verification**
    - Observers continue monitoring during tallying
    - Enhanced verification due to previous issues
    - May require additional documentation

#### Phase 7: Post-Election

11. **Certification**
    - Finalize results
    - Status: `completed`
    - Release observers from availability commitment

### Special Considerations

- **Parent Election Link**: Must reference original nullified election
- **Observer Pool**: May prioritize observers from original election
- **Availability Commitment**: Observers commit to re-run election + tallying period
- **Enhanced Monitoring**: May require additional observers or verification
- **Timeline**: Typically 60-90 days from nullification
- **Legal Requirements**: Must comply with court orders and timelines

---

## Election Status Workflow

### Status Transitions

```
draft → scheduled → active → completed
  ↓         ↓         ↓
cancelled  paused   paused
```

### Status Definitions

1. **draft**: Election is being configured, not yet finalized
2. **scheduled**: Election is finalized and scheduled, but not yet active
3. **active**: Election is currently in progress (voting day or result submission period)
4. **paused**: Election temporarily suspended (can resume)
5. **completed**: Election finished, results certified
6. **cancelled**: Election cancelled before completion

### Status Transition Rules

- `draft` → `scheduled`: When election is finalized and date is set
- `scheduled` → `active`: On election day or when result submission opens
- `active` → `paused`: Emergency suspension (can resume)
- `paused` → `active`: Resume after suspension
- `active` → `completed`: When all results are verified and certified
- `scheduled` → `cancelled`: Cancel before election day
- `draft` → `cancelled`: Cancel during setup

---

## Common Workflow Components

### 1. Contest Configuration

- Define position(s) to be contested
- Set geographic scope (national, county, constituency, ward)
- Configure contest-specific rules

### 2. Candidate Nomination

- Open nomination period
- Accept candidate applications
- Verify eligibility
- Process nominations
- Close nominations

### 3. Observer Recruitment & Management

- **Call for Participation**: Send email to all approved observers in the pool
- **Interest Expression**: Observers log in and express interest in specific polling stations
- **Availability Commitment**: Observers commit to full election period + tallying period
- **Application Review**: Admin reviews and approves/rejects observer applications
- **Assignment Finalization**: Finalize observer assignments to polling stations
- **Credential Distribution**: Distribute observer credentials for the election
- **Training**: Provide election-specific training
- **Monitoring**: Monitor observer activity during election and tallying

### 4. Result Submission

- Enable result submission
- Accept results from observers
- Validate results
- Aggregate results

### 5. Result Verification

- Verify polling station results
- Cross-check with physical forms
- Handle disputes
- Reconcile discrepancies

### 6. Certification

- Finalize all results
- Generate official reports
- Publish results
- Archive election data

---

## Implementation Considerations

### Database Schema Updates Needed

1. **Election Model Enhancements**

   - Add `parentElectionId` for re-run elections
   - Add `nominationOpenDate`, `nominationCloseDate`
   - Add `resultsPublishDate`
   - Add `cancellationReason` for cancelled elections

2. **ElectionType Enum**

   - Add `re_run_election` type
   - Consider `local_election` for county/ward-specific elections
   - Consider `special_election` for other special cases

3. **Contest Model Enhancements**

   - Support referendum-style contests (Yes/No options instead of candidates)
   - Add `contestType` enum (candidate_based, referendum_question, etc.)

4. **Observer Application Model (New)**
   - Create `ElectionObserverApplication` model to track:
     - Election ID (link to Election)
     - Observer Registration ID (link to approved observer)
     - Polling Station ID (observer's preferred station)
     - Application status (pending, approved, rejected)
     - Availability commitment dates (election day + tallying period)
     - Application date
     - Review date and reviewer
     - Review notes/rejection reason
   - Relationship: One observer can apply to multiple elections
   - Relationship: One observer can apply to multiple polling stations per election (with priority)
   - Status workflow: `pending` → `approved` or `rejected`

### Workflow Engine

Consider implementing a workflow engine to:

- Enforce status transitions
- Trigger automated actions based on election type
- Manage phase-specific permissions
- Track workflow progress

### Geographic Scoping

Different election types require different geographic scoping:

- **General Election**: All areas
- **By-Election**: Single constituency/ward
- **Referendum**: All areas (national)
- **Re-Run**: Same as original election

---

## Questions for Discussion

1. **Re-Run Elections**

   - Should re-run elections be a separate type or a flag on existing elections?
   - How should we handle partial re-runs (only some polling stations)?

2. **Referendum Implementation**

   - How should we model Yes/No votes without candidates?
   - Should we support multiple referendum questions in one election?

3. **By-Election Scope**

   - Can a by-election affect multiple positions simultaneously?
   - How do we handle governor by-elections (county-wide)?

4. **Status Management**

   - Should we add more granular statuses (e.g., `nomination_open`, `results_pending`)?
   - How should we handle election postponements?

5. **Timeline Management**

   - Should we enforce minimum timelines between phases?
   - How do we handle deadline extensions?

6. **Observer Application Process**
   - How long should the application period be open?
   - Can observers apply to multiple polling stations (with priority)?
   - How do we handle stations with no applications?
   - Should there be a deadline for applications before review?
   - How do we notify observers of approval/rejection?
   - What happens if an approved observer becomes unavailable?

---

## Next Steps

1. Review and refine election type definitions
2. Design database schema updates
3. Implement workflow engine
4. Create UI for election type selection and configuration
5. Implement type-specific workflows
6. Add validation rules for each election type
7. Test each election type workflow end-to-end
