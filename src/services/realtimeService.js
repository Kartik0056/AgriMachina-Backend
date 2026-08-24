/**
 * Real-Time Broadcast Service (Server-Sent Events)
 * Delivers instantaneous real-time updates to storefront & admin clients without full page reloads.
 */

const clients = new Set();

const handleSSEStream = (req, res) => {
  // Set headers for SSE stream
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': req.headers.origin || '*',
    'Access-Control-Allow-Credentials': 'true',
    'X-Accel-Buffering': 'no'
  });

  res.write(`event: connected\ndata: ${JSON.stringify({ status: 'connected', clientsCount: clients.size + 1, timestamp: Date.now() })}\n\n`);

  clients.add(res);

  // Heartbeat ping every 25s to keep connections alive
  const heartbeat = setInterval(() => {
    try {
      res.write(`: heartbeat ${Date.now()}\n\n`);
    } catch (e) {
      clearInterval(heartbeat);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(res);
  });
};

/**
 * Broadcast an event and payload to all connected clients in real-time
 * @param {string} event - e.g. 'PRODUCT_UPDATED', 'INVENTORY_UPDATED', 'CATEGORY_UPDATED', 'DEALS_UPDATED'
 * @param {object} payload - data payload
 */
const broadcastRealtimeEvent = (event, payload = {}) => {
  const message = `event: ${event}\ndata: ${JSON.stringify({ ...payload, timestamp: Date.now() })}\n\n`;

  for (const client of clients) {
    try {
      client.write(message);
    } catch (err) {
      clients.delete(client);
    }
  }
};

module.exports = {
  handleSSEStream,
  broadcastRealtimeEvent
};
