import * as Sentry from '@sentry/node';
import type { Express } from 'express';

export function initLogger(app: Express) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations()
    ],

    tracesSampleRate: 0.25
  });

  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

export function fallbackLogger(app: Express) {
  app.use(Sentry.Handlers.errorHandler());
  app.use(function onError(err: any, req: any, res: any) {
    res.statusCode = 500;
    res.end(`${res.sentry}\n`);
  });
}

export function capture(e: any) {
  Sentry.captureException(e);
}
