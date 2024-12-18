/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreStart, AppMountParameters } from 'opensearch-dashboards/public';
import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter as Router, Route } from 'react-router-dom';
import { SecurityAnalyticsContext } from './services';
import { DarkModeContext } from './components/DarkMode';
import Main from './pages/Main';
import { CoreServicesContext } from './components/core_services';
import './app.scss';
import { SecurityAnalyticsPluginStartDeps } from './plugin';
import { DataStore } from './store/DataStore';
import { LogType } from '../types';
import { MetricsContext } from './metrics/MetricsContext';
import { CHANNEL_TYPES } from './pages/CreateDetector/components/ConfigureAlerts/utils/constants';
import { DataSourceManagementPluginSetup } from '../../../src/plugins/data_source_management/public';
import { getPlugins, setIsNotificationPluginInstalled } from './utils/helpers';
import { OS_NOTIFICATION_PLUGIN } from './utils/constants';
import { dataSourceInfo } from './services/utils/constants';
import { History } from 'history';
import { getBrowserServices } from './services/utils/constants';

export function renderApp(
  coreStart: CoreStart,
  params: AppMountParameters,
  landingPage: string,
  depsStart: SecurityAnalyticsPluginStartDeps,
  dataSourceManagement?: DataSourceManagementPluginSetup
) {
  const isDarkMode = coreStart.uiSettings.get('theme:darkMode') || false;
  const services = getBrowserServices();
  const metrics = new MetricsContext(services.metricsService);

  DataStore.logTypes
    .getLogTypes()
    .then((logTypes: LogType[]) => {
      ReactDOM.render(
        <Router>
          <Route
            render={(props) => {
              const originalMethods = {
                push: props.history.push,
                replace: props.history.replace,
              };
              const wrapper = (method: 'push' | 'replace') => (
                ...args: Parameters<History['push']>
              ) => {
                if (typeof args[0] === 'string') {
                  const url = new URL(args[0], window.location.origin);
                  const searchParams = url.searchParams;
                  searchParams.set('dataSourceId', dataSourceInfo.activeDataSource.id);
                  originalMethods[method](
                    {
                      pathname: url.pathname,
                      search: searchParams.toString(),
                    },
                    ...args.slice(1)
                  );
                } else if (typeof args[0] === 'object') {
                  const searchParams = new URLSearchParams(args[0].search);
                  searchParams.set('dataSourceId', dataSourceInfo.activeDataSource.id);
                  originalMethods[method](
                    {
                      ...args[0],
                      search: searchParams.toString(),
                    },
                    ...args.slice(1)
                  );
                } else {
                  originalMethods[method](...args);
                }
              };

              props.history = {
                ...props.history,
                push: wrapper('push'),
                replace: wrapper('replace'),
              };

              return (
                <DarkModeContext.Provider value={isDarkMode}>
                  <SecurityAnalyticsContext.Provider value={{ services, metrics }}>
                    <CoreServicesContext.Provider value={coreStart}>
                      <Main
                        {...props}
                        services={services}
                        landingPage={landingPage}
                        multiDataSourceEnabled={!!depsStart.dataSource}
                        dataSourceManagement={dataSourceManagement}
                        setActionMenu={params.setHeaderActionMenu}
                      />
                    </CoreServicesContext.Provider>
                  </SecurityAnalyticsContext.Provider>
                </DarkModeContext.Provider>
              );
            }}
          />
        </Router>,
        params.element
      );

      services.notificationsService.getServerFeatures().then((response) => {
        if (response.ok) {
          CHANNEL_TYPES.splice(0, CHANNEL_TYPES.length, ...response.response);
        }
      });

      getPlugins(services.opensearchService).then((plugins): void => {
        setIsNotificationPluginInstalled(plugins.includes(OS_NOTIFICATION_PLUGIN));
      });
    })
    .catch((error) => {
      console.error(error.message ?? error);
    });

  return () => ReactDOM.unmountComponentAtNode(params.element);
}
