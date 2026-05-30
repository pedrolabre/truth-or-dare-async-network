import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import SearchRecentSearches from '../components/search/SearchRecentSearches';
import { LIGHT_SEARCH_COLORS } from '../constants/searchTheme';
import type { SearchRecentItem } from '../types/search';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    MaterialIcons: ({ name }: { name: string }) =>
      React.createElement(Text, null, name),
  };
});

const recentItems: SearchRecentItem[] = [
  {
    id: 'user:user-1',
    label: 'Marina Busca',
    type: 'user',
    referenceId: 'user-1',
  },
  {
    id: 'club:club-1',
    label: 'Noite dos Desafios',
    type: 'club',
    referenceId: 'club-1',
  },
];

describe('SearchRecentSearches', () => {
  it('retorna vazio quando nao ha buscas recentes', () => {
    const screen = render(
      <SearchRecentSearches
        items={[]}
        colors={LIGHT_SEARCH_COLORS}
        onRemoveItem={jest.fn()}
        onClearAll={jest.fn()}
      />,
    );

    expect(screen.toJSON()).toBeNull();
  });

  it('aciona busca recente, remocao individual e limpeza total', () => {
    const onPressItem = jest.fn();
    const onRemoveItem = jest.fn();
    const onClearAll = jest.fn();

    const screen = render(
      <SearchRecentSearches
        items={recentItems}
        colors={LIGHT_SEARCH_COLORS}
        onPressItem={onPressItem}
        onRemoveItem={onRemoveItem}
        onClearAll={onClearAll}
      />,
    );

    fireEvent.press(screen.getByLabelText('Buscar novamente por Marina Busca'));
    fireEvent.press(
      screen.getByLabelText('Remover Marina Busca das buscas recentes'),
    );
    fireEvent.press(
      screen.getByLabelText('Limpar todas as buscas recentes'),
    );

    expect(onPressItem).toHaveBeenCalledWith(recentItems[0]);
    expect(onRemoveItem).toHaveBeenCalledWith('user:user-1');
    expect(onClearAll).toHaveBeenCalledTimes(1);
  });
});
