# API Reference

## Meta Graph API

We interact with the Meta Graph API to fetch ad performance and creative data.

### Endpoints

- **Base URL**: `https://graph.facebook.com/v19.0`
- **Account Campaigns**: `GET /{act_id}/campaigns?fields=id,name,status,objective`
- **Ad Insights**: `GET /{ad_id}/insights?fields=spend,impressions,clicks,cpc,ctr,actions`
- **Ad Creatives**: `GET /{creative_id}?fields=thumbnail_url,body,title,object_story_spec`

### Data Structure

- **Hierarchy**: Business -> Ad Account -> Campaign -> Ad Set -> Ad -> Creative.
- **Pagination**: Uses cursor-based pagination (`after` token).

## Google Ads API

### Endpoints

- **Reporting**: `customers/{customer_id}/googleAds:searchStream`
- **Query**: "SELECT campaign.id, metrics.cost_micros, metrics.impressions FROM campaign"
