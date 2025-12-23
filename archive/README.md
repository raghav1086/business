# Archive Directory

This directory contains archived files that are no longer actively used in development but are kept for reference.

## Structure

- **`status-reports/`** - Historical status and progress reports
- **`old-configs/`** - Old configuration files (Docker, Jest, Playwright)
- **`old-tests/`** - Old test files, scripts, and test documentation
- **`old-scripts/`** - Old shell scripts (currently empty)

## Note

The `app/not_used/` directory still exists and contains:
- `docs/` - Old test documentation
- `scripts/` - Old test scripts  
- `tests/` - Old integration and E2E tests

**To complete the cleanup**, manually move these to `archive/old-tests/`:

```bash
cd /Users/ashishnimrot/Project/business
mv app/not_used/docs archive/old-tests/docs-old
mv app/not_used/scripts archive/old-tests/scripts-old  
mv app/not_used/tests archive/old-tests/tests-old
rmdir app/not_used
```

Or simply delete `app/not_used/` if you don't need those files.

