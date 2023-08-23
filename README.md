# Snapshot/Sidekick [![codecov](https://codecov.io/gh/snapshot-labs/snapshot-sidekick/branch/main/graph/badge.svg?token=Tb16ITll42)](https://codecov.io/gh/snapshot-labs/snapshot-sidekick)

Sidekick is the service serving:

| Module name   | Description                                                      | Type                 |
| ------------- | ---------------------------------------------------------------- | -------------------- |
| `VotesReport` | all proposal's votes CSV report                                  | generation and cache |
| `moderation`  | moderation list                                                  | API only             |
| `NFTClaimer`  | NFT Claimer trusted backend server                               | generation           |
| `picSnap`     | an image generator for pictures snapshot of proposals and spaces | Generation and cache |

---

## Project Setup

### Requirements

node ">=16.0.0 <17.0.0"

### Dependencies

Install the dependencies

```bash
yarn
```

### Configuration

Copy `.env.example`, rename it to `.env` and edit the hub API url in the `.env` file if needed

```bash
HUB_URL=https://hub.snapshot.org
```

If you are using AWS as storage engine, set all the required `AWS_` config keys, and set `STORAGE_ENGINE` to `aws`.

### Storage engine

This script is shipped with 2 storage engines.

You can set the cache engine by toggling the `STORAGE_ENGINE` environment variable.

| `STORAGE_ENGINE` | Description | Cache save path                   |
| ---------------- | ----------- | --------------------------------- |
| `aws`            | Amazon S3   | `public/`                         |
| `file` (default) | Local file  | `tmp/` (relative to project root) |

### Compiles and hot-reloads for development

```bash
yarn dev
```

## Tests

All tests are run with their own environment, using `/test/.env.test`

### Setup

```
mysql -e 'CREATE DATABASE sidekick_test;' -uroot -proot
mysql -uroot -proot sidekick_test < src/helpers/schema.sql
mysql -uroot -proot -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'root';"
mysql -uroot -proot -e "FLUSH PRIVILEGES;"
```

### Usage

```
yarn test:unit to run unit tests
yarn test:e2e to run e2e tests
```

To run all tests, and generate test coverage:

```
yarn test
```

If you have added any E2E tests requiring snapshots update, run:

```bash
yarn test:e2e:update-snapshot
```

## Linting, typecheck

```bash
yarn lint
yarn typecheck
```

## Usage

### Votes CSV report

Generate and serve cached votes CSV report for closed proposals.

#### Configuration

Use the env variable `VOTE_REPORT_SUBDIR` to specify the subdir where to store the cached files (relative to the storage engine root)

> NOTE: CSV files are generated only once, then cached, making this service a cache middleware between snapshot-hub and UI

#### Fetch a cache file

Send a `POST` request with a proposal ID

```bash
curl -X POST localhost:3005/api/votes/[PROPOSAL-ID]
```

When cached, this request will respond with a stream to a CSV file.

When votes report can be cached, but does not exist yet, a cache generation task will be queued.
This enable cache to be generated on-demand.
A JSON-RPC success with status code `202` will then be returned, where the progress percentage can be retreive from the `result` message.

Example response for the proposal `0x5280241b4ccc9b7c5088e657a714d28fa89bd5305a1ff0abf0736438c446ae98` votes report, which is still pending generation, done at 15.45%.

```json
{
  "jsonrpc": "2.0",
  "result": "15.45",
  "id": "0x5280241b4ccc9b7c5088e657a714d28fa89bd5305a1ff0abf0736438c446ae98"
}
```

