import AsyncStorage from '@react-native-async-storage/async-storage';

let Notifications = null;

const loadNotifications = async () => {
  if (!Notifications) {
    try {
      Notifications = await import('expo-notifications');
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
    } catch { return null; }
  }
  return Notifications;
};

const TIPS = [
  'yesterday / last week / ago تدل على الماضي البسيط دائماً',
  'شفته وهو يحدث = ماضي مستمر 👀',
  'خلص قبل حدث آخر = ماضي تام 👻',
  'every day / always / usually = مضارع بسيط',
  'now / right now / these days = مضارع مستمر',
  'just / already / ever / never = مضارع تام',
  'will = قرار فجأي | going to = مخطط مسبقاً',
  'is/am/are لا تحتاج s — هي تصريف be الخاص',
];

class NotificationService {
  async requestPermissions() {
    try {
      const N = await loadNotifications();
      if (!N) return false;
      const { isDevice } = await import('expo-device');
      if (!isDevice) return false;
      const { status: cur } = await N.getPermissionsAsync();
      if (cur === 'granted') return true;
      const { status } = await N.requestPermissionsAsync();
      return status === 'granted';
    } catch { return false; }
  }

  async scheduleReminder(hour = 18, minute = 0) {
    try {
      const N = await loadNotifications();
      if (!N) return null;
      await this.cancelReminder();
      const tip = TIPS[new Date().getDay() % TIPS.length];
      const id = await N.scheduleNotificationAsync({
        content: {
          title: '🎓 وقت التعلم!',
          body: '💡 ' + tip,
          sound: true,
        },
        trigger: {
          type: N.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
      await AsyncStorage.setItem('reminder_id', id);
      await AsyncStorage.setItem('reminder_hour', hour.toString());
      await AsyncStorage.setItem('reminder_min', minute.toString());
      await AsyncStorage.setItem('notif_on', 'true');
      return id;
    } catch { return null; }
  }

  async cancelReminder() {
    try {
      const N = await loadNotifications();
      const id = await AsyncStorage.getItem('reminder_id');
      if (N && id) await N.cancelScheduledNotificationAsync(id);
    } catch {}
    await AsyncStorage.setItem('notif_on', 'false');
  }

  async sendAchievement(ach) {
    try {
      const N = await loadNotifications();
      if (!N) return;
      await N.scheduleNotificationAsync({
        content: {
          title: `🏆 ${ach.emoji} ${ach.title}`,
          body: ach.desc,
          sound: true,
        },
        trigger: null,
      });
    } catch {}
  }

  async getSettings() {
    return {
      on:     (await AsyncStorage.getItem('notif_on'))       === 'true',
      hour:   parseInt(await AsyncStorage.getItem('reminder_hour') || '18'),
      minute: parseInt(await AsyncStorage.getItem('reminder_min')  || '0'),
    };
  }

  onTap(cb) {
    try {
      const N = require('expo-notifications');
      return N.addNotificationResponseReceivedListener(cb);
    } catch { return { remove: () => {} }; }
  }
}

export default new NotificationService();
