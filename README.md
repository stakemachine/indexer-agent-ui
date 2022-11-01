# Indexer Agent UI

**_HIGHLY EXPERIMENTAL_**: **_USE AT YOUR OWN RISK_**

## How to use

```bash
docker run -p 3000:3000 -d --network=<indexer-network> -e UI_PASS=<SecurePassword> -e AGENT_ENDPOINT=http://indexer-agent:8000 -e SUBGRAPH_ENDPOINT=https://api.thegraph.com/subgraphs/name/graphprotocol/graph-network-goerli ghcr.io/stakemachine/indexer-agent-ui
```

### Access Credentials

Default username is `agent`, but you can override it via `UI_LOGIN` env variable.  
Default password is `password`, but we recommend to override it via `UI_PASS` env variable.

## If you want to contribute

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.
