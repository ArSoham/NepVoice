import { router } from 'expo-router';
import { useApp } from '@/context/AppContext';

interface GoToResultInput {
  id: string;
  summary: string;
  audioUrl: string | null;
  docType: string;
  color: string;
  emoji: string;
}

export function useScanFlow() {
  const { addScan } = useApp();

  const goToResult = (input: GoToResultInput) => {
    addScan(input);
    router.push({ pathname: '/result', params: { id: input.id } });
  };

  return { goToResult };
}
