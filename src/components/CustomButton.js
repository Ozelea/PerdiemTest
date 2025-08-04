import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Colors from '../utils/Colors';

const CustomButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  style,
  ...props
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.button, style]}
      {...props}>
      <LinearGradient
        colors={Colors.gradients.primary}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.gradientContainer}>
        {loading ? (
          <ActivityIndicator color={Colors.white} size="small" />
        ) : (
          <Text style={styles.buttonText}>{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
  },
  gradientContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
});

export default CustomButton;
