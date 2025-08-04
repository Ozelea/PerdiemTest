import React from 'react';
import {TouchableOpacity, Text, StyleSheet, View} from 'react-native';
import Colors from '../utils/Colors';

const SocialButton = ({onPress, disabled = false}) => {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}>
      <View style={styles.content}>
        <Text style={styles.icon}>🔍</Text>
        <Text style={styles.text}>Continue with Google</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 56,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  disabled: {
    opacity: 0.6,
  },
});

export default SocialButton;
