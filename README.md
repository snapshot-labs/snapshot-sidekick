# Snapshot/Sidekick

Sidekick is the service serving all proposals' votes CSV report, as well as opengraph image.

---

This service is exposing:

- an API endpoint expecting a closed proposal ID, and will
  return a CSV file with all the given proposal's votes.
- an API endpoint to fetch [OpenGraph](https://ogp.me/) image for proposal and space

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
```

## Usage

### CSV votes report

#### Fetch a cache file

##### `POST /votes/[PROPOSAL-ID]`

Send a POST request with a proposal ID

```bash
curl -X POST localhost:3000/votes/[PROPOSAL-ID]
```

When cached, this request will respond with a stream to a CSV file.

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

### OpenGraph images

#### Fetch an image

##### `GET /og/[TYPE]/[ID]`

Send a GET request with an image type and ID

```
curl -X GET localhost:3000/og/(space|proposal)[PROPOSAL-ID]
```

This endpoint will return a .png image designed to be used with [OpenGraph](https://ogp.me/) `og:image` meta tag.

The different image types are

| TYPE       | Description                                       | Url format                |
| ---------- | ------------------------------------------------- | ------------------------- |
| `space`    | A space image                                     | `/og/space/SPACE_ID`      |
| `proposal` | A proposal image                                  | `og/proposal/PROPOSAL_ID` |
| `home`     | A generic image (static image with just the logo) | `og/home`                 |

All the images are built-on demand, and will be cached after the first generation.

Image dimension are 1200px x 600px, and default returned image format will be PNG.

> For debug purpose, you can also use the `.svg` file extension when polling the endpoint, to preview a high-resolution rendering of the image before conversion to .png

#### Refresh an image

##### `POST /og/refresh`

Send a POST request with a body following the [Webhook event object](https://docs.snapshot.org/tools/webhooks).

```
curl -X POST localhost:3000/og/refresh \
-H "Authenticate: WEBHOOK_AUTH_TOKEN" \
-H "Content-Type: application/json" \
-d '{"id": "proposal/[PROPOSAL-ID]", "event": "proposal/end"}'
```

This endpoint will force the generation of a new image i already cached, or create it if not exist, and is used to receive webhook in order to keep data in images up-to-date.

On success, will respond with a success [JSON-RPC 2.0](https://www.jsonrpc.org/specification) message

## Error response

When not returning the expected result, all API endpoint will respond with a [JSON-RPC 2.0](https://www.jsonrpc.org/specification) error response:

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

## Build for production

```bash
yarn build
yarn start
```

## License

[MIT](https://github.com/snapshot-labs/snapshot-sidekick/blob/main/LICENCE)
