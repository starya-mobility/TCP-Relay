const net = require('net');

let client1 = null;
let client2 = null;

const server = net.createServer((client) => {
  console.log(`Client ${client.remoteAddress}:${client.remotePort} connected`);

  // If both clients are already connected, refuse the connection
  if (client1 && client2) {
    console.log('Refusing connection. Maximum clients reached.');
    client.end();
    return;
  }

  // If this is the first client, assign it to client1
  if (!client1) {
    console.log('Assigning client1');
    client1 = client;
    client1.on('end', () => {
      console.log('Client1 disconnected. Cycling...');
      client1 = null;
    });
    return;
  }

  // If this is the second client, assign it to client2 and start relaying data
  console.log('Assigning client2');
  client2 = client;
  client2.on('end', () => {
    console.log('Client2 disconnected. Cycling...');
    client2 = null;
  });

  client1.on('data', (data) => {
    console.log(`Received data from client1 (${data.length} bytes)`);
    if (client2) {
      client2.write(data);
    }
  });

  client2.on('data', (data) => {
    console.log(`Received data from client2 (${data.length} bytes)`);
    if (client1) {
      client1.write(data);
    }
  });
});

const PORT = 8000;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`Server listening on ${HOST}:${PORT}`);
});

// Set up the SIGINT listener outside the server callback function
process.on('SIGINT', () => {
  console.log('Received SIGINT. Shutting down server...');

  if (client1) {
    client1.end();
  }

  if (client2) {
    client2.end();
  }

  // Call the close method on the server to stop accepting new connections and close existing connections
  server.close(() => {
    console.log('Server is shut down. Exiting process.');
    process.exit();
  });
});
