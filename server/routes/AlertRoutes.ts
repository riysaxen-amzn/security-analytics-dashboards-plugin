/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IRouter } from 'opensearch-dashboards/server';
import { schema } from '@osd/config-schema';
import { NodeServices } from '../models/interfaces';
import { API } from '../utils/constants';
import { createQueryValidationSchema } from '../utils/helpers';

export function setupAlertsRoutes(services: NodeServices, router: IRouter) {
  const { alertService } = services;

  router.get(
    {
      path: API.GET_ALERTS,
      validate: {
        query: createQueryValidationSchema({
          detectorType: schema.maybe(schema.string()),
          detector_id: schema.maybe(schema.string()),
          sortOrder: schema.maybe(schema.string()),
          size: schema.maybe(schema.number()),
          startIndex: schema.maybe(schema.number()),
          startTime: schema.maybe(schema.number()),
          endTime: schema.maybe(schema.number()),
        }),
      },
    },
    alertService.getAlerts
  );

  router.post(
    {
      path: API.ACKNOWLEDGE_ALERTS,
      validate: {
        params: schema.object({
          detector_id: schema.string(),
        }),
        body: schema.any(),
        query: createQueryValidationSchema(),
      },
    },
    alertService.acknowledgeAlerts
  );

  router.get(
    {
      path: `${API.THREAT_INTEL_BASE}/alerts`,
      validate: {
        query: createQueryValidationSchema({
          sortOrder: schema.maybe(schema.string()),
          size: schema.maybe(schema.number()),
          startIndex: schema.maybe(schema.number()),
          startTime: schema.maybe(schema.number()),
          endTime: schema.maybe(schema.number()),
        }),
      },
    },
    alertService.getThreatIntelAlerts
  );

  router.put(
    {
      path: `${API.THREAT_INTEL_BASE}/alerts/status`,
      validate: {
        query: createQueryValidationSchema({
          state: schema.string(),
          alert_ids: schema.string(),
        }),
      },
    },
    alertService.updateThreatIntelAlertsState
  );
}
