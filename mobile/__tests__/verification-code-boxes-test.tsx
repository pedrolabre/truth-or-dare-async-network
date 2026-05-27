import React from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import VerificationCodeBoxes from '../components/auth-recovery/VerificationCodeBoxes';

const colors = {
  text: '#171d1a',
  border: '#bccac2',
  inputBackground: '#e4eae5',
  danger: '#D70015',
  successAccent: '#5A8363',
};

type ControlledProps = {
  initialValue?: string;
  hasError?: boolean;
  disabled?: boolean;
  onValueChange?: jest.Mock;
  onSubmitEditing?: jest.Mock;
};

function ControlledVerificationCodeBoxes({
  initialValue = '',
  hasError = false,
  disabled = false,
  onValueChange = jest.fn(),
  onSubmitEditing = jest.fn(),
}: ControlledProps) {
  const [value, setValue] = React.useState(initialValue);

  return (
    <>
      <VerificationCodeBoxes
        value={value}
        onChange={(nextValue) => {
          setValue(nextValue);
          onValueChange(nextValue);
        }}
        colors={colors}
        hasError={hasError}
        disabled={disabled}
        autoFocus
        onSubmitEditing={onSubmitEditing}
      />
      <Text testID="verification-code-value">{value}</Text>
    </>
  );
}

describe('VerificationCodeBoxes', () => {
  it('renderiza seis posicoes com labels acessiveis e testIDs estaveis', () => {
    const { getByLabelText, getByTestId, UNSAFE_getAllByType } = render(
      <ControlledVerificationCodeBoxes />,
    );

    expect(UNSAFE_getAllByType(TextInput)).toHaveLength(6);
    expect(getByLabelText('Digito 1 do codigo de recuperacao')).toBeTruthy();
    expect(getByLabelText('Digito 6 do codigo de recuperacao')).toBeTruthy();
    expect(getByTestId('verification-code-digit-1').props.autoFocus).toBe(true);
    expect(getByTestId('verification-code-digit-6').props.returnKeyType).toBe(
      'done',
    );
  });

  it('digita apenas numeros e preenche a posicao esperada', () => {
    const onValueChange = jest.fn();
    const { getByTestId } = render(
      <ControlledVerificationCodeBoxes onValueChange={onValueChange} />,
    );

    fireEvent.changeText(getByTestId('verification-code-digit-1'), '7');
    fireEvent.changeText(getByTestId('verification-code-digit-2'), 'a');
    fireEvent.changeText(getByTestId('verification-code-digit-2'), '8');

    expect(getByTestId('verification-code-value').props.children).toBe('78');
    expect(onValueChange).toHaveBeenLastCalledWith('78');
  });

  it('cola codigo completo usando somente digitos', () => {
    const { getByTestId, getAllByDisplayValue } = render(
      <ControlledVerificationCodeBoxes />,
    );

    fireEvent.changeText(
      getByTestId('verification-code-digit-1'),
      '12a34 56',
    );

    expect(getByTestId('verification-code-value').props.children).toBe(
      '123456',
    );
    expect(getAllByDisplayValue(/[1-6]/)).toHaveLength(6);
  });

  it('limpa o digito atual com backspace quando a posicao tem valor', () => {
    const { getByTestId } = render(
      <ControlledVerificationCodeBoxes initialValue="123456" />,
    );

    fireEvent(getByTestId('verification-code-digit-3'), 'keyPress', {
      nativeEvent: { key: 'Backspace' },
    });

    expect(getByTestId('verification-code-value').props.children).toBe('12456');
  });

  it('limpa o digito anterior com backspace quando a posicao atual esta vazia', () => {
    const { getByTestId } = render(
      <ControlledVerificationCodeBoxes initialValue="12" />,
    );

    fireEvent(getByTestId('verification-code-digit-3'), 'keyPress', {
      nativeEvent: { key: 'Backspace' },
    });

    expect(getByTestId('verification-code-value').props.children).toBe('1');
  });

  it('mostra estado visual de erro sem alterar o codigo digitado', () => {
    const { getByTestId } = render(
      <ControlledVerificationCodeBoxes initialValue="123456" hasError />,
    );
    const firstDigitStyle = StyleSheet.flatten(
      getByTestId('verification-code-digit-1').props.style,
    );

    expect(getByTestId('verification-code-value').props.children).toBe(
      '123456',
    );
    expect(firstDigitStyle.borderColor).toBe(colors.danger);
    expect(
      getByTestId('verification-code-digit-1').props.accessibilityHint,
    ).toBe('Codigo com erro');
  });

  it('desabilita as caixas durante loading sem perder labels acessiveis', () => {
    const { getByLabelText, getByTestId } = render(
      <ControlledVerificationCodeBoxes disabled />,
    );

    expect(getByLabelText('Digito 1 do codigo de recuperacao')).toBeTruthy();
    expect(getByTestId('verification-code-digit-1').props.editable).toBe(false);
    expect(
      getByTestId('verification-code-digit-1').props.accessibilityState
        .disabled,
    ).toBe(true);
  });
});
