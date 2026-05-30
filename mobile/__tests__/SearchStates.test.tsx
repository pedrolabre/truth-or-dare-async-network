import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import SearchErrorState from '../components/search/SearchErrorState';
import SearchContentResultCard from '../components/search/SearchContentResultCard';
import SearchFilterPills from '../components/search/SearchFilterPills';
import SearchLoadMore from '../components/search/SearchLoadMore';
import SearchSkeleton from '../components/search/SearchSkeleton';
import { LIGHT_SEARCH_COLORS } from '../constants/searchTheme';
import type { SearchContentItem } from '../types/search';

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

  it('renderiza aba de conteudo somente quando habilitada', () => {
    const onSelect = jest.fn();
    const hidden = render(
      <SearchFilterPills
        activeFilter="all"
        onSelect={onSelect}
        colors={LIGHT_SEARCH_COLORS}
      />,
    );

    expect(hidden.queryByText('Conteudo')).toBeNull();

    const visible = render(
      <SearchFilterPills
        activeFilter="content"
        onSelect={onSelect}
        colors={LIGHT_SEARCH_COLORS}
        isContentEnabled
      />,
    );

    fireEvent.press(visible.getByText('Conteudo'));

    expect(visible.getByText('Conteudo')).toBeTruthy();
    expect(onSelect).toHaveBeenCalledWith('content');
  });

  it('renderiza card de conteudo com trecho e acao', () => {
    const onPress = jest.fn();
    const content: SearchContentItem = {
      id: 'truth:truth-1',
      sourceId: 'truth-1',
      sourceType: 'truth',
      contentType: 'truth',
      parentId: 'truth-1',
      clubId: null,
      title: 'Verdade encontrada',
      snippet: 'Trecho legivel da verdade encontrada na busca.',
      badgeLabel: 'Verdade',
      authorName: 'Marina',
      commentsCount: 2,
      likesCount: 1,
      createdAt: '2026-05-30T12:00:00.000Z',
      route: 'feed-comments',
    };
    const screen = render(
      <SearchContentResultCard
        content={content}
        colors={LIGHT_SEARCH_COLORS}
        onPress={onPress}
        onPressAction={onPress}
      />,
    );

    fireEvent.press(screen.getByLabelText(/Abrir Verdade/));

    expect(screen.getByText('Verdade encontrada')).toBeTruthy();
    expect(
      screen.getByText('Trecho legivel da verdade encontrada na busca.'),
    ).toBeTruthy();
    expect(onPress).toHaveBeenCalledWith(content);
  });
});
