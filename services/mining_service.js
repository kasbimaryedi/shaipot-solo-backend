const WebSocket = require('ws');
const { processShare } = require('./share_processing_service');
const { adjustDifficulty, minerLeft } = require('./difficulty_adjustment_service');
const { generateJob, extractBlockHexToNBits } = require('./share_construction_service');

const shaicoin_service = require('./shaicoin_service')
var current_raw_block = null
var block_data = null

const sendJobToWS = (ws) => {
    if (ws.readyState === ws.OPEN) {
        const job = generateJob(ws, block_data);
        ws.job = job;
        ws.send(JSON.stringify({
            type: 'job',
            job_id: job.jobId,
            data: job.data,
            target: job.target,
        }));
    }
}

const distributeJobs = (wss) => {
    if(block_data == null) {
        return
    }

    wss.clients.forEach((ws) => {
        sendJobToWS(ws)
    });
};

const handleShareSubmission = async (data, ws) => {
    const { miner_id, nonce, job_id, path } = data;

    if (!ws.minerId) {
        var isValid = await shaicoin_service.validateAddress(miner_id)
        if(isValid) {
            ws.minerId = miner_id;
        } else {
            ws.close(1008, 'Bye.');
            return
        }
    }
    
    await processShare({
        minerId: miner_id,
        nonce: nonce,
        job_id: job_id,
        path: path,
        blockTarget: current_raw_block.expanded,
        blockHex: current_raw_block.blockhex
    }, ws);

    await adjustDifficulty(miner_id, ws);

    sendJobToWS(ws)
};

const startMiningService = async (port) => {
    const wss = new WebSocket.Server({ port });
    
    wss.on('connection', (ws) => {
        console.log("____________Miner connected______________")
        ws.difficulty = 1
        sendJobToWS(ws)

        ws.on('message', async (message) => {
            const data = JSON.parse(message);
            if (data.type === 'submit') {
                await handleShareSubmission(data, ws);
            }
        });

        ws.on('close', () => {
            if(ws.minerId) {
                minerLeft(ws.minerId)
            }
            console.log("____________Miner disconnected______________")
        });
    });

    global.rawDawginIt = (error, rawBlock) => {
        if(error == null) {
            current_raw_block = rawBlock
            block_data = extractBlockHexToNBits(current_raw_block)
            distributeJobs(wss)
        }
    }
    
    await shaicoin_service.getBlockTemplate()
    console.log(`Mining service started on port ${port}`);
};

module.exports = { startMiningService };
