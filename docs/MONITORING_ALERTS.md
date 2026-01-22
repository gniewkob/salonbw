# Monitoring & Alert Configuration

This document defines alert thresholds, severity levels, and response playbooks for the Salon Black & White platform.

## Alert Severity Levels

| Severity | Response Time | Example | Escalation |
|----------|--------------|---------|------------|
| 🔴 **Critical** | Immediate (< 5 min) | Complete service outage, data loss | Page on-call immediately |
| 🟠 **High** | < 15 minutes | Degraded performance affecting >50% users | Notify team, begin investigation |
| 🟡 **Warning** | < 1 hour | Minor issues, affecting <10% users | Create ticket, monitor |
| 🟢 **Info** | Next business day | Performance trends, capacity planning | Log for review |

---

## Current Monitoring Systems

### 1. UptimeRobot
- **Monitors:** salon-bw.pl, panel.salon-bw.pl, api.salon-bw.pl, dev.salon-bw.pl
- **Frequency:** 60-second intervals
- **Locations:** US-East, EU-West
- **Alert Method:** [Configure email/SMS/Slack]

### 2. Pingdom
- **Monitors:** Same as UptimeRobot
- **Frequency:** 5-minute intervals
- **Locations:** APAC
- **Alert Method:** [Configure email/SMS/Slack]

### 3. Sentry
- **Monitors:** Application errors, performance
- **Features:** Error tracking, performance monitoring, session replay
- **Alert Method:** Email, Slack integration

### 4. Prometheus
- **Endpoint:** https://api.salon-bw.pl/metrics
- **Metrics:** HTTP requests, database performance, business metrics
- **Visualization:** [Configure Grafana if available]

---

## Alert Thresholds

### API Backend (api.salon-bw.pl)

#### Uptime & Availability
| Metric | Warning | Critical | Notes |
|--------|---------|----------|-------|
| HTTP 5xx Error Rate | >1% | >5% | Check Sentry for root cause |
| Response Time (p95) | >1s | >3s | Check database query performance |
| Response Time (p99) | >2s | >5s | May indicate outlier queries |
| Availability | <99.5% | <99% | SLA target: 99.9% |

#### Database
| Metric | Warning | Critical | Notes |
|--------|---------|----------|-------|
| Connection Pool Usage | >80% | >95% | May need to scale connections |
| Query Latency (p95) | >100ms | >500ms | Check for missing indexes |
| Failed Connections | >1/min | >10/min | Database may be overloaded |

#### Business Metrics
| Metric | Warning | Critical | Notes |
|--------|---------|----------|-------|
| Email Send Failures | >5% | >10% | Check SMTP configuration |
| Appointment Creation Failures | >1% | >5% | May indicate data validation issues |

### Dashboard Panel (panel.salon-bw.pl)

#### Process Health
| Metric | Warning | Critical | Notes |
|--------|---------|----------|-------|
| Process Not Running | - | Immediate | Proxy returns 502 Bad Gateway |
| Memory Usage | >80% | >95% | May indicate memory leak |
| Restart Count | >3/hour | >10/hour | Indicates stability issue |

#### Frontend Performance
| Metric | Warning | Critical | Notes |
|--------|---------|----------|-------|
| Load Time (p95) | >3s | >5s | Check bundle size, API latency |
| JavaScript Errors | >1/min | >10/min | Check Sentry for details |

### Public Site (salon-bw.pl)

#### Availability
| Metric | Warning | Critical | Notes |
|--------|---------|----------|-------|
| Availability | <99.9% | <99% | Higher SLA for public site |
| Load Time (p95) | >2s | >4s | Check image optimization |

#### Core Web Vitals
| Metric | Warning | Critical | Notes |
|--------|---------|----------|-------|
| LCP (Largest Contentful Paint) | >2.5s | >4s | Affects SEO ranking |
| FID (First Input Delay) | >100ms | >300ms | User experience metric |
| CLS (Cumulative Layout Shift) | >0.1 | >0.25 | Visual stability |

---

## Alert Response Playbooks

### 🔴 Critical: API Complete Outage (502/503)

**Symptoms:**
- UptimeRobot/Pingdom alerts firing
- `/healthz` returning 502 or 503
- Sentry showing spike in errors

**Immediate Actions:**
1. Check API process status:
   ```bash
   ssh vetternkraft@s0.mydevil.net
   ps aux | grep node | grep api
   ```

2. Check health endpoint:
   ```bash
   curl -v https://api.salon-bw.pl/healthz
   ```

