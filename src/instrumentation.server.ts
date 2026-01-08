import { dev } from '$app/environment';
import { PUBLIC_APP_ENV } from '$env/static/public';
import * as Sentry from '@sentry/sveltekit';

Sentry.init({
	dsn: 'https://91335032a1fef2b37caec0d0271a23a8@o412613.ingest.us.sentry.io/4510127619768320',
	enabled: !dev,

	tracesSampleRate: 1.0,

	// Enable logs to be sent to Sentry
	enableLogs: true,

	environment: PUBLIC_APP_ENV || 'development'

	// uncomment the line below to enable Spotlight (https://spotlightjs.com)
	// spotlight: import.meta.env.DEV,
});
