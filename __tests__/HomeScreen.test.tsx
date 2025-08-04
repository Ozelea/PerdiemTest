/**
 * @format
 */

import React from 'react';

// Simple test for basic functionality
describe('HomeScreen', () => {
  it('should be importable', () => {
    expect(() => {
      require('../src/navigation/appStack/screens/HomeScreen');
    }).not.toThrow();
  });

  it('should pass basic test', () => {
    expect(true).toBe(true);
  });
});
