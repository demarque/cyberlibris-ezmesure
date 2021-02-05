/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { schema, TypeOf } from '@kbn/config-schema';
import { PluginInitializerContext, PluginConfigDescriptor } from '../../../src/core/server';
import { EzreportingPlugin } from './plugin';
import { PLUGIN_APP_NAME } from '../common';

const configSchema = schema.object({
  applicationName: schema.string({
    defaultValue: process.env.EZMESURE_APPLICATION_NAME || PLUGIN_APP_NAME,
  }),
});

type ConfigType = TypeOf<typeof configSchema>;

export const config: PluginConfigDescriptor<ConfigType> = {
  exposeToBrowser: {
    applicationName: true,
  },
  schema: configSchema,
};

//  This exports static code and TypeScript types,
//  as well as, Kibana Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new EzreportingPlugin(initializerContext);
}

export { EzreportingPluginSetup, EzreportingPluginStart } from './types';
