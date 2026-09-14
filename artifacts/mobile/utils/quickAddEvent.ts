// Shared QuickAdd event system
// Allows the tab bar center button to trigger the QuickAdd modal in the Home screen

type QuickAddListener = (type?: 'EXPENSE' | 'INCOME' | 'TRANSFER') => void;

let listener: QuickAddListener | null = null;

export function registerQuickAddListener(fn: QuickAddListener) {
  listener = fn;
  return () => { listener = null; };
}

export function triggerQuickAdd(type: 'EXPENSE' | 'INCOME' | 'TRANSFER' = 'EXPENSE') {
  listener?.(type);
}