Cache is pre-warmed, by listening to [webhook](#webhook).

### Static moderation list

Return a curated list of moderation data (flagged/verified proposal/spaces/etc...)

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

You can pass multiple lists, separated by a comma.

Data are sourced from the json files with the same name, located in this repo `/data` directory, and a remote read-only SQL database.

### NFT Claimer trusted backend

Validate offchain data, and return a payload

#### Get global data

Retrieve global data from the smart contract.

Send a `GET` request to `/api/nft-claimer`

```bash
curl -X GET localhost:3005/api/nft-claimer
```

##### Example payload

```json
{
  "snapshotFee": 5
}
```

#### Sign deploy

Sign and return the payload for the SpaceCollectionFactory contract, in order to deploy a new SpaceCollection contract

Send a `POST` request with:

| `keyname`       | Type           | Description                                                                                       | Example                                                                         |
| --------------- | -------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `address`       | Wallet address | The sender wallet address                                                                         | `0x00000000000000000000000000000000000000000000000000000000000004d2`            |
| `id`            | `string`       | A space ID                                                                                        | `fabien.eth`                                                                    |
| `salt`          | `string`       | A string representation of a BigInt number                                                        | `72536493147621360896130495100276306361343381736075662552878320684807833746288` |
| `maxSupply`     | `number`       | The maximum number of mintable NFTs for each proposal                                             | `100`                                                                           |
| `mintPrice`     | `string`       | A string representation a a BigInt number, for the price in wei                                   | `100000000000000000`                                                            |
| `spaceTreasury` | Wallet address | The wallet address receiving the funds                                                            | `0x00000000000000000000000000000000000000000000000000000000000004d2`            |
| `proposerFee`   | `number`       | A number between 0 and 100, for the percentage of the mint price reversed to the proposal creator | `5`                                                                             |

```bash
curl -X POST localhost:3005/api/nft-claimer/deploy -H "Content-Type: application/json" -d '{"id": "fabien.eth", "address": "00000000000000000000000000000000000000000000000000000000000004d2", "salt": "123454678", "maxSupply": 100, "mintPrice": 10000, "spaceTreasury": "00000000000000000000000000000000000000000000000000000000000004d2", "proposerFee": 10}'
```

If the given `address` is the space controller, and the space has not setup NFT Claimer yet, this endpoint will return a `payload` object, with all parameters required for sending the transaction to the SpaceCollectionFactory contract

##### Example payload

```json
{
  "initializer": "0x977b0efb00000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000000000000000018000000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000091fd2c8d24767db4ece7069aa27832ffaf8590f300000000000000000000000091fd2c8d24767db4ece7069aa27832ffaf8590f300000000000000000000000000000000000000000000000000000000000000075465737444414f000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003302e3100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007656e732e65746800000000000000000000000000000000000000000000000000",
  "salt": "123454678",
  "abi": "function deployProxy(address implementation, bytes initializer, uint256 salt, uint8 v, bytes32 r, bytes32 s)",
  "implementation": "0x33505720a7921d23E6b02EB69623Ed6A008Ca511",
  "signature": {
    "r": "0xac72b099abc370f7dadca09110907fd0856d1e343b64dcb13bc4a55fa00fc8de",
    "s": "0x5c9846f3b2f0d4054857a02644aa7fd311c906057c7b5d0f47a8517743a3f5cd",
    "_vs": "0xdc9846f3b2f0d4054857a02644aa7fd311c906057c7b5d0f47a8517743a3f5cd",
    "recoveryParam": 1,
    "v": 28,
    "yParityAndS": "0xdc9846f3b2f0d4054857a02644aa7fd311c906057c7b5d0f47a8517743a3f5cd",
    "compact": "0xac72b099abc370f7dadca09110907fd0856d1e343b64dcb13bc4a55fa00fc8dedc9846f3b2f0d4054857a02644aa7fd311c906057c7b5d0f47a8517743a3f5cd"
  }
}
```

#### Sign mint

Sign and return the payload for the SpaceCollection contract, in order to mint a NFT

Send a `POST` request with:

| `keyname`        | Type           | Description                                | Example                                                                         |
| ---------------- | -------------- | ------------------------------------------ | ------------------------------------------------------------------------------- |
| `id`             | `string`       | The proposal ID                            | `0x1abb90a506a352e51d587b0ee8c387c0b129ea018aa77345fe7b5c2defa7d150`            |
| `address`        | Wallet address | The sender wallet address                  | `0x00000000000000000000000000000000000000000000000000000000000004d2`            |
| `salt`           | `string`       | A string representation of a BigInt number | `72536493147621360896130495100276306361343381736075662552878320684807833746288` |
| `proposalAuthor` | Wallet address | The proposal author's wallet address       | `0x1abb90a506a352e51d587b0ee8c387c0b129ea018aa77345fe7b5c2defa7d150`            |

```bash
curl -X POST localhost:3005/api/nft-claimer/mint -H "Content-Type: application/json" -d '{"id": "0x28535f56f29a9b085be88e3896da573c61095a14f092ce72afea3c83f4feefe0", "address": "0x91FD2c8d24767db4Ece7069AA27832ffaf8590f3", "salt": "1020303343345", "proposalAuthor": "0x16645967f660AC05EA542D3DE2f46E41b86436d9"}'
```

If given proposal's space has enabled NFT claimer, and there are still mintable NFT left, this endpoint will return a `payload` object, with all parameters required for sending the transaction to the SpaceCollection contract

##### Example payload

```json
{
  "salt": "123454678",
  "contractAddress": "0x33505720a7921d23E6b02EB69623Ed6A008Ca511",
  "proposer": "0x1abb90a506a352e51d587b0ee8c387c0b129ea018aa77345fe7b5c2defa7d150",
  "recipient": "0x1abb90a506a352e51d587b0ee8c387c0b129ea018aa77345fe7b5c2defa7d150",
  "spaceId": "fabien.eth",
  "abi": "function mint(address proposer, uint256 proposalId, uint256 salt, uint8 v, bytes32 r, bytes32 s)",
  "proposalId": "72536493147621360896130495100276306361343381736075662552878320684807833746288",
  "signature": {
    "r": "0xac72b099abc370f7dadca09110907fd0856d1e343b64dcb13bc4a55fa00fc8de",
    "s": "0x5c9846f3b2f0d4054857a02644aa7fd311c906057c7b5d0f47a8517743a3f5cd",
    "_vs": "0xdc9846f3b2f0d4054857a02644aa7fd311c906057c7b5d0f47a8517743a3f5cd",
    "recoveryParam": 1,
    "v": 28,
    "yParityAndS": "0xdc9846f3b2f0d4054857a02644aa7fd311c906057c7b5d0f47a8517743a3f5cd",
    "compact": "0xac72b099abc370f7dadca09110907fd0856d1e343b64dcb13bc4a55fa00fc8dedc9846f3b2f0d4054857a02644aa7fd311c906057c7b5d0f47a8517743a3f5cd"
  }
}
```

> **NOTE**: The returned `proposalId` in the payload is a number representation

### PicSnap

PicSnap is an image generator for snapshot spaces/proposals info.

#### Configuration

Use the env variable `OG_IMAGES_SUBDIR` to specify the subdir where to store the cached files (relative to the storage engine root)

#### Usage

Send a `GET` request to `/picsnap/:type(og-space|og-proposal|og-home)/:id?.:ext(png|svg)?`

It will create the cached file if it does not exist yet, then serve it.

By default, all images are in png format. You can additionally explicitely set the format by appending the extension to the url to `.svg` to retrieve the raw svg file (slower as only png files are cached)

Available image types are:

| `TYPE`        | Description                  | Example query                                                                                           | Size     |
| ------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------- | -------- |
| `og-home`     | Default image for OpenGraph  | `localhost:3005/picsnap/og-home`                                                                        | 1200x600 |
| `og-space`    | OpenGraph image for space    | `localhost:3005/picsnap/og-space/fabien.eth`                                                            | 1200x600 |
| `og-proposal` | OpenGraph image for proposal | `localhost:3005/picsnap/og-proposal/0x5280241b4ccc9b7c5088e657a714d28fa89bd5305a1ff0abf0736438c446ae98` | 1200x600 |

Images are created and auto-refreshed, by listening to [webhook](#webhook).

### Webhook

This endpoint will parse the incoming events, create a task, then queue it, to be processed by `queue`.

> This endpoint has been designed to receive events from snapshot webhook service.

#### Configuration

Set `WEBHOOK_AUTH_TOKEN` in the `.env` file

#### Usage

Send a `POST` request with a body following the [Webhook event object](https://docs.snapshot.org/tools/webhooks).

```bash
curl -X POST localhost:3005/webhook \
-H "Authenticate: WEBHOOK_AUTH_TOKEN" \
-H "Content-Type: application/json" \
-d '{"id": "proposal/[PROPOSAL-ID]", "event": "proposal/end"}'
```

On success, will respond with a success [JSON-RPC 2.0](https://www.jsonrpc.org/specification) message

### Sentry tunnel

#### Problem

Sentry javascript tracker may be blocked by some ad-blocker. See [reference](https://docs.sentry.io/platforms/javascript/troubleshooting/#dealing-with-ad-blockers).

The recommended workaround is to tunnel all the sentry traffic through a customized backend.

#### Configuration

Set the `TUNNEL_SENTRY_DSN` env variable to the same as the one defined on your front end app.
This will ensure that this tunnel only accept and filters request from this specific DSN.

#### Solution

This endpoint expose a `POST` route, to tunnel all sentry requests.

It is designed to accept request directly from the sentry SDK, and not to be used alone.
We can still test it manually by sending the following curl request (replace the `dsn` value by the one you set in `TUNNEL_SENTRY_DSN`)

#### Test request

```bash
curl 'http://localhost:3005/sentry' \
  --data-raw $'{"sent_at":"2023-07-09T08:33:20.789Z","sdk":{"name":"sentry.javascript.vue","version":"7.55.2"},"dsn":"https://d70c3273a4674febbfbd6e767b597290@o4505452248563712.ingest.sentry.io/4505453376372736"}\n{"type":"session"}\n{"sid":"581f36ab63e747de98eb05e0cf820818","init":true,"started":"2023-07-09T08:33:20.788Z","timestamp":"2023-07-09T08:33:20.788Z","status":"ok","errors":0,"attrs":{"release":"snapshot@0.1.4","environment":"production","user_agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"}}' \
  --compressed
```

The request should return a `200` status code.

### Errors

All endpoints will respond with a [JSON-RPC 2.0](https://www.jsonrpc.org/specification) error response on error:

```bash
{
  "jsonrpc": "2.0",
  "error":{
    "code": CODE,
    "message": MESSAGE
  },
  "id": ID
}
```

| Description                         | `CODE` | `MESSAGE`            |
| ----------------------------------- | ------ | -------------------- |
| When the record does not exist      | 404    | RECORD_NOT_FOUND     |
| When the file is pending generation | 202    | PENDING_GENERATION   |
| Other/Unknown/Server Error          | -32603 | INTERNAL_ERROR       |
| Other error                         | 500    | Depends on the error |

## Build for production

```bash
yarn build
yarn start
```

## License

[MIT](LICENCE)
