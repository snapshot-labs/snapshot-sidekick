# Snapshot/Sidekick

Sidekick is the service serving all proposal's votes CSV report

---

This service is exposing an API endpoint expecting a closed proposal ID, and will
return a CSV file with all the given proposal's votes.

> NOTE: CSV files are generated only once, then cached, making this service a cache middleware between snapshot-hub and UI

## Project Setup

### Requirements

node >= 18.0.0

### Dependencies

Install the dependencies

```bash
yarn
```

_This project does not require a database, but requires a [storage engine](#storage-engine)_

### Configuration

Copy `.env.example`, rename it to `.env` and edit the hub API url in the `.env` file if needed

```bash
HUB_URL=https://hub.snapshot.org
```

If you are using AWS as storage engine, set all the required `AWS_` config keys, and set `STORAGE_ENGINE` to `aws`.

### Storage engine

This script is shipped with 2 storage engine.

You can set the cache engine by toggling the `STORAGE_ENGINE` environment variable.

| `STORAGE_ENGINE` | Description | Cache save path                   |
| ---------------- | ----------- | --------------------------------- |
| `aws`            | Amazon S3   | `public/`                         |
| `file` (default) | Local file  | `tmp/` (relative to project root) |

You can additionally specify a sub directory by setting `VOTE_REPORT_SUBDIR`
(By default, all votes report will be nested in the `votes` directory).

### Compiles and hot-reloads for development

```bash
yarn dev
```

## Linting, typecheck and test

```bash
yarn lint
yarn typecheck
yarn test
yarn test:e2e
```

## Usage

Retrieving and generating the cache file have their own respective endpoint

### Fetch a cache file

Send a POST request with a proposal ID

```bash
curl -X POST localhost:3000/votes/[PROPOSAL-ID]
```

When cached, this request will respond with a stream to a CSV file.

On all other cases, it will respond with a [JSON-RPC 2.0](https://www.jsonrpc.org/specification) error response:

```bash
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

```bash
curl -X POST localhost:3000/votes/generate \
-H "Authenticate: WEBHOOK_AUTH_TOKEN" \
-H "Content-Type: application/json" \
-d '{"id": "proposal/[PROPOSAL-ID]", "event": "proposal/end"}'
```

- On success, will respond with a success [JSON-RPC 2.0](https://www.jsonrpc.org/specification) message
- On error, will respond with the same result and codes as the `fetch` endpoint above

The endpoint has been designed to receive events from snapshot webhook service.

Do not forget to set `WEBHOOK_AUTH_TOKEN` in the `.env` file

### Return a moderationList

Send a GET request

```bash
curl localhost:3000/moderationList
```

You can also choose to filter the list, with the `?fields=` query params.
Valid values are:

- flaggedProposals
- flaggedLinks
- verifiedSpaces

Data are sourced from the json with the same, located in `/data`.

## Build for production

```bash
yarn build
yarn start
```

## License

[MIT](https://github.com/snapshot-labs/snapshot-sidekick/blob/main/LICENCE)
