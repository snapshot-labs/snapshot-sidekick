# Snapshot/Sidekick

Sidekick is the service serving all proposals' votes CSV report

<hr>

This service is exposing an API endpoint expecting a closed proposal ID, and will
return a CSV file with all the given proposal's votes.

NOTE: CSV files are generated only once, then cached, making this service a cache middleware
for snapshot-hub, for proposals' votes.

## Project Setup

### Dependencies

Install the dependencies

```
yarn
```

_This project does not require a database, but requires a [storage engine](#storage-engine)_

### Configuration

Edit the hub API url in the `.env` file if needed

```
HUB_URL=https://hub.snapshot.org
```

If you are using AWS as storage engine, set all the required `AWS_` config keys.

#### Storage engine

This script is shipped with 2 storage engine:

- `AWS`: All cached files will be stored on Amazon S3 storage
- `File`: All cached files will be stored locally, in the `tmp` folder (used for dev environment and testing)

You can toggle the cache engine in `helpers/utils.ts`, when importing the storage engine

```
// For AWS (default)
import StorageEngine from '../lib/storage/aws';
// For File
import StorageEngine from '../lib/storage/file';
```

## Compiles and hot-reloads for development

```
yarn dev
```

## Linting, typecheck and test

```
yarn lint
yarn typecheck
yarn test
```

## Usage

Retrieving and generating the cache file have their own respective endpoint

### Fetch a cache file

Send a POST request with a proposal ID

```
curl -X POST localhost:3000/votes/[PROPOSAL-ID]
```

When cached, this request will respond with a stream to a CSV file.

On all other cases, it will respond with a [JSON-RPC 2.0](https://www.jsonrpc.org/specification) error response:

```
{
  "jsonrpc":"2.0",
  "error":{
    "code": CODE,
    "message": MESSAGE
  },
  "id": PROPOSAL-ID
}
```

| Description                         | `CODE` | `MESSAGE`           |
| ----------------------------------- | ------ | ------------------- |
| When the proposal does not exist    | -40001 | PROPOSAL_NOT_FOUND  |
| When the proposal is not closed     | -40004 | PROPOSAL_NOT_CLOSED |
| When the file is pending generation | -40010 | PENDING_GENERATION  |
| Other/Unknown/Server Error          | -32603 | INTERNAL_ERROR      |

Furthermore, when votes report can be cached, but does not exist yet, a cache generation task will be queued. This enable cache to be generated on-demand.

### Generate a cache file

Send a POST request with a body following the [Webhook event object](https://docs.snapshot.org/tools/webhooks).

```
curl -X POST localhost:3000/votes/generate \
-H "Authenticate: WEBHOOK_AUTH_TOKEN" \
-H "Content-Type: application/json" \
-d '{"id": "proposal/[PROPOSAL-ID]", "event": "proposal/end"}'
```

- On success, will respond with a success [JSON-RPC 2.0](https://www.jsonrpc.org/specification) message
- On error, will respond with the same result and codes as the `fetch` endpoint above

The endpoint has been designed to receive events from snapshot webhook service.

Do not forget to set `WEBHOOK_AUTH_TOKEN` in the `.env` file

## Build for production

```
yarn build
yarn start
```

## License

[MIT](https://github.com/snapshot-labs/snapshot-sidekick/blob/main/LICENCE)
