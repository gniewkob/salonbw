# Content CMS Plan

## Overview

Landing page content is now managed via database (`content_sections` table) instead of hardcoded config files. This enables:
- Dynamic content updates without code deployment
- Future admin panel for content management
- Centralized content source for all frontends

## Architecture

### Database Schema

**Table:** `content_sections`

| Column | Type | Description |
|--------|------|-------------|
| id | int (PK) | Auto-increment primary key |
| key | varchar (unique) | Section identifier (e.g., 'hero_slides', 'founder_message') |
| data | jsonb | Section content as JSON |
| description | text (nullable) | Human-readable description of section |
| isActive | boolean | Whether section is active (default: true) |
| createdAt | timestamp | Creation timestamp |
| updatedAt | timestamp | Last update timestamp |

### API Endpoints

**Base URL:** `https://api.salon-bw.pl/content`

#### GET /content/sections
- **Public endpoint** (no auth required)
- Query params:
  - `active` (optional): Filter by active status (`?active=true`)
- Returns: Array of all content sections
- Used by: Landing page to fetch all sections at once

#### GET /content/sections/:key
- **Public endpoint** (no auth required)
- Params:
  - `key` (required): Section key (e.g., 'hero_slides')
- Returns: Single content section by key
- Throws: 404 if not found or inactive
- Used by: Landing page to fetch specific section

## Content Sections

### Current Sections (Seeded in Migration)

1. **business_info**
   - Business name, tagline, address, contact, hours, social links, booking URL
   - Used by: Navbar, Footer, Contact page, SEO meta tags

2. **hero_slides**
   - Array of 3 hero slides with title, description, image, alt text
   - Used by: HeroSlider component on homepage

3. **founder_message**
   - Founder name, quote, photo URL
   - Used by: FounderMessage component on homepage

4. **history_items**
   - Array of 3 history accordion items (title, content)
   - Used by: HistoryAccordion component on homepage

### Future Sections (To Be Added)

5. **core_values**
   - Array of 6 core values with icon, title, description
   - Used by: ValuesSection component

6. **salon_gallery**
   - Array of 8 salon interior images with captions
   - Used by: SalonGallery component

7. **seo_meta**
   - Default SEO meta tags, keywords, author, geo tags
   - Used by: All pages for SEO

8. **partner_brands**
   - Array of partner brand names
   - Used by: Homepage or About page

## Landing Integration

### Current State (Before Migration)
- Landing uses hardcoded `config/content.ts` with static Polish content
- No API integration for content

### After Migration (Phase 1: API Reading)
- Landing will fetch content from API on page load (SSR)
- Fallback to `config/content.ts` if API fails
- No client-side data fetching (use `getServerSideProps`)

### Future State (Phase 2: Panel CRUD)
- Panel (`panel.salon-bw.pl`) will have admin UI for content editing
- CRUD endpoints in API (POST, PUT, DELETE) protected by auth
- Real-time preview in panel before publishing
- Version history for content changes

## Implementation Steps

### ✅ Phase 1: Backend API (DONE)
1. ✅ Create ContentModule, ContentService, ContentController
2. ✅ Create ContentSection entity
3. ✅ Create migration with seed data
4. ✅ Register module in AppModule
5. ✅ Deploy API to production
6. ✅ Run migration on production DB

### 🔄 Phase 2: Landing Integration (IN PROGRESS)
1. Create API client helper for content fetching
2. Update homepage to fetch sections from API
3. Add fallback to config/content.ts on API failure
4. Update other pages (services, contact) to use API
5. Deploy landing to production
6. Verify content displays correctly

### 📝 Phase 3: Panel CRUD (PLANNED)
1. Create content management page in panel UI
2. Add auth guards to POST/PUT/DELETE endpoints
3. Build form UI for each content section type
4. Add validation and preview functionality
5. Implement version history (optional)
6. Document for non-technical users

## Migration Execution

```bash
# Connect to production DB via SSH tunnel
ssh vetternkraft@s0.mydevil.net

# Navigate to API directory
cd /usr/home/vetternkraft/apps/nodejs/api_salonbw

# Run migration
npm run migration:run

# Verify table created
psql -d vetternkraft_salonbw -c "\d content_sections"

# Check seeded data
psql -d vetternkraft_salonbw -c "SELECT key, description FROM content_sections;"
```

## API Testing

```bash
# Test public endpoint (no auth)
curl https://api.salon-bw.pl/content/sections

# Test specific section
curl https://api.salon-bw.pl/content/sections/hero_slides

# Test with active filter
curl https://api.salon-bw.pl/content/sections?active=true
```

## Security Considerations

- **Public GET endpoints**: No auth required (landing is public)
- **Future CRUD endpoints**: Protected by JwtAuthGuard (admin only)
- **Input validation**: JSON schema validation for data field
- **XSS protection**: Sanitize HTML in content before rendering
- **Rate limiting**: Apply throttle guard to prevent abuse

## Performance Considerations

- **Caching**: Content sections rarely change - cache for 1 hour
- **CDN**: Serve static images from CDN (hero slides, founder photo)
- **SSR**: Fetch content server-side to avoid client flash
- **Fallback**: Local config ensures landing works if API down

## Maintenance

- **Content updates**: Use panel UI (Phase 3) or direct DB queries
- **Backups**: Regular DB backups include content_sections table
- **Monitoring**: Track API response times for /content endpoints
- **Alerts**: Notify if content fetch fails repeatedly

## Status

- **Backend API:** ✅ Deployed (commit 8ae01aa3)
- **Database Migration:** 🔄 Pending (run after API deploy)
- **Landing Integration:** ⏳ Not started
- **Panel CRUD:** 📝 Planned (future work)

Last updated: 2026-02-15
