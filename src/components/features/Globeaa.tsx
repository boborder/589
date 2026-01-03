import createGlobe from "cobe";
import { useEffect, useRef, useState } from "hono/jsx/dom";
import type { Position } from "../../schema/party";

// クライアント側ではWebSocketを直接使用（@rivetkit/reactの依存関係を回避）

export const Globe = () => {
  // A reference to the canvas element where we'll render the globe
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // The number of markers we're currently displaying
  const [counter, setCounter] = useState(0);
  // A map of marker IDs to their positions
  // Note that we use a ref because the globe's `onRender` callback
  // is called on every animation frame, and we don't want to re-render
  // the component on every frame.
  const positions = useRef<Map<string, { location: [number, number]; size: number }>>(new Map());

  // WebSocket接続を直接管理（@rivetkit/reactの依存関係を回避）
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // RivetのWebSocketエンドポイント: /rivet/{actorName}/{key}
    const wsUrl = `${protocol}//${window.location.host}/rivet/websocketServer/positions`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "add-marker" && message.position) {
          const pos: Position = message.position;
          positions.current?.set(pos.id, {
            location: [pos.lat, pos.lng],
            size: 0.05,
          });
          setCounter((c) => c + 1);
        } else if (message.type === "remove-marker" && message.id) {
          positions.current?.delete(message.id);
          setCounter((c) => c - 1);
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    // The angle of rotation of the globe
    // We'll update this on every frame to make the globe spin
    let phi = 0;

    const globe = createGlobe(canvasRef.current!, {
      devicePixelRatio: 2,
      width: 400 * 2,
      height: 400 * 2,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 0.8,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.3, 0.3, 0.3],
      markerColor: [0.8, 0.1, 0.1],
      glowColor: [0.2, 0.2, 0.2],
      markers: [],
      opacity: 0.7,
      onRender: (state) => {
        // Called on every animation frame.
        // `state` will be an empty object, return updated params.

        // Get the current positions from our map
        state.markers = [...(positions.current?.values() ?? [])];

        // Rotate the globe
        state.phi = phi;
        phi += 0.01;
      },
    });

    return () => {
      globe.destroy();
    };
  }, []);

  return (
    <>
      <p>Where's everyone at?</p>
      {counter !== 0 ? (
        <p>
          <b>{counter}</b> {counter === 1 ? "person" : "people"} connected.
        </p>
      ) : (
        <p>&nbsp;</p>
      )}

      {/* The canvas where we'll render the globe */}
      <canvas ref={canvasRef} className="h-100 w-100 max-w-full aspect-square mx-auto" />
    </>
  );
};