3. If process not running, restart:
   ```bash
   devil www restart api.salon-bw.pl
   ```

4. If process running but unhealthy, check logs:
   ```bash
   tail -100 ~/apps/nodejs/api_salonbw/logs/*.log
   ```

5. If database connection failed:
   - Check database credentials
   - Verify database server is accessible
   - Check connection pool settings

**Escalation Path:**
- 0-5 min: On-call engineer investigates
- 5-15 min: If not resolved, escalate to senior engineer
- 15+ min: Consider rollback to last known-good version

**Post-Incident:**
- Update AGENT_STATUS.md with incident details
- Create post-incident review ticket
- Identify root cause and preventive measures

---

### 🔴 Critical: Dashboard Panel Down (502)

**Symptoms:**
- panel.salon-bw.pl returning 502 Bad Gateway
- Users unable to access dashboard
- Process not responding on port 3001

**Immediate Actions:**
1. Check if Node.js process is running:
   ```bash
   ssh vetternkraft@s0.mydevil.net
   ps aux | grep 'node app.js' | grep panelbw
   ```

2. If not running, restart using start script:
   ```bash
   cd /usr/home/vetternkraft/apps/nodejs/panelbw
   ./start_app.sh
   ```

3. Wait 10 seconds and verify:
   ```bash
   curl -I https://panel.salon-bw.pl/
   # Should return HTTP 307 or 200
   ```

4. If still failing, check logs:
   ```bash
   tail -100 /usr/home/vetternkraft/apps/nodejs/panelbw/public/server.log
   ```

5. Check for port conflicts:
   ```bash
   lsof -i :3001
   ```

**Prevention:**
- Deploy monitor script to cron (see scripts/monitor-panel.sh)
- Add process monitoring alerts
- Consider implementing Passenger-managed setup

---

### 🟠 High: Error Rate Spike (>5%)

**Symptoms:**
- Sentry showing increased error volume
- Error rate above 5% threshold
- Specific error pattern repeating

**Investigation Steps:**
1. Open Sentry dashboard:
   - Identify most frequent error
   - Check which routes are affected
   - Review stack traces

2. Check deployment timeline:
   ```bash
   # Was there a recent deployment?
   gh run list --workflow deploy.yml --limit 5
   ```

3. Check database performance:
   ```bash
   curl -s https://api.salon-bw.pl/healthz | jq '.services.database'
   ```

4. Review Prometheus metrics:
   - Check HTTP request latency
   - Look for abnormal patterns

**Resolution:**
- If caused by recent deployment → Rollback (see ROLLBACK_PROCEDURE.md)
- If caused by bad data → Fix data, add validation
- If caused by external service → Add circuit breaker, retry logic

---

### 🟠 High: Database Connection Pool Saturation

**Symptoms:**
- Connection pool usage >95%
- Slow query performance
- Timeouts on database operations

**Investigation Steps:**
1. Check current pool status via Prometheus:
   - `salonbw_db_connections_active`
   - `salonbw_db_connections_total`

2. Check for long-running queries:
   ```bash
   # If you have database access:
   SELECT pid, now() - query_start as duration, query
   FROM pg_stat_activity
   WHERE state = 'active'
   ORDER BY duration DESC;
   ```

3. Check for connection leaks in code:
   - Review Sentry for unclosed connection errors
   - Check TypeORM query builder usage

**Resolution:**
- Short-term: Restart API to reset connections
- Medium-term: Increase pool size in configuration
- Long-term: Fix connection leaks in code, add connection timeouts

---

### 🟡 Warning: High Response Time (>1s p95)

**Symptoms:**
- API response times slower than normal
- Users reporting slow performance
- Prometheus showing latency increase

**Investigation Steps:**
1. Check database query performance:
   ```bash
   # Review slow query logs if enabled
   # Check Prometheus db_query_duration_seconds metric
   ```

2. Identify slow endpoints:
   - Review Prometheus http_server_request_duration_seconds by route
   - Check Sentry performance traces

3. Check system resources:
   ```bash
   ssh vetternkraft@s0.mydevil.net
   top  # Check CPU and memory usage
   df -h  # Check disk space
   ```

**Resolution:**
- Add database indexes for slow queries
- Implement caching for frequently accessed data
- Optimize N+1 queries
- Consider adding pagination

---

### 🟡 Warning: Email Send Failures (>5%)

**Symptoms:**
- Email delivery failing
- SMTP errors in logs
- Users not receiving notifications

