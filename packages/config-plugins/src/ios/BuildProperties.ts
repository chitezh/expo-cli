import type { ExpoConfig } from '@expo/config-types';

import type { ConfigPlugin } from '../Plugin.types';
import { withPodfileProperties } from '../plugins/ios-plugins';

export interface ConfigToPropertyItemType {
  propName: string;
  configFields: string[];
  defaultValue?: string;
}

export const CONFIG_TO_PROPERTIES: ConfigToPropertyItemType[] = [
  {
    propName: 'expo.jsEngine',
    configFields: ['ios.jsEngine', 'jsEngine'],
    defaultValue: 'jsc',
  },
  // {
  //   propName: 'expo.deploymentTarget',
  //   configFields: ['ios.deploymentTarget'],
  // },
  // {
  //   propName: 'expo.useFrameworks',
  //   configFields: ['ios.useFrameworks'],
  // },
];

export const withBuildPodfileProps: ConfigPlugin = config => {
  return withPodfileProperties(config, config => {
    config.modResults = setBuildProperties(config, config.modResults, CONFIG_TO_PROPERTIES);
    return config;
  });
};

export function setBuildProperties(
  config: Partial<ExpoConfig>,
  podfileProperties: Record<string, string>,
  configToProperties: ConfigToPropertyItemType[]
) {
  for (const configToProperty of configToProperties) {
    const value =
      findFirstMatchedField(config, configToProperty.configFields) ?? configToProperty.defaultValue;
    if (value) {
      podfileProperties[configToProperty.propName] = value;
    } else {
      delete podfileProperties[configToProperty.propName];
    }
  }
  return podfileProperties;
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
