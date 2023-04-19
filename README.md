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

## License

[MIT](https://github.com/snapshot-labs/envelop-ui/blob/bootstrap-app/LICENSE)
