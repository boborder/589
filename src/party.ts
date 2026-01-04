import type { Connection, ConnectionContext } from 'partyserver';
import { Server } from 'partyserver';
import { Scheduler } from "partywhen";
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
            type: "add-marker",
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            position: connection.state?.position,
          })
        );

        // And let's send the new connection's position to all other connections
        if (connection.id !== conn.id) {
          connection.send(
            JSON.stringify({
              type: "add-marker",
              position,
            })
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
        type: "remove-marker",
        id: connection.id,
      } satisfies OutgoingMessage),
      [connection.id]
    );
  }

  onClose(connection: Connection): void | Promise<void> {
    this.onCloseOrError(connection);
  }

  onError(connection: Connection): void | Promise<void> {
    this.onCloseOrError(connection);
  }
}


/**
 * カスタムSchedulerクラス
 * PartywhenのSchedulerを継承して、タスク管理機能を実装
 */
export class PartyScheduler extends Scheduler {
  constructor(ctx: DurableObjectState, env: Cloudflare.Env) {
    super(ctx, env);
    // 初期化時にタスクをスケジュールする場合は、ここで実行
    // 注意: コンストラクタ内で非同期処理を実行する場合は、適切に処理する
    this.initializeTasks().catch((error) => {
      console.error('Failed to initialize tasks:', error);
    });
  }

  /**
   * 初期化時にタスクをスケジュール
   */
  private async initializeTasks(): Promise<void> {
    // 例: 定期的なタスクをスケジュール
    await this.scheduleTask({
      id: 'periodic-task',
      description: 'Periodic task example',
      type: 'delayed',
      delayInSeconds: 120,
      callback: {
        type: 'self',
        function: 'onSchedule',
      },
    });
  }

  /**
   * WebSocket接続時の処理
   * WebSocket経由でタスクをスケジュールできるようにする
   */
  onConnect(conn: Connection) {
    // 接続時に現在のタスク一覧を送信
    const result = this.getAllTasks();
    if (result.status === 200 && result.result) {
      conn.send(
        JSON.stringify({
          type: 'tasks',
          tasks: result.result,
        }),
      );
    }
  }

  /**
   * メッセージ受信時の処理
   * WebSocket経由でタスクをスケジュール・管理できるようにする
   */
  onMessage(conn: Connection, message: string | ArrayBuffer) {
    try {
      const data = JSON.parse(message.toString());

      switch (data.type) {
        case 'schedule-task': {
          // タスクをスケジュール
          this.scheduleTask({
            id:
              data.id ||
              `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            description: data.description,
            type: data.taskType || 'delayed',
            delayInSeconds: data.delayInSeconds,
            cron: data.cron,
            time: data.time ? new Date(data.time) : undefined,
            payload: data.payload,
            callback: data.callback || {
              type: 'self',
              function: 'onSchedule',
            },
          }).then((task) => {
            conn.send(
              JSON.stringify({
                type: 'task-scheduled',
                task,
              }),
            );
          });
          break;
        }

        case 'query-tasks': {
          // タスクをクエリ
          this.query(data.criteria).then((tasks) => {
            conn.send(
              JSON.stringify({
                type: 'tasks',
                tasks,
              }),
            );
          });
          break;
        }

        case 'cancel-task': {
          // タスクをキャンセル
          const cancelled = this.cancelTask(data.id);
          conn.send(
            JSON.stringify({
              type: 'task-cancelled',
              id: data.id,
              cancelled,
            }),
          );
          break;
        }

        case 'get-all-tasks': {
          // 全タスクを取得
          const result = this.getAllTasks();
          conn.send(
            JSON.stringify({
              type: 'all-tasks',
              result,
            }),
          );
          break;
        }

        default:
          conn.send(
            JSON.stringify({
              type: 'error',
              message: `Unknown message type: ${data.type}`,
            }),
          );
      }
    } catch (error) {
      conn.send(
        JSON.stringify({
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  }

  /**
   * タスク実行時のコールバック
   * callback.type: "self" の場合、この関数が呼ばれる
   */
  onSchedule(payload?: Record<string, unknown>) {
    console.log('Task executed:', payload);

    // タスク実行時の処理を実装
    // 例: ブロードキャスト、データベース更新、外部API呼び出しなど

    // 全接続に通知
    this.broadcast(
      JSON.stringify({
        type: 'task-executed',
        payload,
        timestamp: new Date().toISOString(),
      }),
    );

    // 例: 繰り返し実行するタスクの場合
    // if (payload?.repeat) {
    //   await this.scheduleTask({
    //     id: `task-${Date.now()}`,
    //     description: payload.description as string,
    //     type: "delayed",
    //     delayInSeconds: payload.delayInSeconds as number,
    //     payload: payload,
    //     callback: {
    //       type: "self",
    //       function: "onSchedule",
    //     },
    //   });
    // }
  }
}
