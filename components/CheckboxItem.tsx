
import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { IconSymbol } from './IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';

interface CheckboxItemProps {
  label: string;
  checked: boolean;
  onPress: () => void;
}

export function CheckboxItem({ label, checked, onPress }: CheckboxItemProps) {
  return (
    <TouchableOpacity style={commonStyles.checkboxContainer} onPress={onPress}>
      <View style={[commonStyles.checkbox, checked && commonStyles.checkboxChecked]}>
        {checked && (
          <IconSymbol
            ios_icon_name="checkmark"
            android_material_icon_name="check"
            size={16}
            color={colors.card}
          />
        )}
      </View>
      <Text style={commonStyles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );
}
