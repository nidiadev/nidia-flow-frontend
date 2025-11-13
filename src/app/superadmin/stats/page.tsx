'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StatsPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/superadmin/stats/overview');
  }, [router]);

  return null;
}

