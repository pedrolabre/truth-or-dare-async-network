import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import SearchErrorState from '../components/search/SearchErrorState';
import SearchLoadMore from '../components/search/SearchLoadMore';
import SearchSkeleton from '../components/search/SearchSkeleton';
import { LIGHT_SEARCH_COLORS } from '../constants/searchTheme';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    MaterialIcons: ({ name }: { name: string }) =>
      React.createElement(Text, null, name),
  };
});

describe('estados visuais da busca', () => {
  it('renderiza skeleton de loading inicial com acessibilidade', () => {
    const screen = render(<SearchSkeleton colors={LIGHT_SEARCH_COLORS} />);

    expect(screen.getByLabelText('Carregando resultados da busca')).toBeTruthy();
  });

  it('renderiza erro com retry conectado', () => {
    const onRetry = jest.fn();
    const screen = render(
      <SearchErrorState
        colors={LIGHT_SEARCH_COLORS}
        message="Busca indisponivel"
        onRetry={onRetry}
      />,
    );

    fireEvent.press(screen.getByLabelText('Tentar buscar novamente'));

    expect(screen.getByText('Nao foi possivel buscar agora')).toBeTruthy();
    expect(screen.getByText('Busca indisponivel')).toBeTruthy();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renderiza indicador de paginacao com label customizado', () => {
    const screen = render(
      <SearchLoadMore
        colors={LIGHT_SEARCH_COLORS}
        label="Carregando mais usuarios"
      />,
    );

    expect(screen.getByLabelText('Carregando mais usuarios')).toBeTruthy();
    expect(screen.getByText('Carregando mais usuarios')).toBeTruthy();
  });
});
