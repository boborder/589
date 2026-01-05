import type { Connection, ConnectionContext } from 'partyserver';
import { Server } from 'partyserver';
import type { OutgoingMessage, Position } from './schema/party';

export class WebSocketServer extends Server {
  static options = {
    hibernate: true,
    maxConnections: 100,
  };
  onConnect(conn: Connection<{ position: Position }>, ctx: ConnectionContext) {
    // Whenever a fresh connection is made, we'll
    // send the entire state to the new connection

    // First, let's extract the position from the Cloudflare headers
    const latitude = ctx.request.cf?.latitude as string | undefined;
    const longitude = ctx.request.cf?.longitude as string | undefined;
    if (!latitude || !longitude) {
      console.warn(`Missing position information for connection ${conn.id}`);
      return;
    }
    const position = {
      lat: parseFloat(latitude),
      lng: parseFloat(longitude),
      id: conn.id,
    };
    // And save this on the connection's state
    conn.setState({
      position,
    });

    // Now, let's send the entire state to the new connection
    for (const connection of this.getConnections<{ position: Position }>()) {
      try {
        conn.send(
          JSON.stringify({
            type: 'add-marker',
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            position: connection.state?.position,
          }),
        );

        // And let's send the new connection's position to all other connections
        if (connection.id !== conn.id) {
          connection.send(
            JSON.stringify({
              type: 'add-marker',
              position,
            }),
          );
        }
      } catch {
        this.onCloseOrError(conn);
      }
    }
  }

  // Whenever a connection closes (or errors), we'll broadcast a message to all
  // other connections to remove the marker.
  onCloseOrError(connection: Connection) {
    this.broadcast(
      JSON.stringify({
        type: 'remove-marker',
        id: connection.id,
      } satisfies OutgoingMessage),
      [connection.id],
    );
  }

  onClose(connection: Connection): void | Promise<void> {
    this.onCloseOrError(connection);
  }

  onError(connection: Connection): void | Promise<void> {
    this.onCloseOrError(connection);
  }
}
