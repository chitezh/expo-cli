import type { ExpoConfig } from '@expo/config-types';

import { CONFIG_TO_PROPERTIES, getConfigFieldValue, setBuildProperties } from '../BuildProperties';

describe('JsEngine', () => {
  const JS_ENGINE_PROP_KEY = 'expo.jsEngine';

  it('set the property from shared `jsEngine` config', () => {
    const config: Partial<ExpoConfig> = { jsEngine: 'hermes' };
    const podfileProperties = {};

    expect(setBuildProperties(config, podfileProperties, CONFIG_TO_PROPERTIES)).toMatchObject({
      [JS_ENGINE_PROP_KEY]: 'hermes',
    });
  });

  it('set the property from platform `jsEngine` override config', () => {
    const config: Partial<ExpoConfig> = { jsEngine: 'hermes', ios: { jsEngine: 'jsc' } };
    const podfileProperties = {};

    expect(setBuildProperties(config, podfileProperties, CONFIG_TO_PROPERTIES)).toMatchObject({
      [JS_ENGINE_PROP_KEY]: 'jsc',
    });
  });

  it('overwrite the property if an old property is existed', () => {
    const config: Partial<ExpoConfig> = { jsEngine: 'hermes' };
    const podfileProperties = { [JS_ENGINE_PROP_KEY]: 'jsc' };

    expect(setBuildProperties(config, podfileProperties, CONFIG_TO_PROPERTIES)).toMatchObject({
      [JS_ENGINE_PROP_KEY]: 'hermes',
    });
  });
});

describe(setBuildProperties, () => {
  it('should respect `configFields` order', () => {
    const podfileProperties = {};
    const configToProperties = [
      {
        propName: 'expo.jsEngine',
        configFields: ['ios.jsEngine', 'jsEngine'],
      },
    ];

    expect(
      setBuildProperties(
        { jsEngine: 'hermes', ios: { jsEngine: 'jsc' } },
        podfileProperties,
        configToProperties
      )
    ).toMatchObject({
      'expo.jsEngine': 'jsc',
    });

    expect(
      setBuildProperties(
        { jsEngine: 'jsc', ios: { jsEngine: 'hermes' } },
        podfileProperties,
        configToProperties
      )
    ).toMatchObject({
      'expo.jsEngine': 'hermes',
    });
  });

  it('should merge properties', () => {
    const config: Partial<ExpoConfig> = { name: 'newName' };
    const podfileProperties = {
      foo: 'foo',
      bar: 'bar',
      name: 'oldName',
    };
    const configToProperties = [
      {
        propName: 'name',
        configFields: ['name'],
      },
    ];

    expect(setBuildProperties(config, podfileProperties, configToProperties)).toEqual({
      foo: 'foo',
      bar: 'bar',
      name: 'newName',
    });
  });

  it('should delete property when no matched value from config', () => {
    const podfileProperties = {
      foo: 'foo',
      propToDelete: 'propToDelete',
    };
    const configToProperties = [
      {
        propName: 'propToDelete',
        configFields: ['notfound'],
      },
    ];
    expect(setBuildProperties({}, podfileProperties, configToProperties)).toEqual({ foo: 'foo' });
  });
});

describe(getConfigFieldValue, () => {
  it('should return string value', () => {
    expect(getConfigFieldValue({ name: 'hello' }, 'name')).toBe('hello');
  });

  it('should throw error when result value is not string', () => {
    expect(() =>
      getConfigFieldValue({ ios: { bundleIdentifier: 'com.example' } }, 'ios')
    ).toThrowError();
  });

  it('should access nested object through dot notation', () => {
    expect(
      getConfigFieldValue({ ios: { bundleIdentifier: 'com.example' } }, 'ios.bundleIdentifier')
    ).toBe('com.example');
  });

  it('should return null when field not found', () => {
    expect(getConfigFieldValue({ name: 'hello' }, 'notfound')).toBeNull();
    expect(
      getConfigFieldValue({ ios: { bundleIdentifier: 'com.example' } }, 'ios.notfound')
    ).toBeNull();
  });
});
