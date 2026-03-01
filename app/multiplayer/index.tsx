import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, KeyboardAvoidingView, Platform, Text, Pressable, ActivityIndicator, TouchableOpacity, AppState, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { multiplayerService } from '../../services/MultiplayerService';
import { presenceService, PresenceUser, IncomingInvite } from '../../services/PresenceService';
import { useTranslation } from 'react-i18next';
import { SafeAreaLinearGradient } from '@/components/SafeAreaGradient';

const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    const { Alert } = require('react-native');
    Alert.alert(title, message);
  }
};

export default function MultiplayerHome() {
  const router = useRouter();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);
  const [incomingInvites, setIncomingInvites] = useState<IncomingInvite[]>([]);
  const [isConnectedToLobby, setIsConnectedToLobby] = useState(false);

  // Generate a random PeerJS ID for the lobby if we don't have one
  const [myLobbyId] = useState(() => Math.random().toString(36).substring(2, 10));

  // Clean up any stale connections on mount
  useEffect(() => {
    multiplayerService.destroy();

    // Subscribe to presence
    const onUsers = (users: PresenceUser[]) => setActiveUsers(users);
    const onInvite = (invite: IncomingInvite) => setIncomingInvites(prev => [...prev, invite]);

    presenceService.onUsersChange(onUsers);
    presenceService.onInviteReceived(onInvite);

    return () => {
      presenceService.offUsersChange(onUsers);
      presenceService.offInviteReceived(onInvite);
      presenceService.disconnect();
    };
  }, []);

  // Connect to lobby when name is entered (debounced or on blur is better, but this is simple)
  useEffect(() => {
    if (name.trim().length > 2) {
      if (!isConnectedToLobby) {
        presenceService.connect(myLobbyId, name);
        setIsConnectedToLobby(true);
      } else {
        presenceService.updateName(name);
      }
    } else if (isConnectedToLobby) {
      presenceService.disconnect();
      setIsConnectedToLobby(false);
    }
  }, [name, isConnectedToLobby, myLobbyId]);

  // Handle visibility transitions (Adaptive Polling)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && isConnectedToLobby) {
        // Resume heavy polling
        presenceService.startPolling();
      } else if (nextAppState.match(/inactive|background/) && isConnectedToLobby) {
        // Stop polling to save Serverless bandwidth
        presenceService.stopPolling();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Web fallback
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isConnectedToLobby) {
        presenceService.startPolling();
      } else {
        presenceService.stopPolling();
      }
    };
    if (Platform.OS === 'web') {
      document.addEventListener('visibilitychange', handleVisibility);
    }

    return () => {
      subscription.remove();
      if (Platform.OS === 'web') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
    };
  }, [isConnectedToLobby]);

  const handleCreateRoom = async () => {
    if (!name.trim()) {
      showAlert('Required', 'Please enter your name');
      return;
    }

    try {
      setIsCreating(true);
      const code = await multiplayerService.createRoom(name);
      if (code) {
        // @ts-ignore: router.push type mismatch
        router.push(`/multiplayer/${code}?name=${encodeURIComponent(name)}&isHost=true`);
      } else {
        showAlert('Error', 'Failed to create room. Please try again.');
      }
    } catch (error) {
      console.error(error);
      showAlert('Error', 'Something went wrong');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async (codeToJoin: string) => {
    if (!name.trim() || !codeToJoin.trim()) {
      showAlert('Required', 'Please enter your name');
      return;
    }

    try {
      setIsJoining(true);
      const response = await multiplayerService.joinRoom(codeToJoin, name);
      if (response.success) {
        // Need to stop presence polling when jumping into game
        presenceService.disconnect();
        // @ts-ignore: router.push type mismatch
        router.push(`/multiplayer/${codeToJoin}?name=${encodeURIComponent(name)}&isHost=false`);
      } else {
        showAlert('Error', 'Failed to join room. Check the code and try again.');
      }
    } catch (error) {
      console.error(error);
      showAlert('Error', 'Could not join room');
    } finally {
      setIsJoining(false);
    }
  };

  const handleInvitePlayer = async (targetPeerId: string) => {
    try {
      // 1. Host creates a room implicitly behind the scenes
      setIsCreating(true);
      const code = await multiplayerService.createRoom(name);
      if (code) {
        // 2. Send the invite via Serverless Presence
        await presenceService.sendInvite(targetPeerId, code);

        // 3. Jump to waiting room
        presenceService.disconnect();
        // @ts-ignore
        router.push(`/multiplayer/${code}?name=${encodeURIComponent(name)}&isHost=true`);
      } else {
        showAlert('Error', 'Failed to start game for invite.');
      }
    } catch (e) {
      console.error(e);
      showAlert('Error', 'Failed to send invite');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAcceptInvite = async (invite: IncomingInvite) => {
    await presenceService.removeInvite(invite.roomId);
    handleJoinRoom(invite.roomId);
  };

  const handleRejectInvite = async (invite: IncomingInvite) => {
    await presenceService.removeInvite(invite.roomId);
    setIncomingInvites(prev => prev.filter(i => i.roomId !== invite.roomId));
  };

  return (
    <View style={styles.outerContainer}>
      <SafeAreaLinearGradient
        colors={['rgb(63, 82, 108)', 'rgb(29, 40, 54)']}
        style={styles.safeArea}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.contentContainer}>
            <Text style={styles.title}>⚔️ Multiplayer Quiz</Text>

            <View style={styles.card}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Your Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor="rgba(255,255,255,0.4)"
                />
              </View>

              <TouchableOpacity
                onPress={handleCreateRoom}
                disabled={isJoining || isCreating}
                style={[styles.button, styles.createBtn, (isJoining || isCreating) && styles.disabledBtn]}
              >
                {isCreating ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>🚀 Create New Game</Text>
                )}
              </TouchableOpacity>
            </View>


            {/* INCOMING INVITES SECTION */}
            {incomingInvites.length > 0 && (
              <View style={[styles.card, { borderColor: 'rgb(52, 211, 153)', borderWidth: 2 }]}>
                <Text style={[styles.label, { color: 'rgb(52, 211, 153)' }]}>📬 Incoming Invites</Text>
                {incomingInvites.map(invite => (
                  <View key={invite.roomId} style={styles.inviteRow}>
                    <Text style={styles.inviteText}>{invite.fromName} invited you!</Text>
                    <View style={styles.inviteActions}>
                      <TouchableOpacity onPress={() => handleAcceptInvite(invite)} style={[styles.actionBtn, styles.acceptBtn]}>
                        <Text style={styles.actionBtnText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleRejectInvite(invite)} style={[styles.actionBtn, styles.rejectBtn]}>
                        <Text style={styles.actionBtnText}>Decline</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* ACTIVE PLAYERS SECTION */}
            <View style={styles.card}>
              <View style={styles.headerRow}>
                <Text style={styles.label}>🟢 Active Players in Lobby</Text>
                {isConnectedToLobby && <ActivityIndicator size="small" color="rgba(255,255,255,0.5)" />}
              </View>

              {!isConnectedToLobby ? (
                <Text style={styles.emptyText}>Enter your name above to enter the lobby and see who is online.</Text>
              ) : activeUsers.length === 0 ? (
                <Text style={styles.emptyText}>No one else is online right now. Waiting for players...</Text>
              ) : (
                <ScrollView style={{ maxHeight: 200 }}>
                  {activeUsers.map(user => (
                    <View key={user.peerId} style={styles.userRow}>
                      <Text style={styles.userName}>{user.name}</Text>
                      <TouchableOpacity
                        style={[styles.inviteSmallBtn, user.roomCode ? { backgroundColor: 'rgb(46, 150, 194)' } : undefined]}
                        onPress={() => user.roomCode ? handleJoinRoom(user.roomCode) : handleInvitePlayer(user.peerId)}
                        disabled={isCreating}
                      >
                        <Text style={styles.inviteSmallBtnText}>{user.roomCode ? 'Join' : 'Invite'}</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ position: 'absolute', left: 20, top: 20, zIndex: 10 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="arrow-back" size={30} color="white" />
          </View>
        </TouchableOpacity>
      </SafeAreaLinearGradient>
    </View >
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  safeArea: {
    flex: 1,
    maxWidth: 550,
    width: '100%',
    borderLeftColor: 'rgb(129, 129, 129)',
    borderRightColor: 'rgb(141, 141, 141)',
    borderTopColor: 'rgb(26, 26, 26)',
    borderBottomColor: 'rgb(26, 26, 26)',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    color: 'white',
    fontSize: 30,
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '700',
  },
  formGroup: {
    marginBottom: 20,
    width: '100%',
  },
  label: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    color: 'white',
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    width: '100%',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 10,
    width: '100%',
  },
  orContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  orText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: 'bold',
    fontSize: 14,
  },
  button: {
    backgroundColor: 'rgb(46, 150, 194)',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  createBtn: {
    backgroundColor: 'rgb(52, 211, 153)',
  },
  joinBtn: {
    backgroundColor: 'rgb(46, 150, 194)',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 10,
  },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  userName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  inviteSmallBtn: {
    backgroundColor: 'rgb(52, 211, 153)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  inviteSmallBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  inviteRow: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  inviteText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  inviteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  actionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acceptBtn: {
    backgroundColor: 'rgb(52, 211, 153)',
  },
  rejectBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  actionBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
