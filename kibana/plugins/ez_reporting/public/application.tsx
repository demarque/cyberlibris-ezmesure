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

import React from 'react';
import ReactDOM from 'react-dom';
import { AppMountParameters, CoreStart, UnmountCallback } from '../../../src/core/public';
import { AppPluginStartDependencies } from './types';
import { EzReportingApp } from './components/app';

import {
  httpClient,
  setHttpClient,
  toasts,
  setToasts,
  capabilities,
  setCapabilities,
} from '../lib/reporting';

const renderApp = (
  { application, notifications, http }: CoreStart,
  { navigation }: AppPluginStartDependencies,
  { element }: AppMountParameters,
  applicationName: string,
  admin: boolean
): UnmountCallback => {
  if (!httpClient) {
    setHttpClient(http);
  }
  if (!toasts) {
    setToasts(notifications.toasts);
  }
  if (!capabilities) {
    setCapabilities(application.capabilities);
  }

  ReactDOM.render(
    <EzReportingApp
      basename={http.basePath.get()}
      navigation={navigation}
      applicationName={applicationName}
      admin={admin}
    />,
    element
  );

  return () => ReactDOM.unmountComponentAtNode(element);
};

export async function mountApp({
  coreStart,
  depsStart,
  params,
  applicationName,
  admin,
}: {
  coreStart: CoreStart,
  depsStart: AppPluginStartDependencies,
  params: AppMountParameters,
  applicationName: string,
  admin: boolean,
}): Promise<UnmountCallback> {
  return renderApp(coreStart, depsStart, params, applicationName, admin);
}
