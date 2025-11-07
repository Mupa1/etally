# Election Creation Design

## Overview

This document outlines the design for creating elections in the system, supporting different election types with type-specific workflows and requirements.

## Design Goals

1. **Type-Specific Workflows**: Different election types have different requirements and steps
2. **Progressive Disclosure**: Show only relevant fields based on election type
3. **Validation**: Enforce type-specific validation rules
4. **User Experience**: Intuitive multi-step wizard for complex elections
5. **Flexibility**: Support future election types without major refactoring

---

## Election Creation Flow

### High-Level Steps

1. **Election Type Selection** - Choose the type of election
2. **Basic Information** - Core election details
3. **Timeline Configuration** - Key dates and periods
4. **Contest Setup** - Define positions/contests (type-specific)
5. **Geographic Scope** - Define coverage area (type-specific)
6. **Review & Create** - Review all information and create

---

## Step 1: Election Type Selection

### UI Component
- Radio buttons or card selection
- Each type shows:
  - Icon/visual indicator
  - Type name
  - Brief description
  - Estimated complexity indicator

### Election Types

#### General Election
- **Description**: "Nationwide election for multiple positions simultaneously"
- **Complexity**: High
- **Scope**: National (all counties, constituencies, wards)
- **Positions**: Multiple levels (President, Governor, Senator, MP, MCA, Women Rep)

#### By-Election
- **Description**: "Election to fill a single vacant position"
- **Complexity**: Low-Medium
- **Scope**: Localized (single constituency/ward)
- **Positions**: Single position

#### Referendum
- **Description**: "Direct vote on a specific question or proposal"
- **Complexity**: Medium
- **Scope**: National (all polling stations)
- **Positions**: N/A (Yes/No voting)

#### Re-Run Election (Future)
- **Description**: "Redo of a nullified election"
- **Complexity**: Varies (based on original)
- **Scope**: Same as original election
- **Positions**: Same as original

### Validation
- Must select an election type
- Type selection determines subsequent steps

---

## Step 2: Basic Information

### Fields (All Election Types)

1. **Election Code** (Required)
   - Format: Uppercase letters, numbers, hyphens, underscores
   - Example: `GE-2027`, `BE-KITUI-WEST-2024`, `REF-CONST-2025`
   - Validation: Unique, 3-50 characters, regex pattern
   - Auto-suggestion based on type and date

2. **Title** (Required)
   - Example: "2027 General Election", "Kitui West By-Election", "Constitutional Amendment Referendum"
   - Validation: 5-200 characters

3. **Election Date** (Required)
   - Date picker
   - Validation: Must be in the future
   - Type-specific minimum notice periods:
     - General Election: 60-90 days minimum
     - By-Election: 60-90 days minimum
     - Referendum: 60-90 days minimum

4. **Description** (Optional)
   - Rich text editor or textarea
   - Max 1000 characters
   - Can include context, background, legal basis

### Type-Specific Fields

#### Re-Run Election Only
- **Parent Election** (Required)
  - Dropdown/search to select original nullified election
  - Shows: Election code, title, date, type
  - Auto-fills some fields from parent

---

## Step 3: Timeline Configuration

### Key Dates

1. **Nomination Period**
   - **Nomination Open Date** (Required for candidate-based elections)
     - Default: Election date - 60 days
     - Validation: Must be before election date
   - **Nomination Close Date** (Required)
     - Default: Election date - 30 days
     - Validation: Must be after open date, before election date

2. **Party List Deadline** (Optional, for general elections)
   - Date for political parties to submit party lists
   - Default: Election date - 45 days

3. **Observer Application Period** (New)
   - **Observer Call Date** (Required)
     - When to send emails to observers
     - Default: Election date - 45 days
   - **Observer Application Deadline** (Required)
     - Last date for observers to express interest
     - Default: Election date - 30 days
   - **Observer Review Deadline** (Required)
     - Last date for admin to approve/reject applications
     - Default: Election date - 14 days

4. **Tallying Period** (New)
   - **Tallying Start Date** (Required)
     - Typically: Election date (same day)
   - **Tallying End Date** (Required)
     - Typically: Election date + 2-3 days
     - Validation: Must be after election date

