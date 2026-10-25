export type CategorySegmentData = {
  name: string;
  amount: number;
  budget: number;
  percentageOfTotal: number;
  percentageOfBudget: number;
  color: string;
  icon?: string;
  transactionCount?: number;
};

export interface RingSegment extends CategorySegmentData {
  index: number;
  startAngle: number;
  endAngle: number;
  midAngle: number;
  degSpan: number;
  pathD: string;
  badgeX: number;
  badgeY: number;
  isSelected: boolean;
  pctOfBudget: number;
  isOverBudget: boolean;
}

/**
 * Calculates non-overlapping circular segments for the category budget ring.
 *
 * Guaranteed Properties:
 * 1. Each category arc is capped at 100% of its budget limit for spatial allocation.
 * 2. Sum of all segment angles + gaps strictly equals 360 degrees: NO OVERLAP POSSIBLE.
 * 3. Each category reports its true percentage (e.g. 135%, 155%) and over-limit status.
 */
export function calculateRingSegments(
  displayCategories: CategorySegmentData[],
  size: number = 280,
  strokeWidth: number = 24,
  selectedCategoryName: string | null = null,
): RingSegment[] {
  const count = displayCategories.length;
  if (count === 0) return [];

  const center = size / 2;
  const radiusVal = (size - strokeWidth - 40) / 2;
  const badgeSize = 28;

  // Single category case: occupies full ring without gap
  if (count === 1) {
    const cat = displayCategories[0];
    const midAngle = 0;
    const midRad = (midAngle * Math.PI) / 180;
    const badgeDistance = radiusVal + strokeWidth / 2 + 10;
    const badgeX = center + badgeDistance * Math.cos(midRad) - badgeSize / 2;
    const badgeY = center + badgeDistance * Math.sin(midRad) - badgeSize / 2;
    const isSelected = selectedCategoryName === cat.name;

    // Full circle path using two complementary 180-degree arcs
    const pathD = `M ${center} ${center - radiusVal} A ${radiusVal} ${radiusVal} 0 1 1 ${center} ${
      center + radiusVal
    } A ${radiusVal} ${radiusVal} 0 1 1 ${center} ${center - radiusVal}`;

    const pctOfBudget =
      cat.budget > 0 ? Math.round((cat.amount / cat.budget) * 100) : 0;
    const isOverBudget = cat.budget > 0 && cat.amount > cat.budget;

    return [
      {
        ...cat,
        index: 0,
        startAngle: -90,
        endAngle: 270,
        midAngle,
        degSpan: 360,
        pathD,
        badgeX,
        badgeY,
        isSelected,
        pctOfBudget,
        isOverBudget,
      },
    ];
  }

  // Multi-category layout with dynamic, clean gaps
  const gapDeg = count <= 3 ? 12 : count <= 5 ? 10 : 8;
  const totalGapDeg = count * gapDeg;
  const availableDeg = 360 - totalGapDeg;

  // Weight allocation:
  // Cap visual slice weight at 100% of category budget limit so an over-budget
  // category (e.g. 155% or 135%) never inflates beyond its allocation and crowds out others.
  const weights = displayCategories.map((c) => {
    const effectiveAmount =
      c.budget > 0 ? Math.min(c.amount, c.budget) : c.amount;
    return effectiveAmount > 0 ? effectiveAmount : 0.001;
  });

  const totalWeight = weights.reduce((acc, w) => acc + w, 0) || 1;

  // Minimum degree reservation per segment so icons and badges have comfortable breathing room
  const minDeg = Math.min(22, Math.floor(availableDeg / (count * 1.6)));
  const totalMinDeg = count * minDeg;
  const flexibleDeg = Math.max(0, availableDeg - totalMinDeg);

  // Each segment's degree span: minDeg + proportional share of flexibleDeg.
  // SUM OF ALL degSpans STRICTLY EQUALS availableDeg!
  const degSpans = weights.map(
    (w) => minDeg + (w / totalWeight) * flexibleDeg,
  );

  let currentAngle = -90; // Start at 12 o'clock

  return displayCategories.map((cat, idx) => {
    const degSpan = degSpans[idx];
    const startAngle = currentAngle;
    const endAngle = currentAngle + degSpan;
    const midAngle = (startAngle + endAngle) / 2;

    // Advance angle for next segment + gap
    currentAngle = endAngle + gapDeg;

    // Convert angles to radians for SVG path
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const midRad = (midAngle * Math.PI) / 180;

    const x1 = center + radiusVal * Math.cos(startRad);
    const y1 = center + radiusVal * Math.sin(startRad);
    const x2 = center + radiusVal * Math.cos(endRad);
    const y2 = center + radiusVal * Math.sin(endRad);

    const largeArc = degSpan > 180 ? 1 : 0;
    const pathD = `M ${x1} ${y1} A ${radiusVal} ${radiusVal} 0 ${largeArc} 1 ${x2} ${y2}`;

    // Floating Badge Coordinates
    const badgeDistance = radiusVal + strokeWidth / 2 + 10;
    const badgeX = center + badgeDistance * Math.cos(midRad) - badgeSize / 2;
    const badgeY = center + badgeDistance * Math.sin(midRad) - badgeSize / 2;

    const isSelected = selectedCategoryName === cat.name;
    const pctOfBudget =
      cat.budget > 0 ? Math.round((cat.amount / cat.budget) * 100) : 0;
    const isOverBudget = cat.budget > 0 && cat.amount > cat.budget;

    return {
      ...cat,
      index: idx,
      startAngle,
      endAngle,
      midAngle,
      degSpan,
      pathD,
      badgeX,
      badgeY,
      isSelected,
      pctOfBudget,
      isOverBudget,
    };
  });
}

