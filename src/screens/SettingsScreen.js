import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GeminiService, { FREE_MODELS } from '../services/GeminiService';
import StorageService from '../services/StorageService';

export default function SettingsScreen({ onBack, onReset, onNotifications }) {
  const insets = useSafeAreaInsets();
  const [model,   setModel]   = useState(GeminiService.getModel());
  const [results, setResults] = useState({});
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    StorageService.getModel().then(m => { if (m) { setModel(m); GeminiService.setModel(m); } });
  }, []);

  const changeModel = async (id) => {
    setModel(id);
    GeminiService.setModel(id);
    await StorageService.saveModel(id);
  };

  const testModels = async () => {
    setTesting(true);
    const key = await StorageService.getKey();
    const r = {};
    for (const m of FREE_MODELS) {
      const res = await GeminiService.testModel(key, m.id);
      r[m.id] = res.ok;
      setResults({ ...r });
    }
    setTesting(false);
  };

  const confirmReset = (title, msg, action) => {
    Alert.alert(title, msg, [{ text: 'إلغاء', style: 'cancel' }, { text: 'تأكيد', style: 'destructive', onPress: action }]);
  };

  return (
    <View style={S.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#12172B','#0A0E1A']} style={[S.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={onBack} style={S.back} hitSlop={{top:10,bottom:10,left:10,right:10}}><Text style={S.backText}>رجوع ←</Text></TouchableOpacity>
        <Text style={S.title}>⚙️ الإعدادات</Text>
        <View style={{width:60}} />
      </LinearGradient>

      <ScrollView contentContainerStyle={[S.content, { paddingBottom: insets.bottom + 24 }]}>

        {/* Model */}
        <View style={S.card}>
          <Text style={S.cardTitle}>🤖 النموذج — جميعها مجانية ✅</Text>
          {FREE_MODELS.map(m => (
            <TouchableOpacity key={m.id} style={[S.modelItem, model===m.id && S.modelActive]} onPress={() => changeModel(m.id)}>
              <View style={S.modelInfo}>
                <Text style={[S.modelLabel, model===m.id && S.modelLabelActive]}>{m.label}</Text>
                {m.recommended && <View style={S.badge}><Text style={S.badgeText}>موصى به</Text></View>}
              </View>
              <View style={S.modelRight}>
                {results[m.id] !== undefined && <Text>{results[m.id] ? '✅' : '❌'}</Text>}
                {model === m.id && <View style={S.activeDot} />}
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={S.testBtn} onPress={testModels} disabled={testing}>
            <Text style={S.testBtnText}>{testing ? '⏳ جاري الاختبار...' : '🔍 اختبر النماذج المتاحة'}</Text>
          </TouchableOpacity>
        </View>

        {/* Notifications */}
        <TouchableOpacity style={S.card} onPress={onNotifications}>
          <View style={S.row}><Text style={S.rowText}>🔔 الإشعارات والتذكيرات</Text><Text style={S.arrow}>←</Text></View>
        </TouchableOpacity>

        {/* API Key */}
        <View style={S.card}>
          <Text style={S.cardTitle}>🔑 مفتاح API</Text>
          <TouchableOpacity style={S.row} onPress={() => confirmReset('تغيير المفتاح', 'هل تريد إدخال مفتاح جديد؟', async () => { await StorageService.removeKey(); GeminiService.setApiKey(null); onReset(); })}>
            <Text style={S.rowText}>تغيير مفتاح Gemini API</Text><Text style={S.arrow}>←</Text>
          </TouchableOpacity>
        </View>

        {/* Danger */}
        <View style={[S.card,{borderColor:'#F8717140'}]}>
          <Text style={[S.cardTitle,{color:'#F87171'}]}>⚠️ منطقة الخطر</Text>
          <TouchableOpacity style={S.row} onPress={() => confirmReset('إعادة تعيين', 'سيُحذف كل تقدمك. متأكد؟', () => StorageService.resetAll())}>
            <Text style={[S.rowText,{color:'#F87171'}]}>إعادة تعيين كل التقدم</Text><Text style={S.arrow}>🗑️</Text>
          </TouchableOpacity>
        </View>

        <Text style={S.about}>🎓 English Tenses Tutor v2.0{'\n'}مجاني 100% 💚</Text>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  container:      { flex:1, backgroundColor:'#0A0E1A' },
  header:         { flexDirection:'row-reverse', alignItems:'center', justifyContent:'space-between', paddingBottom:16, paddingHorizontal:16 },
  back:           { padding:8, minWidth:60 },
  backText:       { color:'#6366F1', fontSize:15, fontWeight:'600' },
  title:          { color:'#F1F5F9', fontSize:17, fontWeight:'700' },
  content:        { padding:16, gap:12 },
  card:           { backgroundColor:'#1E2640', borderRadius:14, padding:16, borderWidth:1, borderColor:'#2D3A5C' },
  cardTitle:      { color:'#CBD5E1', fontSize:14, fontWeight:'700', textAlign:'right', marginBottom:12 },
  modelItem:      { flexDirection:'row-reverse', alignItems:'center', justifyContent:'space-between', paddingVertical:12, borderTopWidth:1, borderTopColor:'#2D3A5C' },
  modelActive:    { backgroundColor:'#6366F115', borderRadius:10, paddingHorizontal:8 },
  modelInfo:      { flex:1, alignItems:'flex-end', gap:4 },
  modelLabel:     { color:'#94A3B8', fontSize:14 },
  modelLabelActive:{ color:'#A5B4FC', fontWeight:'700' },
  badge:          { backgroundColor:'#10B98120', borderRadius:6, paddingHorizontal:8, paddingVertical:2 },
  badgeText:      { color:'#10B981', fontSize:11, fontWeight:'700' },
  modelRight:     { flexDirection:'row', alignItems:'center', gap:8 },
  activeDot:      { width:10, height:10, borderRadius:5, backgroundColor:'#6366F1' },
  testBtn:        { marginTop:12, padding:12, backgroundColor:'#12172B', borderRadius:10, alignItems:'center', borderWidth:1, borderColor:'#2D3A5C' },
  testBtnText:    { color:'#A5B4FC', fontSize:14, fontWeight:'600' },
  row:            { flexDirection:'row-reverse', alignItems:'center', justifyContent:'space-between', paddingVertical:4 },
  rowText:        { color:'#E2E8F0', fontSize:15, fontWeight:'500' },
  arrow:          { color:'#475569', fontSize:18 },
  about:          { color:'#475569', textAlign:'center', fontSize:13, lineHeight:24, paddingVertical:20 },
});
