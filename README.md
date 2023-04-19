# Snapshot/Sidekick

Sidekick is the service serving all proposals' votes CSV report

<hr>

This service is exposing an API endpoint expecting a closed proposal ID, and will
return a CSV file with all the given proposal's votes.

NOTE: CSV files are generated only once, then cached, making this service a cache middleware
for snapshot-hub, for proposals' votes.

## Project Setup

> yarn

Set the hub API url in the `.env` file

```
HUB_URL=
```

## Compiles and hot-reloads for development

```
yarn dev
```

## Linting and typecheck

```
yarn lint
yarn typecheck
```

## Usage

Send a POST request with a proposal ID

```
curl -X POST localhost:3000/votes/[PROPOSAL-ID]
```

When cached, this request will respond with a stream to a CSV file.

Otherwise, on error, it will respond with a [JSON-RPC 2.0](https://www.jsonrpc.org/specification) error response:

```
{
  "jsonrpc":"2.0",
  "error":{
    "code": CODE,
    "message": MESSAGE,
    "data": MESSAGE_DETAIL
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

## License

[MIT](https://github.com/snapshot-labs/envelop-ui/blob/bootstrap-app/LICENSE)
