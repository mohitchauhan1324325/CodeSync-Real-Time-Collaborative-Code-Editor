import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '../socket/socket';

export const useRoomSocket = ({
  roomId,
  user,
  onRemoteCodeChange,
  onRemoteLanguageChange,
}) => {
  const socketRef = useRef(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [remoteCursors, setRemoteCursors] = useState({});
  const [typingUsers, setTypingUsers] = useState([]);
  const [saveAlert, setSaveAlert] = useState(null);

  const isRemoteChangeRef = useRef(false);
  const lastCursorEmitRef = useRef(0);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!roomId || !user) return;

    const socket = getSocket();
    socketRef.current = socket;

    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
      setIsConnected(true);
      socket.emit('join-room', {
        roomId,
        user: {
          id: user.id || user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        },
      });
    };

    const handleRoomState = (state) => {
      if (state.currentUser) {
        setCurrentUser(state.currentUser);
      }
      if (state.activeUsers) {
        setActiveUsers(state.activeUsers);
      }
      if (state.code !== undefined && onRemoteCodeChange) {
        isRemoteChangeRef.current = true;
        onRemoteCodeChange(state.code);
        setTimeout(() => {
          isRemoteChangeRef.current = false;
        }, 50);
      }
      if (state.language && onRemoteLanguageChange) {
        onRemoteLanguageChange(state.language);
      }
    };

    const handleUserJoined = (data) => {
      if (data.activeUsers) {
        setActiveUsers(data.activeUsers);
      }
    };

    const handleUserLeft = (data) => {
      if (data.activeUsers) {
        setActiveUsers(data.activeUsers);
      }
      if (data.socketId) {
        setRemoteCursors((prev) => {
          const updated = { ...prev };
          delete updated[data.socketId];
          return updated;
        });
        setTypingUsers((prev) => prev.filter((u) => u.socketId !== data.socketId));
      }
    };

    const handleSyncCode = (data) => {
      if (data.code !== undefined && onRemoteCodeChange) {
        isRemoteChangeRef.current = true;
        onRemoteCodeChange(data.code);
        setTimeout(() => {
          isRemoteChangeRef.current = false;
        }, 50);
      }
    };

    const handleLanguageUpdate = (data) => {
      if (data.language && onRemoteLanguageChange) {
        onRemoteLanguageChange(data.language);
      }
    };

    const handleCursorUpdate = (data) => {
      if (!data.socketId || !data.position) return;
      setRemoteCursors((prev) => ({
        ...prev,
        [data.socketId]: {
          socketId: data.socketId,
          user: data.user,
          position: data.position,
          selection: data.selection,
          updatedAt: Date.now(),
        },
      }));
    };

    const handleUserTyping = (data) => {
      if (!data.socketId || !data.user) return;
      if (data.isTyping) {
        setTypingUsers((prev) => {
          if (prev.some((u) => u.socketId === data.socketId)) return prev;
          return [...prev, { socketId: data.socketId, name: data.user.name }];
        });
      } else {
        setTypingUsers((prev) => prev.filter((u) => u.socketId !== data.socketId));
      }
    };

    const handleCodeSavedAlert = (data) => {
      setSaveAlert(data);
      setTimeout(() => setSaveAlert(null), 4000);
    };

    socket.on('connect', handleConnect);
    socket.on('room-state', handleRoomState);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('sync-code', handleSyncCode);
    socket.on('language-update', handleLanguageUpdate);
    socket.on('cursor-update', handleCursorUpdate);
    socket.on('user-typing', handleUserTyping);
    socket.on('code-saved-alert', handleCodeSavedAlert);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.emit('leave-room', { roomId });
      socket.off('connect', handleConnect);
      socket.off('room-state', handleRoomState);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('sync-code', handleSyncCode);
      socket.off('language-update', handleLanguageUpdate);
      socket.off('cursor-update', handleCursorUpdate);
      socket.off('user-typing', handleUserTyping);
      socket.off('code-saved-alert', handleCodeSavedAlert);
    };
  }, [roomId, user, onRemoteCodeChange, onRemoteLanguageChange]);

  const emitCodeChange = useCallback(
    (newCode) => {
      if (isRemoteChangeRef.current) return;
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('code-change', {
          roomId,
          code: newCode,
        });

        socketRef.current.emit('typing-start', { roomId });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('typing-stop', { roomId });
          }
        }, 1500);
      }
    },
    [roomId]
  );

  const emitLanguageChange = useCallback(
    (newLanguage) => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('language-change', {
          roomId,
          language: newLanguage,
        });
      }
    },
    [roomId]
  );

  const emitCursorChange = useCallback(
    (position, selection) => {
      const now = Date.now();
      if (now - lastCursorEmitRef.current < 50) return;
      lastCursorEmitRef.current = now;

      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('cursor-change', {
          roomId,
          position,
          selection,
        });
      }
    },
    [roomId]
  );

  const emitCodeSaved = useCallback(
    (versionTitle, savedByName) => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('code-saved', {
          roomId,
          versionTitle,
          savedBy: savedByName,
        });
      }
    },
    [roomId]
  );

  return {
    socket: socketRef.current,
    activeUsers,
    currentUser,
    isConnected,
    remoteCursors,
    typingUsers,
    saveAlert,
    emitCodeChange,
    emitLanguageChange,
    emitCursorChange,
    emitCodeSaved,
  };
};
