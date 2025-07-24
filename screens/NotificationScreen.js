import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useNotification } from './AuthContext';
import Feather from 'react-native-vector-icons/Feather';
import { Swipeable } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

function formatTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function NotificationScreen({ navigation }) {
  const { theme } = useTheme();
  const { notifications, markAllRead, deleteNotification, clearAllNotifications } = useNotification();

  React.useEffect(() => {
    markAllRead();
  }, []);

  const renderRightActions = (id) => (
    <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteNotification(id)}>
      <Feather name="trash-2" size={20} color="#fff" />
    </TouchableOpacity>
  );

  const DEEP_BLUE_GRADIENT = ['#0a0f1c', '#12203a', '#1a2a4f'];

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={DEEP_BLUE_GRADIENT} style={StyleSheet.absoluteFill} />
      <View style={[styles.container, { backgroundColor: 'transparent' }]}> 
        <Text style={[styles.header, { color: theme.primary, fontFamily: 'Inter_700Bold' }]}>Notifications</Text>
        <FlatList
          data={notifications}
          keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
          renderItem={({ item }) => (
            <Swipeable
              renderRightActions={() => renderRightActions(item.id)}
              overshootRight={false}
            >
              <BlurView intensity={90} tint="dark" style={styles.notificationGlass}>
                <View style={styles.row}>
                  <Feather name={item.icon || 'info'} size={22} color={item.type === 'success' ? '#059669' : item.type === 'error' ? '#dc2626' : theme.primary} style={{ marginRight: 10 }} />
                  <Text style={[styles.message, { color: theme.text, fontFamily: 'Inter_700Bold' }]}>{item.message}</Text>
                  {!item.read && <View style={styles.blueTick} />}
                </View>
                <View style={styles.metaRow}>
                  <Text style={[styles.type, { color: item.type === 'success' ? '#059669' : item.type === 'error' ? '#dc2626' : theme.primary, fontFamily: 'Inter_700Bold' }]}>{item.type}</Text>
                  <Text style={[styles.time, { color: theme.textSecondary, fontFamily: 'Inter_700Bold' }]}>{formatTime(item.timestamp)}</Text>
                </View>
              </BlurView>
            </Swipeable>
          )}
          ListEmptyComponent={<Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 40, fontFamily: 'Inter_400Regular' }}>No notifications yet.</Text>}
          contentContainerStyle={{ flexGrow: 1 }}
        />
        {notifications.length > 0 ? (
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 18, marginTop: 18 }}>
            <BlurView intensity={70} tint="dark" style={{ borderRadius: 22, overflow: 'hidden' }}>
              <TouchableOpacity style={[styles.clearAllBtnGlass, { marginTop: 0 }]} onPress={clearAllNotifications} activeOpacity={0.85}>
                <Feather name="trash-2" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={{ color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 16 }}>Clear All</Text>
              </TouchableOpacity>
            </BlurView>
            <BlurView intensity={70} tint="dark" style={{ borderRadius: 22, overflow: 'hidden' }}>
              <TouchableOpacity style={[styles.closeBtnGlass, { marginTop: 0 }]} onPress={() => navigation.goBack()} activeOpacity={0.85}>
                <Text style={{ color: theme.primary, fontFamily: 'Inter_700Bold', fontSize: 16 }}>Close</Text>
              </TouchableOpacity>
            </BlurView>
          </View>
        ) : (
          <BlurView intensity={70} tint="dark" style={{ borderRadius: 22, overflow: 'hidden', alignSelf: 'center', marginTop: 18 }}>
            <TouchableOpacity style={[styles.closeBtnGlass, { marginTop: 0 }]} onPress={() => navigation.goBack()} activeOpacity={0.85}>
              <Text style={{ color: theme.primary, fontFamily: 'Inter_700Bold', fontSize: 16 }}>Close</Text>
            </TouchableOpacity>
          </BlurView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 18, textAlign: 'center' },
  notification: { borderRadius: 14, padding: 16, marginBottom: 14, shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  message: { fontSize: 16, flex: 1 },
  blueTick: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#2563eb', marginLeft: 10 },
  type: { fontSize: 13, fontWeight: 'bold', textTransform: 'capitalize' },
  time: { fontSize: 12, marginLeft: 10 },
  closeBtn: { alignSelf: 'center', marginTop: 18, padding: 10 },
  deleteBtn: { backgroundColor: '#dc2626', justifyContent: 'center', alignItems: 'center', width: 60, height: '90%', borderRadius: 10, marginVertical: 6 },
  clearAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#dc2626', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 24, alignSelf: 'center', marginTop: 8 },
  notificationGlass: {
    borderRadius: 18,
    marginBottom: 14,
    padding: 16,
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    backgroundColor: 'rgba(20,40,80,0.32)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
  clearAllBtnGlass: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignSelf: 'center',
    marginTop: 8,
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  closeBtnGlass: {
    alignSelf: 'center',
    marginTop: 18,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
}); 