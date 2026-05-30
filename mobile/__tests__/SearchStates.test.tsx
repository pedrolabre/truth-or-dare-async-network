import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import SearchErrorState from '../components/search/SearchErrorState';
import SearchClubResultCard from '../components/search/SearchClubResultCard';
import SearchContentResultCard from '../components/search/SearchContentResultCard';
import SearchFilterPills from '../components/search/SearchFilterPills';
import SearchLoadMore from '../components/search/SearchLoadMore';
import SearchSkeleton from '../components/search/SearchSkeleton';
import SearchUserResultCard from '../components/search/SearchUserResultCard';
import { LIGHT_SEARCH_COLORS } from '../constants/searchTheme';
import type {
  SearchClubItem,
  SearchContentItem,
  SearchUserItem,
} from '../types/search';

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

    fireEvent.press(screen.getByLabelText(/Conteudo Verdade/));

    expect(screen.getByText('Verdade encontrada')).toBeTruthy();
    expect(
      screen.getByText('Trecho legivel da verdade encontrada na busca.'),
    ).toBeTruthy();
    expect(onPress).toHaveBeenCalledWith(content);
  });

  it('anuncia resultados com nome, tipo e acao disponivel', () => {
    const user: SearchUserItem = {
      id: 'user-1',
      name: 'Usuario com nome muito longo para validar truncamento do card',
      username: 'usuario_com_username_extenso',
      level: 12,
      levelLabel: 'Nivel 12',
      isOnline: true,
      mutualCount: 3,
    };
    const club: SearchClubItem = {
      id: 'club-1',
      slug: 'clube-com-nome-longo',
      name: 'Clube com nome muito longo para validar truncamento do card',
      memberCount: 1200,
      memberCountLabel: '1.200 membros',
      description: 'Descricao longa do clube para validar quebra segura no layout.',
      iconName: 'groups',
      badgeLabel: 'Em alta',
      isTrending: true,
      tags: ['regressao'],
    };
    const content: SearchContentItem = {
      id: 'truth:truth-2',
      sourceId: 'truth-2',
      sourceType: 'truth',
      contentType: 'truth',
      parentId: 'truth-2',
      clubId: null,
      title: 'Conteudo com titulo longo para regressao',
      snippet: 'Trecho longo para validar o card de conteudo em leitores de tela.',
      badgeLabel: 'Verdade',
      authorName: 'Marina',
      commentsCount: 4,
      likesCount: 2,
      createdAt: '2026-05-30T12:00:00.000Z',
      route: 'feed-comments',
    };

    const screen = render(
      <>
        <SearchUserResultCard user={user} colors={LIGHT_SEARCH_COLORS} />
        <SearchClubResultCard club={club} colors={LIGHT_SEARCH_COLORS} />
        <SearchContentResultCard
          content={content}
          colors={LIGHT_SEARCH_COLORS}
        />
      </>,
    );

    expect(
      screen.getByLabelText(
        'Usuario Usuario com nome muito longo para validar truncamento do card. Abrir perfil disponivel.',
      ),
    ).toBeTruthy();
    expect(
      screen.getByLabelText(
        'Clube Clube com nome muito longo para validar truncamento do card. Abrir clube disponivel.',
      ),
    ).toBeTruthy();
    expect(
      screen.getByLabelText(
        'Conteudo Verdade: Conteudo com titulo longo para regressao. Abrir resultado disponivel.',
      ),
    ).toBeTruthy();
  });
});
