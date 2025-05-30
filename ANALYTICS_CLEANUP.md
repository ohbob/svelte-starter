# Analytics Cleanup Setup

## Overview

The analytics system automatically deletes data older than 120 days to prevent database bloat.

## Cron Job Setup

### 1. Set Environment Variable

Add to your `.env` file:

```bash
CLEANUP_API_TOKEN=your-super-secret-cleanup-token-here
```

### 2. Daily Cleanup Cron Job

Add this to your server's crontab (runs daily at 2 AM):

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * curl -X POST https://yoursite.com/api/analytics/cleanup \
  -H "Authorization: Bearer your-super-secret-cleanup-token-here" \
  -H "Content-Type: application/json" \
  -d '{"retentionDays": 120}' \
  >> /var/log/analytics-cleanup.log 2>&1
```

### 3. Alternative: GitHub Actions (if using Vercel/Netlify)

Create `.github/workflows/cleanup-analytics.yml`:

```yaml
name: Cleanup Analytics
on:
  schedule:
    - cron: "0 2 * * *" # Daily at 2 AM UTC
  workflow_dispatch: # Allow manual trigger

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Cleanup Old Analytics
        run: |
          curl -X POST ${{ secrets.SITE_URL }}/api/analytics/cleanup \
            -H "Authorization: Bearer ${{ secrets.CLEANUP_API_TOKEN }}" \
            -H "Content-Type: application/json" \
            -d '{"retentionDays": 120}'
```

### 4. Manual Cleanup

You can also run cleanup manually:

```bash
curl -X POST https://yoursite.com/api/analytics/cleanup \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{"retentionDays": 90}'
```

## Storage Benefits

### Before (Individual Tracking):

- 100k users × 10k views/day = 1B records/day
- ~10TB/month storage

### After (Aggregated Tracking):

- 100k users × 1 record/day = 100k records/day
- ~2.4GB/month storage
- **99.97% storage reduction!**

## Data Retention

- **Daily analytics**: 120 days (4 months)
- **Referrer analytics**: 120 days (4 months)
- **Automatic cleanup**: Runs daily via cron
- **Configurable**: Change retention period as needed
