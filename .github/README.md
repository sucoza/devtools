# GitHub Actions Workflows

This directory contains GitHub Actions workflows for the TanStack DevTools Plugin Ecosystem.

## Workflows

### 🔄 CI Workflow (`ci.yml`)
**Triggers:** Push to `main`/`develop`, Pull Requests

**Purpose:** Continuous Integration testing across multiple environments

**Jobs:**
- **test**: Run tests on Node.js 18, 20, 21
- **build-plugins**: Build and test each plugin individually
- **build-matrix**: Test builds across Ubuntu, Windows, macOS
- **security**: Run security audits and vulnerability checks

**Key Features:**
- Matrix testing across Node.js versions and operating systems
- Individual plugin validation  
- Comprehensive security scanning
- Parallel execution for faster feedback

### 📦 Publish Workflow (`publish.yml`)
**Triggers:** Release published, version tags, manual dispatch

**Purpose:** Automated package publishing to NPM

**Jobs:**
- **validate**: Pre-publish validation and dependency building
- **publish-shared**: Publish shared packages in dependency order
- **publish-plugins**: Publish plugin packages after shared packages
- **create-release**: Generate GitHub release with changelog

**Key Features:**
- Smart dependency-aware publishing order
- Dry-run capability for testing
- Selective package publishing
- Automatic version bumping
- Changelog generation

**Usage:**
```bash
# Manual trigger with options
# Go to Actions tab → Publish → Run workflow
# - Version: patch/minor/major/prerelease
# - Packages: comma-separated list or "all"  
# - Dry run: true/false
```

### 🔍 Pull Request Workflow (`pr.yml`)
**Triggers:** Pull request events

**Purpose:** PR validation and quality checks

**Jobs:**
- **changes**: Detect which packages changed
- **validate-pr**: Validate PR title format
- **lint-shared**: Lint shared packages if changed
- **test-affected-plugins**: Test affected plugins
- **size-check**: Bundle size analysis and reporting
- **security-check**: Security vulnerability scanning
- **pr-summary**: Generate comprehensive PR summary

**Key Features:**
- Path-based change detection
- Semantic PR title validation
- Bundle size tracking with comments
- Comprehensive status reporting
- Smart testing of only affected code

## Required Secrets

Add these secrets in your GitHub repository settings:

### 📝 Required Secrets
- **`NPM_TOKEN`**: NPM authentication token for publishing
  - Generate at: https://www.npmjs.com/settings/tokens
  - Choose "Automation" token type
  - Scope: Public packages

### 🔧 Optional Secrets  
- **`GITHUB_TOKEN`**: Automatically provided by GitHub Actions

## Setup Instructions

### 1. NPM Token Setup
```bash
# 1. Login to NPM
npm login

# 2. Generate automation token
# Go to https://www.npmjs.com/settings/tokens
# Create "Automation" token

# 3. Add token to GitHub secrets
# Repository Settings → Secrets → Actions → New repository secret
# Name: NPM_TOKEN
# Value: npm_xxxxxxxxxxxx
```

### 2. Repository Settings
Ensure these settings are configured:

- **Branch Protection**: Require PR reviews, status checks
- **Actions Permissions**: Allow all actions and reusable workflows
- **Dependabot**: Enable security and version updates

### 3. Publishing Setup

#### Option A: Automatic (Recommended)
```bash
# 1. Create release through GitHub UI
# 2. Workflow automatically publishes all packages

# OR trigger manually
# Actions → Publish → Run workflow
```

#### Option B: Manual
```bash
# Build and publish locally
npm run build:all
npm run prerelease  # run tests
npm run release     # publish with changesets
```

## Package Publishing Order

The publish workflow respects package dependencies:

```
1. packages/devtools-common
2. packages/plugin-core  
3. packages/shared-components
4. packages/devtools-importer
5. All plugins/* (parallel)
```

## Monitoring & Troubleshooting

### 📊 Viewing Build Status
- **Main branch**: Status badge in README
- **Pull requests**: Check summary comment
- **Actions tab**: Detailed logs and artifacts

### 🐛 Common Issues

**Build Failures:**
- Check Node.js version compatibility
- Verify workspace dependencies are built
- Review TypeScript errors in logs

**Publish Failures:**
- Verify NPM_TOKEN is valid and has publish permissions
- Check if package version already exists
- Ensure package names are available

**Security Failures:**
- Review `npm audit` output
- Update vulnerable dependencies
- Consider security exemptions for false positives

### 🔧 Debugging Tips

**Local Testing:**
```bash
# Test CI commands locally
npm ci
npm run build:all
npm run test:all
npm run lint
npm run typecheck

# Test publish flow (dry run)
npm run build:all
# Manual publish with --dry-run flag
```

**Workflow Debugging:**
- Enable debug logging: Add `ACTIONS_RUNNER_DEBUG: true` 
- Check individual job logs
- Review artifact uploads/downloads
- Validate secret accessibility

## Best Practices

### 🎯 PR Guidelines
- Use semantic PR titles: `feat:`, `fix:`, `docs:`, etc.
- Keep changes focused and atomic
- Update tests when changing functionality
- Monitor bundle size impacts

### 🚀 Release Guidelines  
- Use semantic versioning
- Test release candidates with dry-run
- Coordinate shared package updates
- Monitor post-release metrics

### 🔒 Security Guidelines
- Regular dependency updates via Dependabot
- Monitor security advisories
- Use minimal token permissions
- Audit third-party actions

---

For questions or issues with CI/CD, please open an issue in the repository.