# Shaipot Solo Backend

## Summary

If you want to mine with multiple shaipot devices in SOLO mode instead of mining in a pool. You can run this software and point your shaipot devices to this server. You will need a fully synced shaicoin node.

## Prerequisites

- Node.js (v15.0.0 or higher)
- C++ compiler (for building the native addon)

## Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone https://github.com/shaicoin/shaipot-solo-backend.git
   cd shaipot-solo-backend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build Native Addon**
   ```bash
   npm run build
   ```

4. **Configure RPC Connection**
   Edit the `config.json` file to set up the connection to your shaicoin RPC server and ensure a proper address
   ```json
   {
       "rpc_url": "http://your_rpc_server:port",
       "rpc_username": "your_username",
       "rpc_password": "your_password",
       "pool_shaicoin_address": "your_pool_address"
   }
   ```

5. **Start the Service**
   ```bash
   node server.js
   ```

## Configuration

The `config.json` file contains essential settings for the mining pool service:

Make sure that your shaicoin node is running the latest v1.0.3 which contains this commit (https://github.com/shaicoin/shaicoin/commit/72b145e840831669f962b6c7cd72615069eafa62)

using this program it actually doesnt matter about the addresses on the client
