import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import ClubAuditLogPanel from '../components/clubs/ClubAuditLogPanel';
import { LIGHT_CLUBS_COLORS } from '../constants/clubsTheme';
import type {
  ClubAuditLogItem,
  ClubAuditLogScreenState,
} from '../types/clubs';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    MaterialIcons: ({ name }: { name: string }) =>
      React.createElement(Text, null, name),
  };
});

function makeAuditItem(
  overrides: Partial<ClubAuditLogItem> = {},
): ClubAuditLogItem {
  return {
    id: 'audit-1',
    action: 'club_member_role_updated',
    actionLabel: 'Papel alterado',
    actorId: 'owner-1',
    actorLabel: 'Ator owner-1',
    targetUserId: 'member-1',
    targetLabel: 'Alvo member-1',
    entityType: 'club_member',
    entityId: 'membership-1',
    entityLabel: 'Membro membership-1',
    createdAt: '2026-06-06T12:00:00.000Z',
    createdAtLabel: '06/06/2026 12:00',
    metadataEntries: [
      { label: 'Papel anterior', value: 'member' },
      { label: 'Novo papel', value: 'admin' },
    ],
    ...overrides,
  };
}

function makeAuditState(
  overrides: Partial<ClubAuditLogScreenState> = {},
): ClubAuditLogScreenState {
  return {
    items: [makeAuditItem()],
    filters: {
      action: null,
      targetUserId: null,
      entityType: null,
      from: null,
      to: null,
    },
    contentState: 'ready',
    nextCursor: null,
    isInitialLoading: false,
    isRefreshing: false,
    isLoadingMore: false,
    errorMessage: null,
    canRetry: true,
    canLoadMore: false,
    setActionFilter: jest.fn(),
    setTargetUserIdFilter: jest.fn(),
    setEntityTypeFilter: jest.fn(),
    setFromFilter: jest.fn(),
    setToFilter: jest.fn(),
    clearFilters: jest.fn(),
    handleRetry: jest.fn().mockResolvedValue(undefined),
    handleRefresh: jest.fn().mockResolvedValue(undefined),
    handleLoadMore: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('ClubAuditLogPanel', () => {
  it('renderiza loading com skeleton', () => {
    const screen = render(
      <ClubAuditLogPanel
        colors={LIGHT_CLUBS_COLORS}
        auditLog={makeAuditState({
          items: [],
          contentState: 'loading',
          isInitialLoading: true,
        })}
      />,
    );

    expect(screen.getByTestId('club-audit-loading')).toBeTruthy();
    expect(screen.getByText('Carregando auditoria')).toBeTruthy();
  });

  it('renderiza acesso negado sem controles de auditoria', () => {
    const screen = render(
      <ClubAuditLogPanel
        colors={LIGHT_CLUBS_COLORS}
        auditLog={makeAuditState({
          items: [],
          contentState: 'access-denied',
        })}
      />,
    );

    expect(screen.getByTestId('club-audit-access-denied')).toBeTruthy();
    expect(screen.getByText('Auditoria indisponivel')).toBeTruthy();
    expect(screen.queryByTestId('club-audit-filters')).toBeNull();
  });

  it('renderiza erro e chama retry', () => {
    const handleRetry = jest.fn().mockResolvedValue(undefined);
    const screen = render(
      <ClubAuditLogPanel
        colors={LIGHT_CLUBS_COLORS}
        auditLog={makeAuditState({
          items: [],
          contentState: 'error',
          errorMessage: 'Falha de rede',
          handleRetry,
        })}
      />,
    );

    fireEvent.press(screen.getByText('Tentar novamente'));

    expect(screen.getByText('Falha de rede')).toBeTruthy();
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('renderiza vazio e limpa filtros', () => {
    const clearFilters = jest.fn();
    const screen = render(
      <ClubAuditLogPanel
        colors={LIGHT_CLUBS_COLORS}
        auditLog={makeAuditState({
          items: [],
          contentState: 'empty',
          clearFilters,
        })}
      />,
    );

    fireEvent.press(screen.getByText('Limpar filtros'));

    expect(screen.getByTestId('club-audit-empty')).toBeTruthy();
    expect(clearFilters).toHaveBeenCalledTimes(1);
  });

  it('renderiza filtros, itens, metadata legivel e refresh', () => {
    const handleRefresh = jest.fn().mockResolvedValue(undefined);
    const setActionFilter = jest.fn();
    const setEntityTypeFilter = jest.fn();
    const setTargetUserIdFilter = jest.fn();
    const setFromFilter = jest.fn();
    const setToFilter = jest.fn();
    const screen = render(
      <ClubAuditLogPanel
        colors={LIGHT_CLUBS_COLORS}
        auditLog={makeAuditState({
          handleRefresh,
          setActionFilter,
          setEntityTypeFilter,
          setTargetUserIdFilter,
          setFromFilter,
          setToFilter,
          items: [
            makeAuditItem({
              metadataEntries: [
                { label: 'Papel anterior', value: 'member' },
                { label: 'Novo papel', value: 'admin' },
              ],
            }),
          ],
        })}
      />,
    );

    fireEvent.changeText(
      screen.getByLabelText('Filtrar auditoria por acao'),
      'club_member_role_updated',
    );
    fireEvent.changeText(
      screen.getByLabelText('Filtrar auditoria por tipo de entidade'),
      'club_member',
    );
    fireEvent.changeText(
      screen.getByLabelText('Filtrar auditoria por usuario alvo'),
      'member-1',
    );
    fireEvent.changeText(
      screen.getByLabelText('Filtrar auditoria a partir de data ISO'),
      '2026-06-01T00:00:00.000Z',
    );
    fireEvent.changeText(
      screen.getByLabelText('Filtrar auditoria ate data ISO'),
      '2026-06-06T23:59:59.000Z',
    );
    fireEvent.press(screen.getByLabelText('Atualizar auditoria do clube'));

    expect(screen.getByText('Auditoria do clube')).toBeTruthy();
    expect(screen.getByText('Papel alterado')).toBeTruthy();
    expect(screen.getByText('Papel anterior')).toBeTruthy();
    expect(screen.getByText('member')).toBeTruthy();
    expect(screen.queryByText('passwordHash')).toBeNull();
    expect(setActionFilter).toHaveBeenCalledWith('club_member_role_updated');
    expect(setEntityTypeFilter).toHaveBeenCalledWith('club_member');
    expect(setTargetUserIdFilter).toHaveBeenCalledWith('member-1');
    expect(setFromFilter).toHaveBeenCalledWith('2026-06-01T00:00:00.000Z');
    expect(setToFilter).toHaveBeenCalledWith('2026-06-06T23:59:59.000Z');
    expect(handleRefresh).toHaveBeenCalledTimes(1);
  });

  it('carrega mais quando existe cursor', () => {
    const handleLoadMore = jest.fn().mockResolvedValue(undefined);
    const screen = render(
      <ClubAuditLogPanel
        colors={LIGHT_CLUBS_COLORS}
        auditLog={makeAuditState({
          canLoadMore: true,
          nextCursor: 'audit-1',
          handleLoadMore,
        })}
      />,
    );

    fireEvent.press(screen.getByLabelText('Carregar mais eventos de auditoria'));

    expect(handleLoadMore).toHaveBeenCalledTimes(1);
  });
});
