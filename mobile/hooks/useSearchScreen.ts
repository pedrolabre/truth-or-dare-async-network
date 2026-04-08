import { useMemo, useState } from 'react';
import type {
  SearchFilterKey,
  SearchResultGroup,
} from '../types/search';

type UseSearchScreenReturn = {
  query: string;
  activeFilter: SearchFilterKey;
  results: SearchResultGroup;
  isLoading: boolean;
  isInitialState: boolean;
  isEmptyResult: boolean;
  hasAnyResults: boolean;
  setQuery: (value: string) => void;
  setActiveFilter: (value: SearchFilterKey) => void;
};

export function useSearchScreen(): UseSearchScreenReturn {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<SearchFilterKey>('all');

  const trimmedQuery = query.trim();

  const baseResults = useMemo<SearchResultGroup>(() => {
    return {
      users: [],
      clubs: [],
    };
  }, [trimmedQuery]);

  const results = useMemo<SearchResultGroup>(() => {
    if (activeFilter === 'users') {
      return {
        users: baseResults.users,
        clubs: [],
      };
    }

    if (activeFilter === 'clubs') {
      return {
        users: [],
        clubs: baseResults.clubs,
      };
    }

    return baseResults;
  }, [activeFilter, baseResults]);

  const isInitialState = trimmedQuery.length === 0;
  const hasAnyResults = results.users.length > 0 || results.clubs.length > 0;
  const isEmptyResult = !isInitialState && !hasAnyResults;

  return {
    query,
    activeFilter,
    results,
    isLoading: false,
    isInitialState,
    isEmptyResult,
    hasAnyResults,
    setQuery,
    setActiveFilter,
  };
}