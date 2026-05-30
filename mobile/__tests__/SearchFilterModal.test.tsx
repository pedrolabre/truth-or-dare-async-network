import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import SearchFilterModal from '../components/search/SearchFilterModal';
import { LIGHT_SEARCH_COLORS } from '../constants/searchTheme';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    MaterialIcons: ({ name }: { name: string }) =>
      React.createElement(Text, null, name),
  };
});

describe('SearchFilterModal', () => {
  it('aplica filtros avancados selecionados', () => {
    const onApply = jest.fn();
    const onClear = jest.fn();
    const onClose = jest.fn();
    const screen = render(
      <SearchFilterModal
        visible
        filters={{}}
        colors={LIGHT_SEARCH_COLORS}
        onApply={onApply}
        onClear={onClear}
        onClose={onClose}
      />,
    );

    fireEvent.changeText(screen.getByLabelText('Nivel minimo de usuario'), '2');
    fireEvent.changeText(screen.getByLabelText('Nivel maximo de usuario'), '8');
    fireEvent.press(screen.getByLabelText('Apenas usuarios online'));
    fireEvent.press(screen.getByLabelText('Apenas clubes publicos'));
    fireEvent.changeText(
      screen.getByLabelText('Tag ou categoria de clube'),
      'noite',
    );
    fireEvent.press(screen.getByLabelText('Aplicar filtros'));

    expect(onApply).toHaveBeenCalledWith({
      minLevel: 2,
      maxLevel: 8,
      onlineOnly: true,
      clubVisibility: 'public',
      clubTag: 'noite',
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClear).not.toHaveBeenCalled();
  });

  it('limpa filtros pelo modal sem fechar obrigatoriamente', () => {
    const onApply = jest.fn();
    const onClear = jest.fn();
    const onClose = jest.fn();
    const screen = render(
      <SearchFilterModal
        visible
        filters={{
          minLevel: 3,
          maxLevel: 7,
          onlineOnly: true,
          clubVisibility: 'public',
          clubTag: 'desafio',
        }}
        colors={LIGHT_SEARCH_COLORS}
        onApply={onApply}
        onClear={onClear}
        onClose={onClose}
      />,
    );

    fireEvent.press(screen.getByLabelText('Limpar filtros'));
    fireEvent.press(screen.getByLabelText('Aplicar filtros'));

    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onApply).toHaveBeenCalledWith({
      minLevel: null,
      maxLevel: null,
      onlineOnly: false,
      clubVisibility: undefined,
      clubTag: null,
    });
  });
});
