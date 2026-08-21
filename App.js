import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, ScrollView, BackHandler } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import StorageService from './src/services/StorageService';
import GeminiService from './src/services/GeminiService';
import SetupScreen from './src/screens/SetupScreen';
import HomeScreen from './src/screens/HomeScreen';
import ChatScreen from './src/screens/ChatScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import NotifScreen from './src/screens/NotificationsScreen';

const SC = { LOAD:'load', SETUP:'setup', HOME:'home', CHAT:'chat', SETTINGS:'settings', REPORTS:'reports', NOTIF:'notif' };

export default function App() {
  const [screen, setScreen] = useState(SC.LOAD);
  const [mode,   setMode]   = useState(null);
  const [tense,  setTense]  = useState(null);
  const [banner, setBanner] = useState(null);
  const [fatal,  setFatal]  = useState(null);

  useEffect(() => {
    // أي خطأ JS (حتى غير المتزامن) يظهر على الشاشة بدل إغلاق التطبيق
    try {
      if (global.ErrorUtils && global.ErrorUtils.setGlobalHandler) {
        global.ErrorUtils.setGlobalHandler((e, isFatal) => {
          setFatal(String(e && e.message ? e.message : e));
        });
      }
    } catch {}
    init();
  }, []);

  const init = async () => {
    try {
      const key = await StorageService.getKey();
      if (!key) { setScreen(SC.SETUP); return; }
      GeminiService.setApiKey(key);
      try { const m = await StorageService.getModel(); if (m) GeminiService.setModel(m); } catch {}
      try { await StorageService.updateStreak(); } catch {}
      try { await StorageService.addSession(); } catch {}
      try {
        const ach = await StorageService.checkAchievements();
        if (ach.length > 0) { setBanner(ach[0]); setTimeout(() => setBanner(null), 3000); }
      } catch {}
      setScreen(SC.HOME);
    } catch {
      setScreen(SC.SETUP);
    }
  };

  const goChat = (m = null, t = null) => { setMode(m); setTense(t); setScreen(SC.CHAT); };

  // زر الرجوع الفعلي في الهاتف (أو إيماءة الرجوع) يجب أن يتنقّل داخل التطبيق
  // أولاً، وألا يُغلق التطبيق إلا عندما نكون فعلاً في الشاشة الرئيسية.
  useEffect(() => {
    const onHardwareBack = () => {
      switch (screen) {
        case SC.CHAT:     setScreen(SC.HOME);     return true;
        case SC.SETTINGS: setScreen(SC.HOME);     return true;
        case SC.REPORTS:  setScreen(SC.HOME);     return true;
        case SC.NOTIF:    setScreen(SC.SETTINGS); return true;
        default:          return false; // HOME / SETUP / LOAD → السماح للنظام بإغلاق التطبيق
      }
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  }, [screen]);

  if (fatal) return (
    <SafeAreaProvider>
      <View style={S.errWrap}>
        <Text style={S.errEmoji}>⚠️</Text>
        <Text style={S.errTitle}>حدث خطأ — هذه رسالته بالضبط</Text>
        <ScrollView style={{maxHeight:200, marginBottom:16}}>
          <Text style={S.errMsg}>{fatal}</Text>
        </ScrollView>
        <Text style={S.errHint}>انسخ هذا النص وأرسله لي</Text>
        <TouchableOpacity style={S.errBtn} onPress={() => { setFatal(null); init(); }}>
          <Text style={S.errBtnText}>إعادة المحاولة</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaProvider>
  );

  if (screen === SC.LOAD) return (
    <SafeAreaProvider>
      <View style={S.loading}>
        <Text style={S.logo}>🎓</Text>
        <ActivityIndicator color="#6366F1" size="large" style={{marginTop:20}} />
      </View>
    </SafeAreaProvider>
  );

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        {!!banner && <AchievementBanner banner={banner} />}
        {screen === SC.SETUP    && <SetupScreen onDone={init} />}
        {screen === SC.HOME     && <HomeScreen onMode={m => goChat(m)} onTense={t => goChat(null, t)} onSettings={() => setScreen(SC.SETTINGS)} onReports={() => setScreen(SC.REPORTS)} />}
        {screen === SC.CHAT     && <ChatScreen mode={mode} tense={tense} onBack={() => setScreen(SC.HOME)} />}
        {screen === SC.SETTINGS && <SettingsScreen onBack={() => setScreen(SC.HOME)} onReset={() => setScreen(SC.SETUP)} onNotifications={() => setScreen(SC.NOTIF)} />}
        {screen === SC.REPORTS  && <ReportsScreen onBack={() => setScreen(SC.HOME)} />}
        {screen === SC.NOTIF    && <NotifScreen onBack={() => setScreen(SC.SETTINGS)} />}
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

// شارة الإنجاز تُحسب من أعلى المنطقة الآمنة فعلياً (لا تصطدم بالساعة/الشحن
// أو بشريط الحالة على أجهزة Android الحديثة ذات وضع edge-to-edge).
function AchievementBanner({ banner }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[S.banner, { top: insets.top + 10 }]}>
      <Text style={S.bannerText}>{banner.emoji} {banner.title} — {banner.desc}</Text>
    </View>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.log('[ErrorBoundary]', error, info); }
  render() {
    if (this.state.error) {
      return (
        <View style={S.errWrap}>
          <Text style={S.errEmoji}>⚠️</Text>
          <Text style={S.errTitle}>حدث خطأ غير متوقع</Text>
          <ScrollView style={{maxHeight:200, marginBottom:16}}>
            <Text style={S.errMsg}>{String(this.state.error.message || this.state.error)}</Text>
          </ScrollView>
          <TouchableOpacity style={S.errBtn} onPress={() => this.setState({ error: null })}>
            <Text style={S.errBtnText}>محاولة العودة</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const S = StyleSheet.create({
  loading:    { flex:1, backgroundColor:'#0A0E1A', alignItems:'center', justifyContent:'center' },
  logo:       { fontSize:72 },
  banner:     { position:'absolute', left:16, right:16, zIndex:999, backgroundColor:'#F59E0B', borderRadius:14, padding:14, alignItems:'center', elevation:10 },
  bannerText: { color:'#0A0E1A', fontWeight:'800', fontSize:14, textAlign:'center' },
  errWrap:    { flex:1, backgroundColor:'#0A0E1A', alignItems:'center', justifyContent:'center', padding:24 },
  errEmoji:   { fontSize:56, marginBottom:12 },
  errTitle:   { color:'#F87171', fontSize:18, fontWeight:'800', marginBottom:12, textAlign:'center' },
  errMsg:     { color:'#F1F5F9', fontSize:13, textAlign:'center', marginBottom:16, lineHeight:20 },
  errHint:    { color:'#64748B', fontSize:12, marginBottom:20 },
  errBtn:     { backgroundColor:'#6366F1', borderRadius:12, paddingHorizontal:24, paddingVertical:12 },
  errBtnText: { color:'white', fontSize:15, fontWeight:'700' },
});