5. **Results Publish Date** (Optional)
   - When official results will be published
   - Default: Tallying end date + 1 day

### Timeline Visualization
- Gantt chart or timeline view showing all key dates
- Visual validation (warn if dates are too close together)
- Type-specific date suggestions

### Validation Rules
- All dates must be in logical order
- Minimum periods between phases (configurable)
- Type-specific minimum timelines

---

## Step 4: Contest Setup

### Type-Specific Behavior

#### General Election
- **Multiple Contests Required**
- Contest types:
  1. **Presidential** (National)
     - Single contest, national scope
   - **Gubernatorial** (County-level)
     - One contest per county (47 contests)
   - **Senatorial** (County-level)
     - One contest per county (47 contests)
   - **National Assembly** (Constituency-level)
     - One contest per constituency (290 contests)
   - **County Assembly** (Ward-level)
     - One contest per ward (~1,450 contests)
   - **Women Representative** (County-level)
     - One contest per county (47 contests)

- **UI Approach**:
  - Option 1: Bulk create all contests based on geographic data
  - Option 2: Select which contest types to include
  - Option 3: Create contests individually (not recommended for general elections)

- **Recommended**: Bulk creation with option to customize

#### By-Election
- **Single Contest Required**
- Contest type depends on vacant position:
  - MP → Constituency-level contest
  - MCA → Ward-level contest
  - Governor → County-level contest

- **UI Approach**:
  - Select position type
  - Select specific geographic area (constituency/ward/county)
  - Create single contest

#### Referendum
- **Referendum Question(s)**
- No candidates, only Yes/No options
- Can have multiple questions in one referendum

- **UI Approach**:
  - Add referendum question(s)
  - Each question is a "contest" but without candidates
  - Configure question text, options, threshold requirements

#### Re-Run Election
- **Copy from Parent Election**
- Can modify contests if needed
- Same structure as original

### Contest Configuration Fields

#### For Candidate-Based Elections (General, By-Election)
- **Position Name** (Required)
  - Example: "President", "Member of Parliament - Kitui West", "Governor - Nairobi"
- **Description** (Optional)
- **Geographic Scope** (Required)
  - County, Constituency, or Ward selection
  - Type-specific:
    - Presidential: National (no selection needed)
    - Gubernatorial: Select county
    - MP: Select constituency
    - MCA: Select ward
- **Order Index** (Auto-generated or manual)
  - For display order

#### For Referendum
- **Question Text** (Required)
  - The referendum question
- **Question Type** (Required)
  - Yes/No (binary)
  - Multiple choice (future)
- **Threshold Requirements** (Optional)
  - Minimum turnout percentage
  - Supermajority requirement (e.g., 50%+1, 2/3 majority)
- **Order Index**

### UI Components
- **Contest List/Table**
  - Shows all contests for the election
  - Add/Edit/Delete contests
  - Bulk actions for general elections
- **Contest Form Modal**
  - Create/edit individual contest
  - Geographic selector component
- **Referendum Question Editor**
  - Rich text editor for question
  - Threshold configuration

---

## Step 5: Geographic Scope

### Type-Specific Behavior

#### General Election
- **Scope**: All areas (national)
- No selection needed, auto-covers all
- Display summary: "47 counties, 290 constituencies, ~1,450 wards"

#### By-Election
- **Scope**: Single area
- Select:
  - Position type determines level (county/constituency/ward)
  - Specific area (dropdown/autocomplete)
- Display: Selected area details

#### Referendum
- **Scope**: All areas (national)
- Same as general election

#### Re-Run Election
- **Scope**: Same as parent election
- Display: Inherited from parent

### UI Component
- Geographic cascade selector (County → Constituency → Ward)
- Summary display of selected areas
- Map visualization (future enhancement)

---

## Step 6: Review & Create

### Review Summary

1. **Election Type** - Display selected type with icon
2. **Basic Information** - Code, title, date, description
3. **Timeline** - All key dates in chronological order
4. **Contests** - Summary table/list of all contests
5. **Geographic Scope** - Coverage summary
6. **Observer Requirements** - Estimated number of observers needed

