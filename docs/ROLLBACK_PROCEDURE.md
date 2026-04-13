# Rollback Procedures

This document outlines step-by-step procedures for rolling back deployments when issues are detected in production.

## Quick Reference

| Component | Rollback Method | Time Required |
|-----------|----------------|---------------|
| API Backend | Redeploy previous commit | ~5-10 minutes |
| Dashboard Panel | Redeploy previous commit or restart | ~5-10 minutes |
| Public Site | Redeploy previous commit | ~5-10 minutes |
| Database Migrations | TypeORM revert command | ~2-5 minutes |

---

## When to Rollback

Rollback should be considered when:

- ✅ **Critical bugs** affecting core functionality (auth, payments, data loss)
- ✅ **Performance degradation** (>50% increase in response time, high error rates)
- ✅ **Security vulnerabilities** discovered post-deployment
- ✅ **Database issues** causing data corruption or unavailability
- ❌ **Minor UI bugs** (can be hot-fixed forward)
- ❌ **Non-critical feature issues** (can be disabled via feature flags)

**Rule of Thumb:** If fixing forward will take longer than rollback + re-deploy, roll back.

---

## Pre-Rollback Checklist

Before rolling back, gather this information:

1. **Current Production State:**
   - [ ] Note current commit SHA: `git log -1 --oneline`
   - [ ] Capture current error rates from Sentry
   - [ ] Check database migration status
   - [ ] Document the issue (symptoms, affected users, timeline)

2. **Target Rollback Version:**
   - [ ] Identify last known-good commit (check AGENT_STATUS.md)
   - [ ] Verify that commit passed CI/CD
   - [ ] Check if database migrations need reverting

3. **Impact Assessment:**
   - [ ] Estimate number of affected users
   - [ ] Determine if data loss will occur
   - [ ] Check if rollback will break existing user sessions

---

## Rollback Procedures

### 1. API Backend Rollback

**Scenario:** API deployment causing errors or performance issues

**Steps:**

1. **Identify Target Version:**
   ```bash
   # Check AGENT_STATUS.md for last known-good commit
   # Example: commit a98d923d deployed 2025-10-27
   ```

2. **Trigger Rollback Deployment:**
   ```bash
   gh workflow run deploy.yml \
     -f ref=a98d923d \
     -f target=api \
     -f environment=production
   ```

3. **Monitor Deployment:**
   ```bash
   gh run list --workflow deploy.yml --limit 1
   gh run watch <RUN_ID>
   ```

4. **Verify Rollback:**
   ```bash
   # Check health endpoint
   curl -s https://api.salon-bw.pl/healthz | jq '.status'

   # Check Sentry for error rate reduction
   # Check Prometheus metrics for request latency
   ```

5. **Database Migration Rollback (if needed):**
   ```bash
   ssh vetternkraft@s0.mydevil.net
   cd /usr/home/vetternkraft/apps/nodejs/api_salonbw
   npm run typeorm migration:revert
   ```

**Time Required:** 5-10 minutes

---

### 2. Dashboard Panel Rollback

**Scenario:** Dashboard causing errors or is inaccessible

**Quick Restart (if app just crashed):**

```bash
ssh vetternkraft@s0.mydevil.net
cd /usr/home/vetternkraft/apps/nodejs/panelbw
./start_app.sh
```

**Full Rollback (if deployment introduced bugs):**

1. **Identify Target Version:**
   ```bash
   # From AGENT_STATUS.md: last known-good commit a98d923d
   ```

2. **Trigger Rollback Deployment:**
   ```bash
   gh workflow run deploy.yml \
     -f ref=a98d923d \
     -f target=dashboard \
     -f environment=production
   ```

3. **Verify Rollback:**
   ```bash
   curl -I https://panel.salon-bw.pl/
   # Should return HTTP 307 (redirect) or 200

   # Check process is running
   ssh vetternkraft@s0.mydevil.net "ps aux | grep 'node app.js' | grep panelbw"
   ```

**Time Required:** 5-10 minutes (full rollback), 1-2 minutes (restart only)

---

### 3. Public Site Rollback

**Scenario:** Landing site deployment causing issues

**Steps:**

1. **Trigger Rollback Deployment:**
   ```bash
   gh workflow run deploy.yml \
     -f ref=<LAST_KNOWN_GOOD_COMMIT> \
     -f target=public \
     -f environment=production
   ```

2. **Verify Rollback:**
   ```bash
   curl -I https://salon-bw.pl/
   # Should return HTTP 301 → 200 (redirects to www)
   ```

**Time Required:** 5-10 minutes

---

### 4. Database Migration Rollback

**Scenario:** Database migration causing data issues or breaking changes

**CRITICAL:** Database rollbacks can cause data loss. Always backup first.

**Steps:**

1. **Backup Current Database:**
   ```bash
   ssh vetternkraft@s0.mydevil.net
   # Contact hosting support for database backup
   # Or use pg_dump if you have access
   ```

2. **Check Current Migration Status:**
   ```bash
   ssh vetternkraft@s0.mydevil.net
   cd /usr/home/vetternkraft/apps/nodejs/api_salonbw
   npm run typeorm migration:show
   ```

3. **Revert Last Migration:**
   ```bash
   npm run typeorm migration:revert
   ```

