# Grafana Panel 2: Failed Logins by IP - Detailed Instructions

## Step-by-Step Guide

### 1. Add New Panel
- In your SOC dashboard, click **"Add"** → **"Visualization"** (or click the **"Add panel"** button)

### 2. Configure Data Source
- At the top, select **"Loki"** as your data source

### 3. Enter Query
In the query editor, paste this LogQL query:

```logql
sum(count_over_time({job="api"} | json | eventType="login_attempt" | success="false" [1h])) by (ipAddress)
```

**Alternative simpler query** (if the above doesn't work):
```logql
{job="api"} | json | eventType="login_attempt" | success="false"
```

### 4. Set Visualization Type
- In the right sidebar, scroll to **"Visualization"** section
- Select **"Table"** from the dropdown

### 5. Configure Table Display

**Option A: Using Transform (Recommended)**
1. Click **"Transform"** tab (next to "Query")
2. Click **"Add transformation"**
3. Select **"Organize fields"**
4. Configure:
   - Keep `ipAddress` field → Rename to "IP Address"
   - Keep `Value` field → Rename to "Failed Attempts"
   - Hide all other fields

**Option B: Using Overrides**
1. Go to **"Field"** tab in right sidebar
2. Click **"Add field override"**
3. Select field to override
4. Set display name

### 6. Format Numbers
- In **"Field"** tab, select the "Failed Attempts" field
- Set **"Unit"** to "short" or "none"
- Set **"Decimals"** to 0

### 7. Set Panel Title
- In right sidebar, go to **"Panel options"**
- Set **"Title"**: `Top IPs with Failed Logins`
- Set **"Description"** (optional): `Shows the top 10 IP addresses with the most failed login attempts in the last hour`

### 8. Configure Time Range
- In the top right, set time range to **"Last 1 hour"**

### 9. Sort and Limit
- In the table, click column headers to sort
- The query already limits to top 10 with `topk(10, ...)`

### 10. Save Panel
- Click **"Apply"** button (top right)
- Click **"Save dashboard"** icon (floppy disk icon)

## Troubleshooting

**If query returns no data:**
1. Check if logs are being collected: Go to **Explore** → Select Loki → Query: `{job="api"}`
2. Verify JSON parsing: Try query: `{job="api"} | json`
3. Check eventType field: Try query: `{job="api"} | json | eventType="login_attempt"`

**If table shows wrong columns:**
- Use the "Organize fields" transform to explicitly select which columns to show
- Or use "Add field override" to rename columns

**If you see "No data" error:**
- Make sure you have failed login attempts in the last hour
- Try expanding time range to "Last 24 hours"
- Check that Promtail is collecting logs from `/var/log/api/security-*.log`

## Alternative: Using Logs Visualization

If table doesn't work well, you can use **"Logs"** visualization instead:

1. Set visualization to **"Logs"**
2. Use query:
```logql
{job="api"} | json | eventType="login_attempt" | success="false" | line_format "IP: {{.ipAddress}} | Attempts: {{.timestamp}}"
```
3. This will show a log list with IP addresses




