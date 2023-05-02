# Snapshot/Sidekick

Sidekick is the service serving all proposals' votes CSV report, as well as opengraph image.

<hr>

This service is exposing:

- an API endpoint expecting a closed proposal ID, and will
  return a CSV file with all the given proposal's votes.
- an API endpoint to fetch [OpenGraph](https://ogp.me/) image for proposal and space

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

### CSV votes report

#### Fetch a cache file

##### `POST /votes/[PROPOSAL-ID]`

Send a POST request with a proposal ID

```
curl -X POST localhost:3000/votes/[PROPOSAL-ID]
```

When cached, this request will respond with a stream to a CSV file.

Furthermore, when votes report can be cached, but does not exist yet, a cache generation task will be queued. This enable cache to be generated on-demand.

#### Generate a cache file

##### `POST /votes/generate`

Send a POST request with a body following the [Webhook event object](https://docs.snapshot.org/tools/webhooks).

```
curl -X POST localhost:3000/votes/generate \
-H "Authenticate: WEBHOOK_AUTH_TOKEN" \
-H "Content-Type: application/json" \
-d '{"id": "proposal/[PROPOSAL-ID]", "event": "proposal/end"}'
```

On success, will respond with a success [JSON-RPC 2.0](https://www.jsonrpc.org/specification) message

> This endpoint has been designed to receive events from snapshot webhook service.

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

## Build for production

```
yarn build
yarn start
```

## License

[MIT](https://github.com/snapshot-labs/snapshot-sidekick/blob/main/LICENCE)
