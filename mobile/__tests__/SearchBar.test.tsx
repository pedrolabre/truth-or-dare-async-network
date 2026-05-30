import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import SearchBar from '../components/search/SearchBar';
import { LIGHT_SEARCH_COLORS } from '../constants/searchTheme';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    MaterialIcons: ({ name }: { name: string }) =>
      React.createElement(Text, null, name),
  };
});

describe('SearchBar', () => {
  it('renderiza sem botao de limpar quando o campo esta vazio', () => {
    const onChangeText = jest.fn();
    const onClear = jest.fn();
    const onPressFilter = jest.fn();

    const screen = render(
      <SearchBar
        value=""
        onChangeText={onChangeText}
        colors={LIGHT_SEARCH_COLORS}
        onClear={onClear}
        onPressFilter={onPressFilter}
      />,
    );

    expect(screen.getByLabelText('Campo de busca')).toBeTruthy();
    expect(screen.queryByLabelText('Limpar campo de busca')).toBeNull();

    fireEvent.changeText(screen.getByLabelText('Campo de busca'), 'Marina');
    fireEvent.press(screen.getByLabelText('Abrir filtros de busca'));

    expect(onChangeText).toHaveBeenCalledWith('Marina');
    expect(onPressFilter).toHaveBeenCalledTimes(1);
    expect(onClear).not.toHaveBeenCalled();
  });

  it('renderiza botao de limpar quando ha valor e chama onClear', () => {
    const onChangeText = jest.fn();
    const onClear = jest.fn();

    const screen = render(
      <SearchBar
        value="clube"
        onChangeText={onChangeText}
        colors={LIGHT_SEARCH_COLORS}
        onClear={onClear}
      />,
    );

    fireEvent.press(screen.getByLabelText('Limpar campo de busca'));

    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
