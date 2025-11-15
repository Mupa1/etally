# Agent Assignment Dashboard - Requirements Analysis

## Overview
Enhance the Agent Assignment page to provide comprehensive statistics and visualization for managing observer assignments to polling stations during active elections.

---

## 1. Election Status Management

### Current State
- Elections have status enum: `draft`, `scheduled`, `active`, `paused`, `completed`, `cancelled`
- Status can be updated via `PUT /api/v1/elections/:id`
- No dedicated UI for status management

### Requirements
1. **Activate Election**
   - Change status from `draft` or `scheduled` → `active`
   - Only elections with status `draft` or `scheduled` can be activated
   - Should validate that election has contests defined
   - Should validate that election date is in the future or today

2. **Close Election**
   - Change status from `active` or `paused` → `completed`
   - Only elections with status `active` or `paused` can be closed
   - Should allow adding completion notes/reason
   - Optionally: Archive assignments (set `isActive = false` on all assignments)

3. **UI Location**
   - Add status management controls to Election Management page
   - Quick actions: "Activate Election", "Close Election", "Pause Election"
   - Status badge showing current status

---

## 2. Statistics Requirements

### 2.1 Total Active Contests
**Definition**: Count of `ElectionContest` records where:
- Parent `Election.status = 'active'`
- `ElectionContest.deletedAt IS NULL`

**Display**: 
- Stat card showing total number
- Tooltip: "Number of contests in active elections"

### 2.2 Unassigned Stations
**Definition**: Total polling stations that:
- Are in geographic regions covered by active contests
- Do NOT have an active `ObserverAssignment` (`isActive = true`)
- `PollingStation.isActive = true`
- `PollingStation.deletedAt IS NULL`

**Calculation Logic**:
1. Get all active elections (`status = 'active'`)
2. For each election, determine geographic scope:
   - If `election.scopeLevel = 'nationwide'`: All polling stations
   - If `election.scopeLevel = 'county'` and `election.countyId`: All stations in that county
   - If `election.scopeLevel = 'constituency'` and `election.constituencyId`: All stations in that constituency
   - If `election.scopeLevel = 'county_assembly'` and `election.wardId`: All stations in that ward
3. For each contest in the election:
   - If `contest.countyId`: All stations in that county
   - If `contest.constituencyId`: All stations in that constituency
   - If `contest.wardId`: All stations in that ward
4. Union all stations from steps 2 and 3
5. Filter out stations with active assignments
6. Count remaining stations

**Display**:
- Stat card showing total number
- Tooltip: "Polling stations in active contests without assigned observers"

### 2.3 Fully Assigned Contests
**Definition**: Contests where:
- All polling stations in the contest's geographic scope have active assignments
- Contest is in an active election

**Calculation Logic**:
1. Get all contests in active elections
2. For each contest, determine its polling stations:
   - Based on contest's `countyId`, `constituencyId`, or `wardId`
3. Check if all stations have active assignments
4. Count contests where 100% of stations are assigned

**Display**:
- Stat card showing count
- Tooltip: "Contests where all polling stations have assigned observers"
- Can click to view list of fully assigned contests

### 2.4 Assignment Progress
**Definition**: Percentage of stations assigned vs total stations in active contests

**Calculation**:
```
Total Stations in Active Contests = (count of all stations in active contests)
Assigned Stations = (count of stations with active assignments in active contests)
Progress % = (Assigned Stations / Total Stations) * 100
```

**Display**:
- Gauge/Progress chart showing percentage
- Visual indicator (0-100%)
- Color coding:
  - 0-50%: Red (Critical)
  - 50-75%: Yellow (Warning)
  - 75-90%: Blue (Good)
  - 90-100%: Green (Excellent)

---

## 3. Data Model Relationships

### Current Schema
```
Election (status: ElectionStatus)
  └─ ElectionContest (countyId, constituencyId, wardId)
      └─ (indirectly) PollingStation (via geographic hierarchy)
          └─ ObserverAssignment (isActive, pollingStationId)
```

### Geographic Hierarchy
```
County
  └─ Constituency
      └─ ElectoralWard
          └─ PollingStation
```

### Key Relationships
- **Election → Contest**: One-to-many via `ElectionContest.electionId`
- **Contest → Polling Stations**: Many-to-many via geographic scope
- **Polling Station → Assignment**: One-to-many via `ObserverAssignment.pollingStationId`
- **Active Assignment**: `ObserverAssignment.isActive = true`

---

## 4. Backend API Requirements

### 4.1 Assignment Statistics Endpoint
**Endpoint**: `GET /api/v1/admin/observer-assignments/stats`

**Response**:
```typescript
{
  success: true,
  data: {
    totalActiveContests: number,
    totalStationsInActiveContests: number,
    assignedStations: number,
    unassignedStations: number,
    fullyAssignedContests: number,
    assignmentProgress: number, // 0-100
    contests: Array<{
      id: string,
      positionName: string,
      electionId: string,
      electionTitle: string,
      totalStations: number,
      assignedStations: number,
      progress: number,
      isFullyAssigned: boolean
    }>
  }
}
```

