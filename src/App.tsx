import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FinPage } from './pages';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FinPage />
    </QueryClientProvider>
  );
}

export default App;