### Actions

1. **Save as Draft** - Create election in `draft` status
2. **Create & Notify Observers** - Create election and send observer call emails
3. **Create & Schedule** - Create election and move to `scheduled` status

### Validation Before Create
- All required fields completed
- Dates are valid and in correct order
- At least one contest created
- Geographic scope is valid
- Election code is unique

### Post-Creation Actions
- Create audit log entry
- Invalidate cache
- Send notifications (if selected)
- Redirect to election detail page

---

## Database Schema Updates

### Election Model Enhancements

```prisma
model Election {
  // ... existing fields ...
  
  // New fields for timeline management
  nominationOpenDate    DateTime?
  nominationCloseDate   DateTime?
  partyListDeadline     DateTime?
  observerCallDate      DateTime?
  observerAppDeadline   DateTime?
  observerReviewDeadline DateTime?
  tallyingStartDate     DateTime?
  tallyingEndDate       DateTime?
  resultsPublishDate    DateTime?
  
  // For re-run elections
  parentElectionId      String?
  parentElection        Election?  @relation("ReRunElections", fields: [parentElectionId], references: [id])
  reRunElections        Election[] @relation("ReRunElections")
  
  // Cancellation tracking
  cancellationReason   String?
  cancelledAt          DateTime?
  cancelledBy          String?
  
  // Relations
  observerApplications  ElectionObserverApplication[]
}
```

### New Model: ElectionObserverApplication

```prisma
model ElectionObserverApplication {
  id                    String               @id @default(uuid())
  electionId            String
  observerRegistrationId String
  pollingStationId      String
  status                ObserverAppStatus    @default(pending)
  availabilityStartDate DateTime             // Election day
  availabilityEndDate   DateTime             // End of tallying period
  applicationDate       DateTime             @default(now())
  reviewDate            DateTime?
  reviewedBy            String?
  reviewNotes           String?
  rejectionReason       String?
  priority              Int?                 // If observer applies to multiple stations
  createdAt             DateTime             @default(now())
  updatedAt             DateTime             @updatedAt
  
  election              Election              @relation(fields: [electionId], references: [id], onDelete: Cascade)
  observer              ObserverRegistration @relation(fields: [observerRegistrationId], references: [id], onDelete: Cascade)
  pollingStation        PollingStation       @relation(fields: [pollingStationId], references: [id])
  reviewer              User?                 @relation(fields: [reviewedBy], references: [id])
  
  @@unique([electionId, observerRegistrationId, pollingStationId])
  @@index([electionId, status])
  @@index([observerRegistrationId])
  @@index([pollingStationId])
  @@index([status])
  @@map("election_observer_applications")
}

enum ObserverAppStatus {
  pending
  approved
  rejected
  withdrawn
}
```

---

## UI/UX Design

### Multi-Step Wizard Component

```
┌─────────────────────────────────────────┐
│  Election Creation Wizard                │
├─────────────────────────────────────────┤
│  [1] Type  [2] Basic  [3] Timeline      │
│      [4] Contests  [5] Scope  [6] Review│
├─────────────────────────────────────────┤
│                                         │
│  [Current Step Content]                 │
│                                         │
├─────────────────────────────────────────┤
│  [Back]                    [Next/Save] │
└─────────────────────────────────────────┘
```

### Step Indicators
- Progress bar showing current step
- Completed steps: Green checkmark
- Current step: Highlighted
- Future steps: Grayed out
- Clickable to navigate (if validation allows)

### Form Validation
- Real-time validation on field blur
- Step-level validation before proceeding
- Summary of errors at review step
- Type-specific validation rules

### Responsive Design
- Mobile-friendly wizard
- Collapsible sections for complex steps
- Touch-friendly controls

---

## API Design

### Endpoints

#### POST /api/v1/elections
Create new election

