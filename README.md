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

_This project does not require a database, but may need larger server storage capacity for the cached files_

### Configuration

Edit the hub API url in the `.env` file if needed

```
HUB_URL=https://hub.snapshot.org
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

## Build for production

```
yarn build
yarn start
```

## License

[MIT](https://github.com/snapshot-labs/envelop-ui/blob/bootstrap-app/LICENSE)
