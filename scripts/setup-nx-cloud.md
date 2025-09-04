# Nx Cloud Setup Guide

This guide will help you complete the Nx Cloud setup for the DevTools monorepo CI optimization.

## Prerequisites

✅ **Completed:**
- Nx Cloud package installed (`nx-cloud@19.1.0`)
- `nx.json` updated with Nx Cloud configuration
- CI pipeline optimized for distributed execution
- Nx affected commands implemented

## Next Steps Required

### 1. Complete Nx Cloud Connection

The `nx connect` command should have opened your browser to:
```
https://cloud.nx.app/connect/HKDy0nhnMx
```

**Actions needed:**
1. Sign in to Nx Cloud (or create account)
2. Connect your workspace
3. Copy the generated access token

### 2. Add GitHub Actions Secrets

Add these environment variables to your GitHub repository secrets:

**Repository Settings > Secrets and variables > Actions > New repository secret**

```
NX_CLOUD_ACCESS_TOKEN: [Your access token from step 1]
```

### 3. Update Local nx.json (Optional)

Once you have the access token, you can update the `nxCloudAccessToken` in `nx.json`:

```json
{
  "nxCloudAccessToken": "your-actual-token-here"
}
```

**Note:** The current configuration uses environment variables, so this is optional for CI.

### 4. Test the Setup

Test locally to verify Nx Cloud is working:

```bash
# Test affected command with cloud caching
npx nx affected -t build --parallel=3

# Check if artifacts are being cached
npx nx build devtools-common
npx nx build devtools-common  # Should be much faster due to cache
```

## CI Pipeline Optimizations Implemented

### Key Improvements

1. **Distributed Execution**: Uses 4 parallel agents for task distribution
2. **Affected Commands**: Only builds/tests changed projects
3. **Remote Caching**: Shares cache artifacts across CI runs
4. **Parallel Execution**: Optimized parallel task execution
5. **Build Graph Optimization**: Leverages dependency graph for optimal ordering

### Pipeline Structure

- **Main Job**: Orchestrates the build process, runs affected commands
- **Agent Jobs**: 4 parallel agents handle distributed tasks
- **Matrix Job**: Cross-platform validation (Ubuntu, Windows, macOS)
- **Security Job**: Security auditing (unchanged)

### Performance Benefits Expected

- **Cache Hits**: 70-90% reduction in build times for unchanged code
- **Parallel Execution**: 3-4x faster builds due to distributed agents
- **Affected Detection**: Skip unchanged packages entirely
- **Incremental Builds**: Only rebuild what changed

## Monitoring and Analytics

Once setup is complete, you'll have access to:

- **Nx Cloud Dashboard**: Build analytics and performance metrics
- **Cache Hit Rates**: Track caching effectiveness  
- **Task Distribution**: Monitor agent utilization
- **Build Timeline**: Visualize build performance over time

## Rollback Plan

If issues arise, the previous CI pipeline is preserved in:
```
.github/workflows/ci-backup.yml
```

You can:
1. Rename current `ci.yml` to `ci-nx-cloud.yml`
2. Rename `ci-backup.yml` to `ci.yml`
3. Remove Nx Cloud configuration from `nx.json`

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Verify `NX_CLOUD_ACCESS_TOKEN` is set correctly
2. **Agent Timeouts**: Increase `NX_CLOUD_DISTRIBUTED_EXECUTION_AGENT_COUNT` if needed
3. **Cache Misses**: Check `namedInputs` and `targetDefaults` in `nx.json`

### Debug Commands

```bash
# Check Nx Cloud status
npx nx-cloud status

# View Nx configuration
npx nx show projects

# Test affected detection
npx nx affected:dep-graph

# Clear local cache
npx nx reset
```

## Support

- **Nx Cloud Docs**: https://nx.dev/nx-cloud/intro/what-is-nx-cloud
- **Nx Community**: https://github.com/nrwl/nx/discussions
- **Nx Cloud Support**: support@nx.dev