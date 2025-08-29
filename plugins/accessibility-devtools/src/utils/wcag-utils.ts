import type { WCAGLevel, SeverityLevel } from '../types';

// WCAG 2.1 Success Criteria mapping
export const WCAG_CRITERIA = {
  // Level A
  A: {
    '1.1.1': 'Non-text Content',
    '1.2.1': 'Audio-only and Video-only (Prerecorded)',
    '1.2.2': 'Captions (Prerecorded)',
    '1.2.3': 'Audio Description or Media Alternative (Prerecorded)',
    '1.3.1': 'Info and Relationships',
    '1.3.2': 'Meaningful Sequence',
    '1.3.3': 'Sensory Characteristics',
    '1.4.1': 'Use of Color',
    '1.4.2': 'Audio Control',
    '2.1.1': 'Keyboard',
    '2.1.2': 'No Keyboard Trap',
    '2.1.4': 'Character Key Shortcuts',
    '2.2.1': 'Timing Adjustable',
    '2.2.2': 'Pause, Stop, Hide',
    '2.3.1': 'Three Flashes or Below Threshold',
    '2.4.1': 'Bypass Blocks',
    '2.4.2': 'Page Titled',
    '2.4.3': 'Focus Order',
    '2.4.4': 'Link Purpose (In Context)',
    '2.5.1': 'Pointer Gestures',
    '2.5.2': 'Pointer Cancellation',
    '2.5.3': 'Label in Name',
    '2.5.4': 'Motion Actuation',
    '3.1.1': 'Language of Page',
    '3.2.1': 'On Focus',
    '3.2.2': 'On Input',
    '3.3.1': 'Error Identification',
    '3.3.2': 'Labels or Instructions',
    '4.1.1': 'Parsing',
    '4.1.2': 'Name, Role, Value',
    '4.1.3': 'Status Messages',
  },
  
  // Level AA
  AA: {
    '1.2.4': 'Captions (Live)',
    '1.2.5': 'Audio Description (Prerecorded)',
    '1.3.4': 'Orientation',
    '1.3.5': 'Identify Input Purpose',
    '1.4.3': 'Contrast (Minimum)',
    '1.4.4': 'Resize text',
    '1.4.5': 'Images of Text',
    '1.4.10': 'Reflow',
    '1.4.11': 'Non-text Contrast',
    '1.4.12': 'Text Spacing',
    '1.4.13': 'Content on Hover or Focus',
    '2.4.5': 'Multiple Ways',
    '2.4.6': 'Headings and Labels',
    '2.4.7': 'Focus Visible',
    '3.1.2': 'Language of Parts',
    '3.2.3': 'Consistent Navigation',
    '3.2.4': 'Consistent Identification',
    '3.3.3': 'Error Suggestion',
    '3.3.4': 'Error Prevention (Legal, Financial, Data)',
  },
  
  // Level AAA
  AAA: {
    '1.2.6': 'Sign Language (Prerecorded)',
    '1.2.7': 'Extended Audio Description (Prerecorded)',
    '1.2.8': 'Media Alternative (Prerecorded)',
    '1.2.9': 'Audio-only (Live)',
    '1.4.6': 'Contrast (Enhanced)',
    '1.4.7': 'Low or No Background Audio',
    '1.4.8': 'Visual Presentation',
    '1.4.9': 'Images of Text (No Exception)',
    '2.1.3': 'Keyboard (No Exception)',
    '2.2.3': 'No Timing',
    '2.2.4': 'Interruptions',
    '2.2.5': 'Re-authenticating',
    '2.2.6': 'Timeouts',
    '2.3.2': 'Three Flashes',
    '2.3.3': 'Animation from Interactions',
    '2.4.8': 'Location',
    '2.4.9': 'Link Purpose (Link Only)',
    '2.4.10': 'Section Headings',
    '2.5.5': 'Target Size',
    '2.5.6': 'Concurrent Input Mechanisms',
    '3.1.3': 'Unusual Words',
    '3.1.4': 'Abbreviations',
    '3.1.5': 'Reading Level',
    '3.1.6': 'Pronunciation',
    '3.2.5': 'Change on Request',
    '3.3.5': 'Help',
    '3.3.6': 'Error Prevention (All)',
  },
} as const;

/**
 * Get WCAG level for a given success criterion
 */
export function getWCAGLevel(criterion: string): WCAGLevel | null {
  if (criterion in WCAG_CRITERIA.A) return 'A';
  if (criterion in WCAG_CRITERIA.AA) return 'AA';
  if (criterion in WCAG_CRITERIA.AAA) return 'AAA';
  return null;
}

/**
 * Get description for a WCAG success criterion
 */
