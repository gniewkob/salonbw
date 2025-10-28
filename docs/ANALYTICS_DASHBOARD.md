GA4 Dashboard Quickstart

This guide helps you set up a lightweight GA4 dashboard for key events we emit client‑side.

Events and Parameters

- begin_checkout: { items[], cta }
- select_item: { item_list_name, items[], cta }
- view_item: { items[] }
- view_item_list: { item_list_name, items[] }
- purchase: { value, currency, items[] }
- scroll_depth: { percent, path }
- lightbox_open/close/next/prev/share/download: { src, index? }

Custom Dimensions (GA4 → Configure → Custom definitions)

Create the following Event‑scoped custom dimensions with matching parameter names:

- item_list_name
- cta
- percent
- path
- src
- index (Number)

Suggested Explorations

1) Booking Funnel (Free Form)
   - Rows: Event name
   - Columns: cta
   - Filters: Event name in [begin_checkout, purchase]
   - Values: Event count

2) Services Interest (Item views)
   - Rows: item_name
   - Filters: Event name = view_item
   - Values: Event count

3) Gallery Engagement
   - Rows: Event name
   - Filters: Event name in [lightbox_open, lightbox_next, lightbox_download]
   - Values: Event count

4) Scroll Depth by Path
   - Rows: percent
   - Columns: path
   - Filters: Event name = scroll_depth
   - Values: Event count

Quick Data API check (optional)

Use GA4 Data API (replace PROPERTY_ID and set GOOGLE_APPLICATION_CREDENTIALS):

```
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
  https://analyticsdata.googleapis.com/v1beta/properties/PROPERTY_ID:runReport \
  -d '{
    "metrics": [{"name":"eventCount"}],
    "dimensions": [{"name":"eventName"}],
    "dateRanges": [{"startDate":"7daysAgo","endDate":"today"}],
    "dimensionFilter": {"filter": {"fieldName":"eventName","stringFilter":{"matchType":"EXACT","value":"begin_checkout"}}}
  }'
```

Notes

- Ensure NEXT_PUBLIC_ENABLE_ANALYTICS=true and NEXT_PUBLIC_GA_ID are set at build/deploy.
- For consistent funnels, keep event parameter names exactly as listed above.

