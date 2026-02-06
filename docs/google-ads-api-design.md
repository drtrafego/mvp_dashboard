# Google Ads API Tool Design Document

## Company Information

- **Company Name**: Dr. Trafego Digital Marketing Agency
- **MCC Account ID**: 228-644-6148
- **Contact Email**: <dr.trafego@gmail.com>

---

## 1. Tool Overview

### Purpose

This tool is a **read-only dashboard** that retrieves and displays Google Ads campaign performance metrics for agency clients. The dashboard aggregates data from multiple client accounts under our MCC (Manager Account) to provide unified reporting.

### Business Use Case

Our agency manages Google Ads campaigns for multiple clients. We need to:

- Provide clients with real-time access to their campaign performance
- Generate aggregated reports across accounts
- Display key metrics in an easy-to-understand visual format

---

## 2. Technical Architecture

### Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                           │
│                    (Dashboard Interface)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        WEB SERVER                               │
│                    (Next.js Application)                        │
│                                                                 │
│  ┌────────────────┐    ┌────────────────┐    ┌──────────────┐  │
│  │   OAuth 2.0    │    │   API Client   │    │   Database   │  │
│  │   Handler      │───▶│   (Read-Only)  │───▶│   (Cache)    │  │
│  └────────────────┘    └────────────────┘    └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GOOGLE ADS API                               │
│              (GoogleAdsService.Search - READ ONLY)              │
└─────────────────────────────────────────────────────────────────┘
```

### Components

1. **Frontend**: React/Next.js dashboard displaying charts and metrics
2. **Backend**: Node.js server handling OAuth and API requests
3. **Database**: PostgreSQL for caching metrics and storing user sessions
4. **Authentication**: OAuth 2.0 for secure user authentication

---

## 3. API Usage Details

### Methods Used

We will use **ONLY** the following read-only operations:

| Method | Purpose | Frequency |
|--------|---------|-----------|
| `GoogleAdsService.Search` | Retrieve campaign metrics | Per user request |
| `CustomerService.ListAccessibleCustomers` | List client accounts | On login |

### Data Retrieved

- Campaign ID and Name
- Date segments
- Metrics: Impressions, Clicks, Cost, Conversions, Conversion Value

### Sample GAQL Query

```sql
SELECT 
    campaign.id, 
    campaign.name, 
    segments.date, 
    metrics.cost_micros, 
    metrics.impressions, 
    metrics.clicks, 
    metrics.conversions
FROM campaign 
WHERE segments.date DURING LAST_30_DAYS
```

---

## 4. Rate Limiting and Caching

### Strategy

- **Cache Duration**: 15 minutes for dashboard data
- **Request Frequency**: Maximum 1 request per user per 15 minutes
- **Daily Limit**: We expect < 1,000 API operations per day

### Implementation

- Database caching of API responses
- Client-side caching for repeat views
- Batch requests where possible

---

## 5. Security Measures

### Data Protection

- All API tokens stored encrypted in database
- OAuth 2.0 refresh tokens used for authentication
- HTTPS-only communication
- User sessions expire after 24 hours

### Access Control

- Multi-tenant architecture: users only see their own accounts
- Role-based access: admin, manager, viewer
- Audit logging of all API requests

---

## 6. Compliance

### Terms of Service

- We will comply with all Google Ads API Terms of Service
- No data will be shared with third parties
- No competitive analysis or data mining
- Read-only access only - no campaign modifications

### Privacy

- User data handled per LGPD (Brazil) requirements
- Data retention: 90 days for metrics, 30 days for logs
- Users can request data deletion

---

## 7. Support and Maintenance

### Contact Information

- **Primary Contact**: <dr.trafego@gmail.com>
- **Technical Support**: Available during business hours (BRT)

### Updates

- Application maintained and updated regularly
- Security patches applied within 48 hours
- API version updates followed per Google schedule

---

## Appendix: Screenshots

### Dashboard Preview

The dashboard displays campaign metrics in a clean, visual format with:

- KPI cards (Spend, Clicks, Impressions, Conversions)
- Performance charts over time
- Campaign-level breakdown tables
- Date range selector for custom reporting periods