**Investigation Steps:**
1. Check SMTP health:
   ```bash
   curl -s https://api.salon-bw.pl/healthz | jq '.services.smtp'
   ```

2. Check email service logs:
   ```bash
   ssh vetternkraft@s0.mydevil.net
   tail -100 ~/apps/nodejs/api_salonbw/logs/*.log | grep -i smtp
   ```

3. Verify SMTP configuration:
   - Check environment variables (SMTP_HOST, SMTP_PORT, SMTP_USER)
   - Test SMTP connection manually

**Resolution:**
- If credentials expired → Update SMTP_PASSWORD
- If rate limited → Implement retry with exponential backoff
- If blacklisted → Contact email provider, improve email content

---

### 🟢 Info: Memory Usage Trending Up

**Symptoms:**
- Memory usage steadily increasing over days
- Not yet critical but trend is concerning
- May indicate memory leak

**Investigation Steps:**
1. Review memory usage trends in Prometheus
2. Check for unreleased resources:
   - Database connections not closed
   - File handles not released
   - Large objects in memory

3. Enable Node.js heap snapshots:
   ```bash
   # Add to PM2 config if using PM2
   # Or use node --inspect for debugging
   ```

**Resolution:**
- Schedule restart during low-traffic window
- Investigate memory leaks in code
- Add memory limit and auto-restart on threshold
- Consider horizontal scaling if needed

---

## Alert Configuration Examples

### UptimeRobot Alert Policy

```yaml
Monitors:
  - URL: https://api.salon-bw.pl/healthz
    Type: HTTP(s)
    Interval: 60 seconds
    Timeout: 30 seconds
    Alert if: Status != 200 OR Response contains "error"

  - URL: https://panel.salon-bw.pl/
    Type: HTTP(s)
    Interval: 60 seconds
    Timeout: 30 seconds
    Alert if: Status == 502 OR Status == 503

Notification Channels:
  - Email: alerts@salon-bw.pl
  - Slack: #production-alerts
```

### Sentry Alert Rules

```yaml
Error Rate Alert:
  Condition: Error count > 10 in 5 minutes
  Severity: High
  Notify: #production-alerts

Performance Degradation:
  Condition: Transaction duration p95 > 3s
  Severity: Warning
  Notify: #engineering

New Issue:
  Condition: First seen error
  Severity: Info
  Notify: #engineering
```

---

## Monitoring Dashboards

### Grafana Dashboard (Recommended Setup)

**API Health Dashboard:**
- HTTP Request Rate (requests/sec)
- HTTP Response Time (p50, p95, p99)
- Error Rate (%)
- Database Connection Pool Status
- Database Query Latency

**Business Metrics Dashboard:**
- Appointments Created (count/hour)
- Emails Sent (count/hour, success rate)
- Active Users (concurrent)
- Revenue Metrics (if applicable)

**System Resources Dashboard:**
- CPU Usage (%)
- Memory Usage (MB, %)
- Disk I/O
- Network Traffic

---

## On-Call Rotation

**Current Setup:** [Configure on-call schedule]

**On-Call Responsibilities:**
1. Respond to Critical alerts within 5 minutes
2. Acknowledge alerts in monitoring system
3. Follow runbooks for common issues
4. Escalate if unable to resolve within 15 minutes
5. Document incidents in AGENT_STATUS.md

**Escalation Path:**
1. On-call engineer (0-5 min)
2. Senior engineer (5-15 min)
3. Team lead (15-30 min)
4. CTO/Technical Director (30+ min)

---

## Alert Tuning

**Review Frequency:** Monthly

**Tuning Process:**
1. Review false positive rate
2. Adjust thresholds based on actual baselines
3. Add new alerts for discovered gaps
4. Remove noisy alerts that don't require action

**Current Baselines (as of 2026-01-21):**
- API p95 response time: ~100ms
- Database query p95: ~10ms
- Error rate: <0.1%
- Uptime: 99.9%

---

## Related Documents

- [AGENT_OPERATIONS.md](./AGENT_OPERATIONS.md) - Operational procedures
- [ROLLBACK_PROCEDURE.md](./ROLLBACK_PROCEDURE.md) - Rollback procedures
- [AGENT_STATUS.md](./AGENT_STATUS.md) - Current status and incidents
- [RELEASE_CHECKLIST.md](./RELEASE_CHECKLIST.md) - Pre-deployment verification

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-21 | 1.0 | Initial monitoring and alert configuration document |
