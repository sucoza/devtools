import { describe, it, expect } from 'vitest';
import {
  // Style exports
  COLORS,
  COLORS_DARK,
  COLORS_LIGHT,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  SHADOWS,
  Z_INDEX,
  COMPONENT_STYLES,
  ANIMATIONS,
  LAYOUT,
  getColors,
  getComponentStyles,
  mergeStyles,
  createSidebarResizer,
} from '../styles/plugin-styles';

describe('shared-components style exports', () => {
  it('exports color palettes', () => {
    expect(COLORS).toBeDefined();
    expect(COLORS_DARK).toBeDefined();
    expect(COLORS_LIGHT).toBeDefined();
    expect(COLORS.background).toBeDefined();
    expect(COLORS.text).toBeDefined();
    expect(COLORS.status).toBeDefined();
  });

  it('exports typography constants', () => {
    expect(TYPOGRAPHY).toBeDefined();
    expect(TYPOGRAPHY.fontFamily).toBeDefined();
    expect(TYPOGRAPHY.fontSize).toBeDefined();
    expect(TYPOGRAPHY.fontWeight).toBeDefined();
    expect(TYPOGRAPHY.lineHeight).toBeDefined();
  });

  it('exports spacing and layout constants', () => {
    expect(SPACING).toBeDefined();
    expect(RADIUS).toBeDefined();
    expect(SHADOWS).toBeDefined();
    expect(Z_INDEX).toBeDefined();
    expect(LAYOUT).toBeDefined();
    expect(ANIMATIONS).toBeDefined();
  });

  it('exports component styles', () => {
    expect(COMPONENT_STYLES).toBeDefined();
    expect(COMPONENT_STYLES.container).toBeDefined();
    expect(COMPONENT_STYLES.header).toBeDefined();
    expect(COMPONENT_STYLES.button).toBeDefined();
  });
});

describe('getColors', () => {
  it('returns dark colors by default', () => {
    const colors = getColors();
    expect(colors).toBe(COLORS_DARK);
  });

  it('returns dark colors for dark theme', () => {
    const colors = getColors('dark');
    expect(colors).toBe(COLORS_DARK);
  });

  it('returns light colors for light theme', () => {
    const colors = getColors('light');
    expect(colors).toBe(COLORS_LIGHT);
  });
});

describe('getComponentStyles', () => {
  it('returns theme-aware component styles', () => {
    const darkStyles = getComponentStyles('dark');
    const lightStyles = getComponentStyles('light');
    expect(darkStyles).toBeDefined();
    expect(lightStyles).toBeDefined();
    expect(darkStyles.container).toBeDefined();
    expect(lightStyles.container).toBeDefined();
  });
});

describe('mergeStyles', () => {
  it('merges multiple style objects', () => {
    const result = mergeStyles(
      { color: 'red', fontSize: '12px' },
      { background: 'blue', fontSize: '14px' }
    );
    expect(result.color).toBe('red');
    expect(result.background).toBe('blue');
    expect(result.fontSize).toBe('14px');
  });

  it('handles undefined values', () => {
    const result = mergeStyles({ color: 'red' }, undefined, { background: 'blue' });
    expect(result.color).toBe('red');
    expect(result.background).toBe('blue');
  });
});

describe('createSidebarResizer', () => {
  it('returns an object with onMouseDown handler', () => {
    const resizer = createSidebarResizer(250, () => {});
    expect(resizer).toBeDefined();
    expect(resizer.onMouseDown).toBeTypeOf('function');
  });
});
