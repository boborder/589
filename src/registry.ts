// import { actor, setup } from "rivetkit";
// import * as Y from "yjs";
// import { applyUpdate, encodeStateAsUpdate } from "yjs";

// // session
// export const session = actor({
//   options: {
//     sleepTimeout: 2000,
//   },
//   createState(c) {
//     console.log(c.region);
//     return {
//       activePlayers: 1,
//     };
//   },
//   onConnect: (c, conn) => {
//     console.log(conn)
//     conn.id;
//   },
//   actions: {
//     addPlayer: (c, playerId: number[]) => {
//       c.state.activePlayers += playerId.length;
//       c.broadcast("newActivePlayers", c.state.activePlayers);
//       return c.state.activePlayers;
//     },
//     removePlayer: (c, playerId: number[]) => {
//       c.state.activePlayers -= playerId.length;
//       c.broadcast("newActivePlayers", c.state.activePlayers);
//       return c.state.activePlayers;
//     },
//   },
// });

// // scheduler
// export const getInfo = actor({
//   options: {
//     canHibernateWebSocket: true,
//   },
//   state: { price: 0, time: 0, ledgerIndex: 0 },
//   actions: {
//     setReminder: (c) => {
//       const url = "https://xrpl.ws";
//       c.schedule.after(3000, "getLedgerIndex", url);
//       c.schedule.after(10000, "getPrice", url);
//       c.schedule.after(100000, "getTime", url);
//       return { url };
//     },
//     getPrice: (c, url: string) => {
//       console.log(url);
//       c.broadcast("newPrice", c.state.price);
//       return c.state.price;
//     },
//     getTime: (c, url: string) => {
//       console.log(url);
//       c.broadcast("newTime", c.state.time);
//       return c.state.time;
//     },
//     getLedgerIndex: (c, url: string) => {
//       console.log(url);
//       c.broadcast("newLedgerIndex", c.state.ledgerIndex);
//       return c.state.ledgerIndex;
//     },
//   },
// });

// export const yjsDoc = actor({
//   options: {
//     canHibernateWebSocket: true,
//   },
//   createVars: () => ({
//     doc: new Y.Doc(),
//   }),
//   state: {
//     docData: "",
//     lastModified: 0,
//   },
//   onBeforeConnect: () => {
//   },
//   onConnect: (c, conn) => {
//     const update = encodeStateAsUpdate(c.vars.doc);
//     const base64 = btoa(String.fromCharCode(...update));
//     conn.send("initialState", { update: base64 });
//   },
//   actions: {
//     // Callable functions from clients: https://rivet.gg/docs/actors/actions
//     applyUpdate: (c, updateBase64: string) => {
//       const binary = atob(updateBase64);
//       const update = new Uint8Array(binary.length);
//       for (let i = 0; i < binary.length; i++) {
//         update[i] = binary.charCodeAt(i);
//       }

//       applyUpdate(c.vars.doc, update);

//       const fullState = encodeStateAsUpdate(c.vars.doc);
//       // State changes are automatically persisted
//       c.state.docData = btoa(String.fromCharCode(...fullState));
//       c.state.lastModified = Date.now();

//       // Send events to all connected clients: https://rivet.gg/docs/actors/events
//       c.broadcast("update", { update: updateBase64 });
//     },

//     getState: (c) => ({
//       docData: c.state.docData,
//       lastModified: c.state.lastModified,
//     }),
//   },
// });

// export const registry = setup({
//   use: { session, getInfo, yjsDoc },
// });

import { actor, setup } from "rivetkit";
import type { OutgoingMessage, Position } from "./schema/party";

export const websocketServer = actor({
  options: {
    sleepTimeout: 2000,
  },
  state: {
    positions: new Map<string, Position>(),
  },
  createConnState: (_c, opts: { request: Request }) => ({
    latitude: opts.request.cf?.latitude as string | undefined,
    longitude: opts.request.cf?.longitude as string | undefined,
  }),

  onConnect: (c, conn) => {
    const latitude = conn.state.latitude;
    const longitude = conn.state.longitude;

    if (!latitude || !longitude) {
      console.warn(`Missing position information for connection ${conn.id}`);
      return;
    }

    const position: Position = {
      lat: parseFloat(latitude),
      lng: parseFloat(longitude),
      id: conn.id, // conn.idを使用
    };

    // 状態に保存
    c.state.positions.set(conn.id, position);

    // ✅ 修正: JSON.stringifyを削除、正しい形式に
    c.broadcast("add-marker", {
      type: "add-marker",
      position,
    } satisfies OutgoingMessage);

    // ✅ 追加: 新規接続に既存の全位置を送信
    for (const [id, pos] of c.state.positions.entries()) {
      if (id !== conn.id) {
        try {
          conn.send("add-marker", {
            type: "add-marker",
            position: pos,
          } satisfies OutgoingMessage);
        } catch (error) {
          console.error(`Failed to send to ${conn.id}:`, error);
        }
      }
    }
  },
  onDisconnect: (c, conn) => {
    c.state.positions.delete(conn.id);
    c.broadcast("remove-marker", {
      type: "remove-marker",
      id: conn.id,
    } satisfies OutgoingMessage);
  },

  actions: {
    addMarker: (c, position: Position) => {
      c.state.positions.set(position.id, position);
      c.broadcast("add-marker", {
        type: "add-marker",
        position,
      } satisfies OutgoingMessage);
    },
    removeMarker: (c, id: string) => {
      c.state.positions.delete(id);
      c.broadcast("remove-marker", {
        type: "remove-marker",
        id,
      } satisfies OutgoingMessage);
    },
  },
});

export const registry = setup({
  use: { websocketServer },
});
