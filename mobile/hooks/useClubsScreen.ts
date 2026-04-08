import { useState } from 'react';
import type { ClubsTabKey } from '../types/clubs';

export function useClubsScreen() {
  const [activeTab, setActiveTab] = useState<ClubsTabKey>('my-clubs');
  const [query, setQuery] = useState('');

  function handleChangeTab(tab: ClubsTabKey) {
    setActiveTab(tab);
  }

  return {
    activeTab,
    query,
    isLoading: false,
    isDiscoverEmpty: true,
    isMyClubsEmpty: true,
    setQuery,
    handleChangeTab,
  };
}