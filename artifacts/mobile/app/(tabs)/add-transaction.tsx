// Placeholder route for the center Add button in the tab bar.
// QuickAdd modal is triggered from the Home screen.
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function AddTransactionPlaceholder() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/');
  }, []);
  return null;
}
