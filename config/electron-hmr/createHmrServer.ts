import { Socket } from 'net';
import * as RootIPC from 'node-ipc';
import { Stats } from 'webpack';

import { Logger } from '../devLogger';
import { HmrServer, ConnectionStatus } from './types';

export default function createHmrServer(logger: Logger): HmrServer {
  const ipc = new RootIPC.IPC();

  const appspace = 'electron';
  const id = `main-ipc-${process.pid.toString(16)}`;
  const path = `${ipc.config.socketRoot}${appspace}-${id}.sock`;
  ipc.config.appspace = appspace;
  ipc.config.id = id;
  ipc.config.logger = logger.log.bind(logger, '[IPC-SERVER]');

  let connectedSockets: Socket[] = [];
  let connectionStatus: ConnectionStatus = ConnectionStatus.Offline;
  let compiled = false;

  function removeSocket(socket: Socket) {
    const index = connectedSockets.indexOf(socket);
    if (index !== -1) {
      connectedSockets.splice(index, 1);
    }
  }

  const hmrServer = {
    isListening: function () {
      return connectionStatus === ConnectionStatus.Connected;
    },
    onBeforeCompile: function () {
      compiled = false;
    },
    onCompiled: function (stats: Stats) {
      compiled = true;
      setImmediate(() => {
        if (!compiled) {
          return;
        }
        const hash = stats.toJson({
          assets: false,
          chunks: false,
          children: false,
          modules: false,
        }).hash;

        ipc.log('Dispatch compiled...');

        let removeSockets = [];
        for (let i = 0; i < connectedSockets.length; i += 1) {
          const socket = connectedSockets[i];
          if (!socket.destroyed) {
            ipc.server.emit(socket, 'compiled', hash);
          } else {
            removeSockets.push(socket);
          }
        }
        while (removeSockets.length > 0) {
          const socket = removeSockets.pop();
          removeSocket(socket);
        }
      });
    },
    close: function () {
      if (connectionStatus !== ConnectionStatus.Offline) {
        ipc.server.stop();
        connectionStatus = ConnectionStatus.Offline;
      }
    },
    listen: function () {
      if (this.isListening()) {
        ipc.log('HmrServer is already listening.');
        return Promise.resolve(this);
      }

      if (connectionStatus === ConnectionStatus.Connecting) {
        ipc.log('HmrServer is connecting...');
        return Promise.resolve(this);
      }

      return new Promise((resolve, reject) => {
        try {
          connectionStatus = ConnectionStatus.Connecting;
          ipc.serve(path, () => {
            ipc.server.on('connect', (socket: Socket) => {
              if (connectedSockets.indexOf(socket) === -1) {
                connectedSockets.push(socket);

                socket.on('close', () => {
                  removeSocket(socket);
                });
              }
            });

            ipc.server.on('error', (error: Error) => {
              logger.error('[IPC-SERVER] Server Error:', error);
            });

            ipc.server.on('socket.disconnect', (socket, destroyedSocketID) => {
              removeSocket(socket);
              ipc.log(`[IPC] Socket ${destroyedSocketID} has disconnected!`);
            });

            connectionStatus = ConnectionStatus.Connected;
            resolve(this);
          });
          ipc.server.start();
        } catch (e) {
          reject(e);
        }
      });
    },
  };

  Object.defineProperty(hmrServer, 'socketPath', {
    value: path,
    writable: false,
  });

  Object.defineProperty(hmrServer, 'socketId', {
    value: id,
    writable: false,
  });

  Object.defineProperty(hmrServer, 'ipc', {
    value: ipc,
    writable: false,
  });

  return hmrServer as HmrServer;
}
