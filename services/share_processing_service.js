const { constructShare } = require('./share_construction_service');
const { submitBlock } = require('./shaicoin_service');

const processShare = async (data, ws) => {
    try {
        const { nonce, job_id, path, blockTarget, blockHex } = data;

        if (ws.job && job_id !== ws.job.jobId) {
            ws.send(JSON.stringify({ type: 'rejected', message: 'Job ID mismatch' }));
            return;
        }

        ws.job.jobId = -1

        const obj = constructShare(ws.job.data, nonce, path);

        const hashVal = Buffer.from(obj.hash, 'hex')
        const target = Buffer.from(ws.job.target, 'hex');
        const block = Buffer.from(blockTarget, 'hex');
        
        if (hashVal.compare(target) < 0) {
            if(hashVal.compare(block) < 0) {
                const blockHexUpdated = obj.data + blockHex.slice(8192)
                submitBlock(blockHexUpdated)
            }
            ws.send(JSON.stringify({ type: 'accepted' }));
        } else {
            ws.send(JSON.stringify({ type: 'rejected' }));
        }
    } catch (error) {
        console.log(error)
        ws.send(JSON.stringify({ type: 'rejected' }));
    }
};

module.exports = { processShare };