### 4.2 Election Status Update
**Endpoint**: `PUT /api/v1/elections/:id/status`

**Request**:
```typescript
{
  status: 'active' | 'completed' | 'paused',
  notes?: string // Optional notes for status change
}
```

**Validation**:
- Can only activate `draft` or `scheduled` elections
- Can only close `active` or `paused` elections
- Can only pause `active` elections
- Validate election has contests before activating

---

## 5. Frontend UI Requirements

### 5.1 Statistics Cards
1. **Total Active Contests**
   - Large number
   - Icon: List/Briefcase
   - Color: Primary

2. **Unassigned Stations**
   - Large number
   - Icon: Location/Map Pin
   - Color: Danger (if > 0), Success (if 0)

3. **Fully Assigned Contests**
   - Large number
   - Icon: Check Circle
   - Color: Success

4. **Assignment Progress**
   - Gauge/Progress Bar
   - Percentage display
   - Color-coded based on percentage

### 5.2 Visualizations
1. **Progress Gauge**
   - Circular or semi-circular gauge
   - Shows percentage (0-100%)
   - Color gradient based on progress
   - Center shows percentage number

2. **Contest Progress Table**
   - Table showing each contest
   - Columns: Contest Name, Election, Total Stations, Assigned, Progress %, Status
   - Sortable by progress, name, election
   - Filterable by election, fully assigned status

3. **Geographic Distribution** (Optional - Future)
   - Map or chart showing assignment coverage by region
   - Heat map of assignment density

### 5.3 Filters
- Filter by Election
- Filter by Contest
- Filter by Assignment Status (Assigned/Unassigned)
- Filter by Geographic Region (County/Constituency/Ward)

---

## 6. Implementation Phases

### Phase 1: Backend Statistics API
- [ ] Create statistics service method
- [ ] Create statistics endpoint
- [ ] Add election status update endpoint
- [ ] Add validation for status transitions

### Phase 2: Frontend Statistics Display
- [ ] Update statistics cards with new metrics
- [ ] Add progress gauge component
- [ ] Update data fetching logic

### Phase 3: Contest-Level Details
- [ ] Add contest progress table
- [ ] Add filters for contests
- [ ] Add drill-down to contest details

### Phase 4: Election Status Management
- [ ] Add status management to Election Management page
- [ ] Add activate/close actions
- [ ] Add status change confirmation dialogs

### Phase 5: Enhanced Visualizations (Optional)
- [ ] Add geographic distribution charts
- [ ] Add assignment trends over time
- [ ] Add export functionality

---

## 7. Technical Considerations

### Performance
- Statistics calculation may be expensive
- Consider caching statistics (5-10 minute TTL)
- Use database aggregations where possible
- Index on: `Election.status`, `ObserverAssignment.isActive`, `PollingStation.isActive`

### Data Consistency
- Handle race conditions when updating assignments
- Ensure statistics reflect current state
- Consider using database views for complex queries

### User Experience
- Show loading states during statistics calculation
- Provide refresh button to update statistics
- Show last updated timestamp
- Handle edge cases (no active elections, no contests, etc.)

---

## 8. Edge Cases

1. **No Active Elections**
   - Show zero for all statistics
   - Display message: "No active elections. Activate an election to begin assignments."

2. **Election with No Contests**
   - Should not be activatable (validation)
   - Or show warning if activated without contests

3. **Contest with No Polling Stations**
   - Show as fully assigned (0/0 = 100%)
   - Or exclude from statistics

4. **Stations in Multiple Contests**
   - Count station once in total, but count assignment for each contest
   - Or count station per contest (may inflate numbers)

5. **Inactive Polling Stations**
   - Exclude from statistics (already handled by `isActive = true` filter)

---

## 9. Clarifications (Confirmed)

1. **Station Counting**: ✅ **Each contest is considered separate** - If a station is in 2 contests, it counts as 2 stations (one per contest)

2. **Assignment Scope**: ✅ **One observer can cover multiple contests** at the same station. We should show agents with multiple active contests in a separate view.

3. **Geographic Scope**: ✅ **Use contest scope** - Presidential contest = nationwide coverage, Gubernatorial contest = county-wide scope

4. **Progress Calculation**: ✅ **Per contest** (for now) - Calculate progress for each contest individually

5. **Status Transitions**: ✅ **Elections can be reactivated** after being closed

---

## 10. Next Steps

1. **Review and Approve Requirements**
   - Review with stakeholders
   - Clarify questions above
   - Prioritize features

2. **Design Database Queries**
   - Optimize statistics queries
   - Create database indexes if needed
   - Consider materialized views for performance

3. **Create Backend Endpoints**
   - Implement statistics service
   - Add status update endpoint
   - Add validation and error handling

4. **Build Frontend Components**
   - Create gauge component
   - Update statistics cards
   - Add contest progress table

5. **Testing**
   - Unit tests for statistics calculations
   - Integration tests for API endpoints
   - E2E tests for UI flows

