import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import NotificationService from '../services/NotificationService';

const HOURS   = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

export default function NotificationsScreen({ onBack }) {
  const [on,     setOn]     = useState(false);
  const [hour,   setHour]   = useState(18);
  const [minute, setMinute] = useState(0);
  const [saved,  setSaved]  = useState(false);

  useEffect(() => {
    NotificationService.getSettings().then(s => { setOn(s.on); setHour(s.hour); setMinute(s.minute); });
  }, []);

  const toggle = async (val) => {
    if (val) {
      const ok = await NotificationService.requestPermissions();
      if (!ok) { Alert.alert('تنبيه', 'يرجى السماح بالإشعارات من إعدادات الهاتف'); return; }
      await NotificationService.scheduleReminder(hour, minute);
    } else {
      await NotificationService.cancelReminder();
    }
    setOn(val);
  };

  const save = async () => {
    if (on) {
      await NotificationService.scheduleReminder(hour, minute);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const fmt = (h, m) => {
    const p = h >= 12 ? 'م' : 'ص';
    const d = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${d}:${m.toString().padStart(2,'0')} ${p}`;
  };

  return (
    <View style={S.container}>
      <LinearGradient colors={['#12172B','#0A0E1A']} style={S.header}>
        <TouchableOpacity onPress={onBack} style={S.back}><Text style={S.backText}>← رجوع</Text></TouchableOpacity>
        <Text style={S.title}>🔔 الإشعارات</Text>
        <View style={{width:60}} />
      </LinearGradient>

      <ScrollView contentContainerStyle={S.content}>
        <View style={S.card}>
          <View style={S.toggleRow}>
            <Switch value={on} onValueChange={toggle} trackColor={{false:'#2D3A5C',true:'#6366F1'}} thumbColor={on?'#fff':'#475569'} />
            <View style={S.toggleInfo}>
              <Text style={S.toggleTitle}>تذكير يومي للتعلم</Text>
              <Text style={S.toggleSub}>نصيحة جديدة كل يوم</Text>
            </View>
          </View>
        </View>

        {on && (
          <View style={S.card}>
            <Text style={S.cardTitle}>⏰ وقت التذكير</Text>
            <Text style={S.time}>{fmt(hour, minute)}</Text>

            <Text style={S.pickerLabel}>الساعة</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={S.pickerRow}>
                {HOURS.map(h => (
                  <TouchableOpacity key={h} style={[S.chip, h===hour && S.chipActive]} onPress={() => setHour(h)}>
                    <Text style={[S.chipText, h===hour && S.chipTextActive]}>{h.toString().padStart(2,'0')}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={S.pickerLabel}>الدقيقة</Text>
            <View style={S.pickerRow}>
              {MINUTES.map(m => (
                <TouchableOpacity key={m} style={[S.chip, m===minute && S.chipActive]} onPress={() => setMinute(m)}>
                  <Text style={[S.chipText, m===minute && S.chipTextActive]}>{m.toString().padStart(2,'0')}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={S.saveBtn} onPress={save}>
              <LinearGradient colors={['#6366F1','#8B5CF6']} style={S.saveBtnGrad} start={{x:0,y:0}} end={{x:1,y:0}}>
                <Text style={S.saveBtnText}>{saved ? '✅ تم الحفظ!' : 'حفظ الوقت'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        <View style={S.card}>
          <Text style={S.cardTitle}>📋 ستتلقى</Text>
          {[
            ['💡', 'نصيحة يومية مختلفة عن الأزمنة'],
            ['🔥', 'تذكير بالمحافظة على سلسلتك'],
            ['📊', 'تقرير أسبوعي كل أحد'],
            ['🏆', 'إشعار فوري عند حصولك على إنجاز'],
          ].map(([icon, text]) => (
            <View key={text} style={S.featureRow}>
              <Text style={S.featureIcon}>{icon}</Text>
              <Text style={S.featureText}>{text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  container:    { flex:1, backgroundColor:'#0A0E1A' },
  header:       { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingTop:52, paddingBottom:16, paddingHorizontal:16 },
  back:         { padding:8, minWidth:60 },
  backText:     { color:'#6366F1', fontSize:15, fontWeight:'600' },
  title:        { color:'#F1F5F9', fontSize:17, fontWeight:'700' },
  content:      { padding:16, gap:12 },
  card:         { backgroundColor:'#1E2640', borderRadius:14, padding:16, borderWidth:1, borderColor:'#2D3A5C' },
  cardTitle:    { color:'#CBD5E1', fontSize:14, fontWeight:'700', textAlign:'right', marginBottom:14 },
  toggleRow:    { flexDirection:'row-reverse', alignItems:'center', gap:14 },
  toggleInfo:   { flex:1 },
  toggleTitle:  { color:'#E2E8F0', fontSize:16, fontWeight:'700', textAlign:'right' },
  toggleSub:    { color:'#64748B', fontSize:13, textAlign:'right', marginTop:2 },
  time:         { color:'#6366F1', fontSize:36, fontWeight:'800', textAlign:'center', marginBottom:16 },
  pickerLabel:  { color:'#94A3B8', fontSize:12, fontWeight:'600', textAlign:'right', marginBottom:8, marginTop:12 },
  pickerRow:    { flexDirection:'row', gap:8, flexWrap:'wrap' },
  chip:         { width:44, height:44, borderRadius:10, backgroundColor:'#12172B', alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:'#2D3A5C' },
  chipActive:   { backgroundColor:'#6366F1', borderColor:'#6366F1' },
  chipText:     { color:'#64748B', fontSize:14, fontWeight:'600' },
  chipTextActive:{ color:'white' },
  saveBtn:      { borderRadius:12, overflow:'hidden', marginTop:16 },
  saveBtnGrad:  { padding:14, alignItems:'center' },
  saveBtnText:  { color:'white', fontSize:16, fontWeight:'700' },
  featureRow:   { flexDirection:'row-reverse', alignItems:'center', gap:10, paddingVertical:8 },
  featureIcon:  { fontSize:20 },
  featureText:  { color:'#94A3B8', fontSize:14, flex:1, textAlign:'right' },
});