**Request Body:**
```typescript
{
  electionType: 'general_election' | 'by_election' | 'referendum' | 're_run_election',
  electionCode: string,
  title: string,
  electionDate: Date,
  description?: string,
  
  // Timeline
  nominationOpenDate?: Date,
  nominationCloseDate?: Date,
  partyListDeadline?: Date,
  observerCallDate: Date,
  observerAppDeadline: Date,
  observerReviewDeadline: Date,
  tallyingStartDate: Date,
  tallyingEndDate: Date,
  resultsPublishDate?: Date,
  
  // Re-run specific
  parentElectionId?: string,
  
  // Contests (can be created separately or here)
  contests?: Array<{
    positionName: string,
    description?: string,
    countyId?: string,
    constituencyId?: string,
    wardId?: string,
    orderIndex?: number,
  }>,
  
  // Referendum specific
  referendumQuestions?: Array<{
    questionText: string,
    questionType: 'yes_no' | 'multiple_choice',
    thresholdRequirements?: {
      minTurnout?: number,
      supermajority?: number,
    },
    orderIndex?: number,
  }>,
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    id: string,
    electionCode: string,
    title: string,
    electionType: string,
    status: 'draft',
    // ... all fields
    contests: [...],
    creator: {...},
  }
}
```

#### POST /api/v1/elections/:id/contests
Add contest to election (alternative to including in create)

#### POST /api/v1/elections/:id/notify-observers
Send observer call emails

---

## Implementation Phases

### Phase 1: Basic Election Creation
- [ ] Update database schema with new fields
- [ ] Update validation schemas
- [ ] Enhance election service
- [ ] Create basic multi-step wizard UI
- [ ] Implement steps 1-2 (Type selection, Basic info)

### Phase 2: Timeline Management
- [ ] Add timeline fields to schema
- [ ] Create timeline configuration UI
- [ ] Implement date validation logic
- [ ] Add timeline visualization

### Phase 3: Contest Setup
- [ ] Contest creation UI
- [ ] Type-specific contest forms
- [ ] Geographic scope selection
- [ ] Bulk contest creation for general elections
- [ ] Referendum question editor

### Phase 4: Observer Integration
- [ ] Create ElectionObserverApplication model
- [ ] Observer call email system
- [ ] Observer application UI (separate feature)
- [ ] Integration with election creation

### Phase 5: Re-Run Elections
- [ ] Parent election linking
- [ ] Contest copying logic
- [ ] Re-run specific UI

---

## Validation Rules Summary

### General Rules (All Types)
- Election code must be unique
- Election date must be in future
- All dates must be in logical order
- At least one contest required (except referendum can have questions)

### Type-Specific Rules

#### General Election
- Must have contests for all levels (or selected levels)
- National scope (all areas)
- Multiple contests required

#### By-Election
- Single contest only
- Localized scope (single area)
- Position type must match geographic level

#### Referendum
- At least one question required
- National scope
- No candidates needed

#### Re-Run Election
- Parent election must be specified
- Parent election must be nullified/completed
- Can modify contests but structure should match

---

## Future Enhancements

1. **Election Templates**
   - Save common configurations as templates
   - Quick creation from templates

2. **Bulk Operations**
   - Create multiple by-elections at once
   - Clone elections with modifications

3. **Advanced Timeline Management**
   - Dependencies between dates
   - Automatic date suggestions based on rules
   - Calendar view of all election timelines

4. **Geographic Visualization**
   - Map showing election coverage
   - Interactive area selection

5. **Observer Capacity Planning**
   - Estimate observers needed
   - Coverage gap analysis
   - Observer pool availability check

---

## Questions to Resolve

1. **Contest Creation Timing**
   - Create contests during election creation or separately?
   - Recommendation: Allow both (create during or add later)

2. **Observer Notification Timing**
   - Send emails immediately on creation or schedule?
   - Recommendation: Option to send immediately or schedule

3. **Draft vs Scheduled**
   - Can election be created directly as scheduled?
   - Recommendation: Always start as draft, move to scheduled when ready

4. **Contest Validation**
   - Validate contest completeness before allowing election activation?
   - Recommendation: Warn but allow draft with incomplete contests

5. **Geographic Data**
   - How to handle polling station updates between creation and election day?
   - Recommendation: Snapshot at creation, allow updates until activation

