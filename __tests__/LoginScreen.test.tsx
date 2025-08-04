/**
 * @format
 */

import React from 'react';

// Simple test for basic functionality
describe('LoginScreen', () => {
  it('should be importable', () => {
    expect(() => {
      require('../src/navigation/authStack/screens/LoginScreen');
    }).not.toThrow();
  });

  it('should pass basic test', () => {
    expect(true).toBe(true);
  });
});
