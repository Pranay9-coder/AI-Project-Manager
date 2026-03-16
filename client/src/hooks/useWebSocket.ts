import React, { useEffect, useState, useCallback } from 'react';
import { WSEvent, wsService } from '../services/websocket';

export function useWebSocket(event: WSEvent, handler: (data: any) => void) {
  useEffect(() => {
    wsService.on(event, handler);
    return () => {
      wsService.off(event, handler);
    };
  }, [event, handler]);
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<
    Array<{ id: string; message: string; type: string; time: Date }>
  >([]);

  const addNotification = useCallback((message: string, type: string) => {
    const id = Date.now().toString();
    setNotifications((prev) => [
      { id, message, type, time: new Date() },
      ...prev.slice(0, 19),
    ]);

    // Auto-dismiss after 5s
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  }, []);

  useWebSocket(
    WSEvent.NEW_INVITATION,
    useCallback(
      (data: any) => {
        addNotification(
          `New invitation from team "${data.team?.team_name || 'Unknown'}"`,
          'invitation'
        );
      },
      [addNotification]
    )
  );

  useWebSocket(
    WSEvent.INVITATION_ACCEPTED,
    useCallback(
      () => {
        addNotification('A developer accepted your invitation!', 'success');
      },
      [addNotification]
    )
  );

  useWebSocket(
    WSEvent.NEW_TASK_ASSIGNED,
    useCallback(
      (data: any) => {
        addNotification(
          `New task assigned: "${data.tasks?.[0]?.title || data.task?.title || 'New Task'}"`,
          'task'
        );
      },
      [addNotification]
    )
  );

  useWebSocket(
    WSEvent.TASK_STATUS_UPDATED,
    useCallback(
      (data: any) => {
        addNotification(
          `Task "${data.task?.title}" status updated to ${data.task?.status}`,
          'update'
        );
      },
      [addNotification]
    )
  );

  return { notifications, addNotification };
}