export function getWCAGDescription(criterion: string): string | null {
  const levelA = WCAG_CRITERIA.A[criterion as keyof typeof WCAG_CRITERIA.A];
  const levelAA = WCAG_CRITERIA.AA[criterion as keyof typeof WCAG_CRITERIA.AA];
  const levelAAA = WCAG_CRITERIA.AAA[criterion as keyof typeof WCAG_CRITERIA.AAA];
  
  return levelA || levelAA || levelAAA || null;
}

/**
 * Check if a WCAG success criterion meets a specific level
 */
export function meetsWCAGLevel(criterion: string, targetLevel: WCAGLevel): boolean {
  const criterionLevel = getWCAGLevel(criterion);
  if (!criterionLevel) return false;
  
  const levelHierarchy = { 'A': 1, 'AA': 2, 'AAA': 3 };
  return levelHierarchy[criterionLevel] <= levelHierarchy[targetLevel];
}

/**
 * Get all success criteria for a specific WCAG level (including lower levels)
 */
export function getWCAGCriteria(level: WCAGLevel): Record<string, string> {
  const criteria = { ...WCAG_CRITERIA.A };
  
  if (level === 'AA' || level === 'AAA') {
    Object.assign(criteria, WCAG_CRITERIA.AA);
  }
  
  if (level === 'AAA') {
    Object.assign(criteria, WCAG_CRITERIA.AAA);
  }
  
  return criteria;
}

/**
 * Map axe-core impact levels to WCAG severity
 */
export function mapImpactToSeverity(impact: string): SeverityLevel {
  switch (impact) {
    case 'critical':
      return 'critical';
    case 'serious':
      return 'serious';
    case 'moderate':
      return 'moderate';
    case 'minor':
    case 'trivial':
      return 'minor';
    default:
      return 'moderate';
  }
}

/**
 * Determine WCAG conformance level based on issues
 */
export function determineConformanceLevel(issues: { tags: string[] }[]): WCAGLevel | null {
  const hasLevelA = issues.some(issue => 
    issue.tags.some(tag => tag.includes('wcag2a') && !tag.includes('wcag2aa'))
  );
  const hasLevelAA = issues.some(issue =>
    issue.tags.some(tag => tag.includes('wcag2aa') && !tag.includes('wcag2aaa'))
  );
  const hasLevelAAA = issues.some(issue =>
    issue.tags.some(tag => tag.includes('wcag2aaa'))
  );
  
  if (hasLevelA) return null; // Fails Level A
  if (hasLevelAA) return 'A'; // Passes A, fails AA
  if (hasLevelAAA) return 'AA'; // Passes AA, fails AAA
  return 'AAA'; // Passes all levels
}

/**
 * Extract WCAG success criteria from axe-core tags
 */
export function extractWCAGCriteria(tags: string[]): string[] {
  const wcagPattern = /wcag(\d+)(\d+)(\d+)/;
  return tags
    .map(tag => {
      const match = tag.match(wcagPattern);
      if (match) {
        const [, major, minor, patch] = match;
        return `${major}.${minor}.${patch}`;
      }
      return null;
    })
    .filter((criterion): criterion is string => criterion !== null);
}

/**
 * Format WCAG success criteria for display
 */
export function formatWCAGCriterion(criterion: string): string {
  const description = getWCAGDescription(criterion);
  const level = getWCAGLevel(criterion);
  
  if (description && level) {
    return `${criterion} ${description} (Level ${level})`;
  }
  return criterion;
}

/**
 * Get WCAG compliance percentage
 */
export function calculateWCAGCompliance(
  totalRules: number,
  failedRules: number,
  level: WCAGLevel = 'AA'
): number {
  if (totalRules === 0) return 100;
  
  const passedRules = totalRules - failedRules;
  return Math.round((passedRules / totalRules) * 100);
}

/**
 * Generate WCAG compliance report summary
 */
export function generateComplianceSummary(issues: { tags: string[]; impact: string }[]) {
  const wcagIssues = issues.filter(issue =>
    issue.tags.some(tag => tag.includes('wcag'))
  );
  
  const levelCounts = {
    A: 0,
    AA: 0,
    AAA: 0,
  };
  
  wcagIssues.forEach(issue => {
    const criteria = extractWCAGCriteria(issue.tags);
    criteria.forEach(criterion => {
      const level = getWCAGLevel(criterion);
      if (level) {
        levelCounts[level]++;
      }
    });
  });
  
  const conformanceLevel = determineConformanceLevel(wcagIssues);
  
  return {
    conformanceLevel,
    levelCounts,
    totalWCAGIssues: wcagIssues.length,
    criticalWCAGIssues: wcagIssues.filter(i => i.impact === 'critical').length,
    seriousWCAGIssues: wcagIssues.filter(i => i.impact === 'serious').length,
  };
}