# Snapshot/Sidekick [![codecov](https://codecov.io/gh/snapshot-labs/snapshot-sidekick/branch/main/graph/badge.svg?token=Tb16ITll42)](https://codecov.io/gh/snapshot-labs/snapshot-sidekick)

Sidekick is the service serving:

- all proposal's votes CSV report
- Moderation list
- NFT Claimer trusted backend server

---

## Project Setup

### Requirements

node ">=16.0.0 <17.0.0"

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

If you have added any E2E tests requiring snapshots update, run:

```bash
yarn test:e2e:update-snapshot
```

## Usage

### Votes CSV report

Generate and serve votes CSV report for closed proposals.

> NOTE: CSV files are generated only once, then cached, making this service a cache middleware between snapshot-hub and UI

#### Fetch a cache file

Send a `POST` request with a proposal ID

```bash
curl -X POST localhost:3005/api/votes/[PROPOSAL-ID]
```

When cached, this request will respond with a stream to a CSV file.

When votes report can be cached, but does not exist yet, a cache generation task will be queued.
This enable cache to be generated on-demand.
A JSON-RPC success with status code `202` will then be returned, with the progress percentage as `result` message.

```
{
  "jsonrpc":"2.0",
  "result":"15.45",
  "id":"0x5280241b4ccc9b7c5088e657a714d28fa89bd5305a1ff0abf0736438c446ae98"
}
```

#### Generate a cache file

Send a `POST` request with a body following the [Webhook event object](https://docs.snapshot.org/tools/webhooks).

```bash
curl -X POST localhost:3005/webhook \
-H "Authenticate: WEBHOOK_AUTH_TOKEN" \
-H "Content-Type: application/json" \
-d '{"id": "proposal/[PROPOSAL-ID]", "event": "proposal/end"}'
```

On success, will respond with a success [JSON-RPC 2.0](https://www.jsonrpc.org/specification) message

> This endpoint has been designed to receive events from snapshot webhook service.

Do not forget to set `WEBHOOK_AUTH_TOKEN` in the `.env` file

### Static moderation list

Return a curated list of moderated data.

#### Retrieve the list

Send a `GET` request

```bash
curl localhost:3005/api/moderation
```

You can also choose to filter the list, with the `?list=` query params.
Valid values are:

- `flaggedProposals`
- `flaggedLinks`
- `verifiedSpaces`
- `flaggedSpaces`

You can pass multiple list, separated by a comma.

Data are sourced from the json files with the same name, located in this repo `/data` directory, and a remote read-only SQL database.

### NFT Claimer trusted backend

Validate offchain data, and return a signature

#### Sign space

Send a `POST` request with a wallet address, a space ID and a salt

```bash
curl -X POST http://localhost:3005/api/nft-claimer/deploy/sign -H "Content-Type: application/json" -d '{"id": "gitcoindao.eth", "address": "0xc2E2B715d9e302947Ec7e312fd2384b5a1296099", "salt": "12345"}'
```

If the given `address` is the space creator, and the space has enabled NFT claimer, this endpoint will return a `signature` (e.g. `123abc`).

#### Sign mint

Send a `POST` request with a wallet address, a proposal ID and a salt

```bash
curl -X POST http://localhost:3005/api/nft-claimer/mint/sign -H "Content-Type: application/json" -d '{"id": "0x6b703b90d3cd1f82f7c176fc2e566a2bb79e8eb6618a568b52a4f29cb2f8d57b", "address": "0xc2E2B715d9e302947Ec7e312fd2384b5a1296099", "salt": "12345"}'
```

If given proposal's space has enabled NFT claimer, this endpoint will return a `signature` (e.g. `123abc`).

### Errors

All endpoints will respond with a [JSON-RPC 2.0](https://www.jsonrpc.org/specification) error response on error:

```bash
{
  "jsonrpc":"2.0",
  "error":{
    "code": CODE,
    "message": MESSAGE
  },
  "id": ID
}
```

| Description                      | `CODE` | `MESSAGE`           |
| -------------------------------- | ------ | ------------------- |
| When the proposal does not exist | 404    | PROPOSAL_NOT_FOUND  |
| When the record does not exist   | 404    | RECORD_NOT_FOUND    |
| When the proposal is not closed  | -40004 | PROPOSAL_NOT_CLOSED |
| Other/Unknown/Server Error       | -32603 | INTERNAL_ERROR      |

## Build for production

```bash
yarn build
yarn start
```

## License

[MIT](LICENCE)
