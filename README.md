# Indexer Agent UI

**_HIGHLY EXPERIMENTAL_**: **_USE AT YOUR OWN RISK_**

The Indexer Agent UI allows you to manage your indexer operations simply via web.

## Features

- Indexing Rules: create and manage indexing rules
- Action queue: create actions and manage your actions queue
- Cost models: set your cost models
- Explore subgraphs: find subgraphs to index
- Deployments: monitor the progress of deployments you index
- Allocations: watch and manage your allocations
- Indexer info: view basic information about your indexer account

## Screenshots

![Dashboard](screenshots/dashboard.jpeg)

## How to run

```bash
docker run -p 3000:3000 -d --network=<indexer-network> -e NEXTAUTH_SECRET=$(openssl rand -base64 32) -e UI_LOGIN=<username> -e UI_PASS=<SecurePassword> -e AGENT_ENDPOINT=http://indexer-agent:8000 -e SUBGRAPH_ENDPOINT=https://api.thegraph.com/subgraphs/name/graphprotocol/graph-network-goerli ghcr.io/stakemachine/indexer-agent-ui
```

Not providing `NEXTAUTH_SECRET` will throw an error.  
If you use different public port, you also need to set `NEXTAUTH_URL` to the public URL that will be used to access the interface (example `http://<your-url>:9000`)

### Access Credentials

There is no default credentials, you always need to provide `UI_LOGIN` and `UI_PASS` env variables.

## If you want to contribute

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

## Support

If you run into any issues while using the Indexer Agent UI, please open an issue in this repository.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
