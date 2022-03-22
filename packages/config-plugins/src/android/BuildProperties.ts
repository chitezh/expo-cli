import type { ExpoConfig } from '@expo/config-types';

import type { ConfigPlugin } from '../Plugin.types';
import { withGradleProperties } from '../plugins/android-plugins';
import type { PropertiesItem } from './Properties';

export interface ConfigToPropertyItemType {
  propName: string;
  configFields: string[];
  defaultValue?: string;
}

export const CONFIG_TO_PROPERTIES: ConfigToPropertyItemType[] = [
  {
    propName: 'expo.jsEngine',
    configFields: ['android.jsEngine', 'jsEngine'],
    defaultValue: 'jsc',
  },
  // {
  //   propName: 'expo.compileSdkVersion',
  //   configFields: ['android.compileSdkVersion'],
  // },
  // {
  //   propName: 'expo.targetSdkVersion',
  //   configFields: ['android.targetSdkVersion'],
  // },
  // {
  //   propName: 'expo.kotlinVersion',
  //   configFields: ['android.kotlinVersion'],
  // },
  // {
  //   propName: 'expo.enableR8',
  //   configFields: ['android.enableR8'],
  // },
];

export const withBuildGradleProps: ConfigPlugin = config => {
  return withGradleProperties(config, config => {
    config.modResults = setBuildProperties(config, config.modResults, CONFIG_TO_PROPERTIES);
    return config;
  });
};

export function setBuildProperties(
  config: Partial<ExpoConfig>,
  gradleProperties: PropertiesItem[],
  configToProperties: ConfigToPropertyItemType[]
) {
  for (const configToProperty of configToProperties) {
    const value =
      findFirstMatchedField(config, configToProperty.configFields) ?? configToProperty.defaultValue;

    const oldPropIndex = gradleProperties.findIndex(
      prop => prop.type === 'property' && prop.key === configToProperty.propName
    );

    if (value) {
      // found match value, add or merge new property
      const newProp: PropertiesItem = {
        type: 'property',
        key: configToProperty.propName,
        value,
      };

      if (oldPropIndex >= 0) {
        gradleProperties[oldPropIndex] = newProp;
      } else {
        gradleProperties.push(newProp);
      }
    } else {
      // no matched value, to remove this property
      if (oldPropIndex >= 0) {
        gradleProperties.splice(oldPropIndex, 1);
      }
    }
  }

  return gradleProperties;
}

export function getConfigFieldValue(config: Partial<ExpoConfig>, field: string): string | null {
  const value = field.split('.').reduce((acc: Record<string, any>, key) => acc?.[key], config);
  if (value == null) {
    return null;
  }
  if (typeof value !== 'string') {
    throw new Error('The field value type is not string: ' + value);
  }
  return value;
}

function findFirstMatchedField(config: Partial<ExpoConfig>, fields: string[]): string | null {
  for (const field of fields) {
    const value = getConfigFieldValue(config, field);
    if (value) {
      return value;
    }
  }
  return null;
}
