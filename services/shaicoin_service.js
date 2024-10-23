const axios = require('axios');
const config = require("../config.json")

let currentLongPollId = null;
let blockFetchInterval = null;
let abortController = null; 

async function getnewblockraw(minerAddress) {
    abortController = new AbortController();
    const signal = abortController.signal;

    try {
        const response = await axios.post(config.rpc_url, {
            jsonrpc: '1.0',
            id: 'mining_pool',
            method: 'getnewblockraw',
            params: [minerAddress]
        }, {
            auth: {
                username: config.rpc_username,
                password: config.rpc_password
            },
            signal
        });
        return response.data.result;
    } catch (error) {
        console.error('Error fetching raw block data:', error);
        throw error;
    }
}

async function innerRawDawg() {
    try {
        if(global.rawDawginIt) {
            global.rawDawginIt(null, await getnewblockraw(config.pool_shaicoin_address));
        }
    } catch (error) {
        if(global.rawDawginIt) {
            global.rawDawginIt(error, null);
        }
    }
}

async function getBlockTemplate(longpollid = null, retryCount = 0) {
    const maxRetries = 5;
    const maxBackoff = 60000;

    try {
        const params = {
            capabilities: ['coinbasetxn', 'workid', 'coinbase/append', 'longpoll', 'segwit'],
            rules: ['segwit'],
            longpollid: longpollid
        };

        const response = await axios.post(config.rpc_url, {
            jsonrpc: '1.0',
            id: 'mining_pool',
            method: 'getblocktemplate',
            params: [params]
        }, {
            auth: {
                username: config.rpc_username,
                password: config.rpc_password
            }
        });

        console.log(`${new Date().toISOString()} - getBlockTemplate has returned; let's start mining`);

        const blockTemplate = response.data.result;

        if (blockTemplate.longpollid && blockTemplate.longpollid !== currentLongPollId) {
            currentLongPollId = blockTemplate.longpollid;

            if (blockFetchInterval) {
                clearInterval(blockFetchInterval);
            }

            if (abortController) {
                abortController.abort();
            }

            await innerRawDawg();
            scheduleNewBlockFetch();
        }

        await getBlockTemplate(currentLongPollId);
    } catch (error) {
        if (error.response && error.response.status === 403) {
            return;  // Do not retry on 403 error, requires user intervention
        }

        if (retryCount < maxRetries) {
            const backoffTime = Math.min(Math.pow(2, retryCount) * 1000, maxBackoff);
            console.log(`Retrying getBlockTemplate in ${backoffTime / 1000} seconds... (Retry ${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            return getBlockTemplate(longpollid, retryCount + 1);
        } else {
            console.error('Max retries reached. Giving up on fetching block template.');
        }
    }
}

function scheduleNewBlockFetch() {
    // Call getnewblockraw every 15 seconds
    blockFetchInterval = setInterval(async () => {
        await innerRawDawg()
    }, 45000); // 45 seconds interval
}

async function submitBlock(rawBlockHex) {
    try {
        const response = await axios.post(config.rpc_url, {
            jsonrpc: '1.0',
            id: 'mining_pool',
            method: 'submitblock',
            params: [rawBlockHex]
        }, {
            auth: {
                username: config.rpc_username,
                password: config.rpc_password
            }
        });

        const result = response.data.result;
        if (result === null) {
            console.log('Block submission successful');
        }
    } catch (error) {
        console.error('Error submitting block:', error);
    }
}

module.exports = {
    getBlockTemplate,
    submitBlock
};
