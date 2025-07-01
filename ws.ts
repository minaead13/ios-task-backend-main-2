import { defineHooks } from 'crossws';
import type { Peer, Message } from 'crossws';
import { consola } from 'consola';

const connectedPeers = new Set<Peer>();

export const websocketHooks = defineHooks({
  open(peer: Peer) {
    consola.success('[ws] open', peer);
    connectedPeers.add(peer);
    peer.send('Successfully connected to orders updates WebSocket endpoint');
  },

  message(peer: Peer, message: Message) {
    consola.log('[ws] message', peer, message.text());
    peer.publish('orders-updates', `[${peer}] ${message.text()}`);

    // Echo the message back to the sender
    peer.send(message.text());
  },

  close(peer: Peer, event: any) {
    consola.info('[ws] close', peer, event);
    connectedPeers.delete(peer);
  },

  error(peer: Peer, error: any) {
    consola.error('[ws] error', peer, error);
  },
});

// Function to publish order status updates to all connected WebSocket clients
export function publishMessageToPeers(rawMessage: object) {
  const message = JSON.stringify(rawMessage);

  connectedPeers.forEach((peer) => {
    try {
      peer.send(message);
    } catch (error) {
      consola.error('Failed to send message to peer:', error);
      connectedPeers.delete(peer);
    }
  });
}
