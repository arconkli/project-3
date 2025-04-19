# Campaign Workflow Implementation

This document outlines the campaign workflow in our platform.

## Database Schema

The database schema for campaigns consists of three main tables:

1. **campaigns** - Core campaign data
2. **campaign_creators** - Links between campaigns and creators (also serves as applications)
3. **campaign_posts** - Content submitted by creators for campaigns

## Campaign Workflow

### 1. Campaign Creation (Brand)

Brands can create campaigns by providing:
- Title
- Brief (for original/repurposed content)
- Content type (original, repurposed, both)
- Budget
- Date range
- Platforms
- Content guidelines
- Hashtags

When a brand creates a campaign, it's initially in **draft** status.

### 2. Campaign Review (Admin)

When the brand submits the campaign, it changes to **pending_approval** status.

Admins review the campaign details and can:
- Approve the campaign (changes to **approved** status)
- Reject the campaign (changes to **rejected** status, with an optional reason)

### 3. Campaign Activation

When a campaign is approved and its start date is reached, it automatically changes to **active** status via a database trigger.

### 4. Creator Application

Creators can browse available campaigns (those with **approved** or **active** status).

When a creator applies to join a campaign:
- An entry is created in the **campaign_creators** table with **pending_approval** status
- The brand reviews applications and approves/rejects creators
- Approved creators can submit content for the campaign

### 5. Content Submission

Creators submit content by providing:
- Platform (where the content is posted)
- Content type (original/repurposed)
- Post URL

Submissions are recorded in the **campaign_posts** table with **pending** status.

### 6. Content Review

Brands or admins review the submitted content and can:
- Approve the submission (changes to **approved** status)
- Reject the submission (changes to **rejected** status, with feedback)

When content is approved:
- The metrics (views, engagement) are tracked
- The creator earns based on the campaign's rates

### 7. Campaign Completion

A campaign is automatically marked as **completed** when:
- The end date is reached (via a cron job)
- The campaign budget is fully spent (via a trigger)

## Key Status Transitions

### Campaign Status Flow
```
draft -> pending_approval -> approved -> active -> completed
             |                 |
             v                 v
          rejected          cancelled
```

### Creator Application Status Flow
```
pending_approval -> approved
        |
        v
     rejected
```

### Content Submission Status Flow
```
pending -> approved -> live
    |
    v
 rejected
```

## Metrics Tracking

The platform automatically tracks various metrics:
- Views and engagement for posts
- Number of creators joined
- Number of posts submitted and approved
- Total spent and ROI

These metrics are stored in JSONB fields for flexibility and are updated by helper methods in the CampaignService class.

## Payment Integration

The payment workflow will be implemented in the next phase. It will involve:
- Charging brands when their campaign is approved
- Paying creators when their content reaches certain milestones
- Handling refunds and adjustments

## Technical Implementation

See the following files for implementation details:
- `CampaignService.ts` - Main service for campaign operations
- `types.ts` - Type definitions for campaigns and related entities
- Database stored procedures for status transitions and automated jobs 