import type { ExpoConfig } from '@expo/config-types';

import { CONFIG_TO_PROPERTIES, getConfigFieldValue, setBuildProperties } from '../BuildProperties';
import { parsePropertiesFile, PropertiesItem } from '../Properties';

describe('JsEngine', () => {
  const JS_ENGINE_PROP_KEY = 'expo.jsEngine';

  it('set the property from shared `jsEngine` config', () => {
    const config: Partial<ExpoConfig> = { jsEngine: 'hermes' };
    const gradleProperties = parsePropertiesFile(`
android.useAndroidX=true
android.enableJetifier=true
`);

    expect(setBuildProperties(config, gradleProperties, CONFIG_TO_PROPERTIES)).toContainEqual({
      type: 'property',
      key: JS_ENGINE_PROP_KEY,
      value: 'hermes',
    });
  });

  it('set the property from platform `jsEngine` override config', () => {
    const config: Partial<ExpoConfig> = { jsEngine: 'hermes', android: { jsEngine: 'jsc' } };
    const gradleProperties = parsePropertiesFile(`
android.useAndroidX=true
android.enableJetifier=true
`);

    expect(setBuildProperties(config, gradleProperties, CONFIG_TO_PROPERTIES)).toContainEqual({
      type: 'property',
      key: JS_ENGINE_PROP_KEY,
      value: 'jsc',
    });
  });

  it('set the property if no property is existed', () => {
    const config: Partial<ExpoConfig> = { android: { jsEngine: 'hermes' } };
    const gradleProperties = parsePropertiesFile(`
android.useAndroidX=true
android.enableJetifier=true
`);

    expect(setBuildProperties(config, gradleProperties, CONFIG_TO_PROPERTIES)).toContainEqual({
      type: 'property',
      key: JS_ENGINE_PROP_KEY,
      value: 'hermes',
    });
  });

  it('overwrite the property if an old property is existed', () => {
    const config: Partial<ExpoConfig> = { android: { jsEngine: 'hermes' } };
    const gradleProperties = parsePropertiesFile(`
android.useAndroidX=true
android.enableJetifier=true
expo.jsEngine=jsc
`);

    expect(setBuildProperties(config, gradleProperties, CONFIG_TO_PROPERTIES)).toContainEqual({
      type: 'property',
      key: JS_ENGINE_PROP_KEY,
      value: 'hermes',
    });
  });
});

describe(setBuildProperties, () => {
  it('should respect `configFields` order', () => {
    const gradleProperties = [];
    const configToProperties = [
      {
        propName: 'expo.jsEngine',
        configFields: ['ios.jsEngine', 'jsEngine'],
      },
    ];

    expect(
      setBuildProperties(
        { jsEngine: 'hermes', ios: { jsEngine: 'jsc' } },
        gradleProperties,
        configToProperties
      )
    ).toContainEqual({
      type: 'property',
      key: 'expo.jsEngine',
      value: 'jsc',
    });

    expect(
      setBuildProperties(
        { jsEngine: 'jsc', ios: { jsEngine: 'hermes' } },
        gradleProperties,
        configToProperties
      )
    ).toContainEqual({
      type: 'property',
      key: 'expo.jsEngine',
      value: 'hermes',
    });
  });

  it('should merge properties', () => {
    const config: Partial<ExpoConfig> = { name: 'newName' };
    const gradleProperties: PropertiesItem[] = [
      { type: 'property', key: 'foo', value: 'foo' },
      { type: 'property', key: 'bar', value: 'bar' },
      { type: 'property', key: 'name', value: 'oldName' },
    ];
    const configToProperties = [
      {
        propName: 'name',
        configFields: ['name'],
      },
    ];

    expect(setBuildProperties(config, gradleProperties, configToProperties)).toEqual([
      { type: 'property', key: 'foo', value: 'foo' },
      { type: 'property', key: 'bar', value: 'bar' },
      { type: 'property', key: 'name', value: 'newName' },
    ]);
  });

  it('should delete property when no matched value from config', () => {
    const gradleProperties: PropertiesItem[] = [
      { type: 'property', key: 'foo', value: 'foo' },
      { type: 'property', key: 'propToDelete', value: 'propToDelete' },
    ];
    const configToProperties = [
      {
        propName: 'propToDelete',
        configFields: ['notfound'],
      },
    ];
    expect(setBuildProperties({}, gradleProperties, configToProperties)).toEqual([
      { type: 'property', key: 'foo', value: 'foo' },
    ]);
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