4. **Verify Database State:**
   ```bash
   # Test database queries via health endpoint
   curl -s https://api.salon-bw.pl/healthz | jq '.services.database'
   ```

5. **Rollback API to Match Database:**
   ```bash
   # Deploy API commit that matches current database schema
   gh workflow run deploy.yml -f ref=<MATCHING_COMMIT> -f target=api
   ```

**Time Required:** 2-5 minutes per migration

**Warning:** Reverting migrations may require manual data migration if data was transformed or deleted.

---

## Post-Rollback Procedures

After rolling back, follow these steps:

### 1. Verification Checklist

- [ ] All health checks passing: `curl https://api.salon-bw.pl/healthz`
- [ ] Error rates returned to normal (check Sentry)
- [ ] Critical user journeys working:
  - [ ] Login/authentication
  - [ ] Appointment creation
  - [ ] Payment processing
  - [ ] Email sending
- [ ] Database queries performing normally
- [ ] No new errors in logs

### 2. Communication

- [ ] Notify team in Slack/Teams: "Rolled back [component] to [commit] due to [issue]"
- [ ] Update AGENT_STATUS.md with incident details
- [ ] Create post-incident review ticket
- [ ] If customer-facing, send status update

### 3. Root Cause Analysis

- [ ] Review logs from failed deployment
- [ ] Identify what went wrong
- [ ] Document lessons learned in AGENT_STATUS.md
- [ ] Create tickets to prevent recurrence:
  - Add tests that would have caught the issue
  - Improve deployment verification
  - Update runbooks

### 4. Fix Forward Plan

- [ ] Create hotfix branch from rolled-back version
- [ ] Fix the issue
- [ ] Add regression tests
- [ ] Deploy hotfix following normal procedures
- [ ] Re-attempt original deployment after fixing

---

## Rollback Decision Tree

```
Issue Detected
    │
    ├─> Critical (data loss, security, complete outage)
    │   └─> IMMEDIATE ROLLBACK
    │
    ├─> High Impact (>50% users affected, major functionality broken)
    │   └─> Assess: Can fix forward in <15 min?
    │       ├─> Yes → Fix forward
    │       └─> No → ROLLBACK
    │
    ├─> Medium Impact (10-50% users affected, degraded performance)
    │   └─> Assess: Can fix forward in <30 min?
    │       ├─> Yes → Fix forward
    │       └─> No → ROLLBACK
    │
    └─> Low Impact (<10% users, non-critical features)
        └─> Fix forward or schedule next deployment
```

---

## Emergency Contacts

**Technical Issues:**
- Primary: Check AGENT_OPERATIONS.md for on-call rotation
- Escalation: [Add escalation contact]

**Hosting Issues (MyDevil):**
- Support: pomoc.mydevil.net
- SSH Access: vetternkraft@s0.mydevil.net

**External Services:**
- Sentry: [Add Sentry contact/login]
- Database: [Add database admin contact]

---

## Automated Rollback (Future)

Currently, rollbacks are manual. Future improvements:

1. **Automated Canary Deployments:**
   - Deploy to 10% of traffic first
   - Auto-rollback if error rate increases

2. **Circuit Breaker:**
   - Monitor error rates post-deployment
   - Auto-rollback if thresholds exceeded

3. **Database Migration Safety:**
   - Require UP+DOWN migrations
   - Test rollback in staging before production

4. **Feature Flags:**
   - Deploy code disabled by default
   - Enable gradually, rollback instantly

---

## Testing Rollback Procedures

**Staging Environment Test (Quarterly):**

1. Deploy a breaking change to staging
2. Practice rollback procedure
3. Time how long it takes
4. Document any issues
5. Update this runbook

**Production Drill (Annually):**

1. Schedule low-traffic window
2. Deploy a minor version rollback
3. Verify all systems work
4. Roll forward to current version
5. Document lessons learned

---

## Troubleshooting Failed Rollbacks

### Issue: Deployment workflow fails

**Solution:**
```bash
# Check workflow logs
gh run view <RUN_ID> --log

# Common issues:
# - SSH key expired → Update secrets
# - Build failures → Check for syntax errors
# - Disk space full → Clean up old deployments
```

### Issue: Database migration revert fails

**Solution:**
```bash
# Check migration logs
npm run typeorm migration:show

# Manually revert if needed:
# 1. Backup database
# 2. Manually run DOWN migration SQL
# 3. Remove migration entry from migrations table
```

### Issue: Process won't start after rollback

**Solution:**
```bash
# Check logs
ssh vetternkraft@s0.mydevil.net
tail -100 /usr/home/vetternkraft/apps/nodejs/panelbw/public/server.log

# Common fixes:
# - Missing environment variables → Check .env files
# - Port already in use → Kill old process
# - Node modules missing → Run npm install
```

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-21 | 1.0 | Initial rollback procedures document |

---

## Related Documents

- [AGENT_OPERATIONS.md](./AGENT_OPERATIONS.md) - Operational procedures
- [AGENT_STATUS.md](./AGENT_STATUS.md) - Current deployment status
- [DEPLOYMENT_MYDEVIL.md](./DEPLOYMENT_MYDEVIL.md) - Deployment procedures
- [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md) - Pre-deployment checklist
