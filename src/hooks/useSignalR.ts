import { useEffect, useState, useCallback, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { API_BASE_URL } from '../api/http';

export function useSignalR(token: string | null, projectId: string | null) {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    if (!token) return;

    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/taskhub`, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);
    connectionRef.current = newConnection;

    const startConnection = async () => {
      try {
        await newConnection.start();
        setIsConnected(true);
        console.log('SignalR Connected.');
        
        if (projectId) {
          await newConnection.invoke('JoinProjectGroup', projectId);
          console.log(`Joined project group: ${projectId}`);
        }
      } catch (err) {
        console.error('SignalR Connection Error: ', err);
      }
    };

    startConnection();

    return () => {
      if (connectionRef.current) {
        if (projectId) {
          connectionRef.current.invoke('LeaveProjectGroup', projectId).catch(console.error);
        }
        connectionRef.current.stop();
        setIsConnected(false);
      }
    };
  }, [token, projectId]);

  const on = useCallback((eventName: string, callback: (...args: any[]) => void) => {
    if (connection) {
      connection.on(eventName, callback);
    }
  }, [connection]);

  const off = useCallback((eventName: string, callback: (...args: any[]) => void) => {
    if (connection) {
      connection.off(eventName, callback);
    }
  }, [connection]);

  return { isConnected, on, off, connection };
}
