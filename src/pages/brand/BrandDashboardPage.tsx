import { useBrandStatus } from '@/hooks/useBrandStatus';

const BrandDashboardPage = () => {
  // ... existing state declarations ...
  
  // Add the brand status hook to auto-fix issues
  const { statusChecked, fixApplied } = useBrandStatus();
  
  useEffect(() => {
    if (fixApplied) {
      console.log('🔄 Brand status fix applied, refreshing data...');
      // Re-fetch data after fixing brand status
      fetchData();
    }
  }, [fixApplied]);
} 