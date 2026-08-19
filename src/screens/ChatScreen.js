import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import GeminiService from '../services/GeminiService';
import StorageService from '../services/StorageService';

const QUICK = ['لم أفهم 😕', 'مثال آخر؟', 'لماذا؟', 'اختبرني ⚡', 'التالي ➡️', 'هل هذا صح؟'];

export default function ChatScreen({ mode, tense, onBack }) {
  const [msgs,    setMsgs]    = useState([]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const listRef = useRef(null);

  const title = tense ? tense.ar   : mode?.ar   || 'محادثة';
  const color = tense ? tense.color : mode?.color || '#6366F1';

  useEffect(() => { GeminiService.resetHistory(); startSession(); }, []);

  const addMsg = useCallback((role, text) => {
    setMsgs(prev => [...prev, { id: Date.now() + role, role, text, time: new Date().toLocaleTimeString('ar', { hour:'2-digit', minute:'2-digit' }) }]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const startSession = async () => {
    setLoading(true);
    try {
      const prompt = tense
        ? `علّمني ${tense.ar} (${tense.en}) بالطريقة التدريجية. ابدأ بسؤال واحد بسيط باختيارين.`
        : (mode?.prompt || 'ابدأ جلسة تعليمية.');
      const reply = await GeminiService.send(prompt, mode?.id || 'chat');
      addMsg('ai', reply);
      setStarted(true);
    } catch {
      addMsg('ai', 'تعذّر البدء — تحقق من الإنترنت وأعد المحاولة 🔄');
    }
    setLoading(false);
  };

  const send = async (text = input) => {
    const msg = text.trim();
    if (!msg || loading) return;
    setInput('');
    addMsg('user', msg);
    setLoading(true);
    try {
      const reply = await GeminiService.send(msg, mode?.id || 'chat');
      addMsg('ai', reply);
      const ok  = reply.includes('✅') || reply.includes('ممتاز') || reply.includes('صح');
      const bad = reply.includes('تقريباً') || reply.includes('❌');
      if (tense && (ok || bad)) await StorageService.addAnswer(tense.id, ok);
      if (tense && bad) await StorageService.addMistake(tense.id, msg);
    } catch (e) {
      const m = e.message === 'RATE_LIMIT' ? 'انتظر ثانية وأعد المحاولة ⏱' : 'تعذّر الاتصال 🔄';
      addMsg('ai', m);
    }
    setLoading(false);
  };

  const renderMsg = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[S.msgRow, isUser ? S.rowUser : S.rowAI]}>
        {!isUser && <Text style={S.avatar}>🎓</Text>}
        <View style={[S.bubble, isUser ? S.bubbleUser : S.bubbleAI]}>
          <Text style={[S.bubbleText, isUser ? S.textUser : S.textAI]}>{item.text}</Text>
          <Text style={S.time}>{item.time}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={S.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0E1A" />

      <LinearGradient colors={['#12172B','#0A0E1A']} style={S.header}>
        <TouchableOpacity onPress={onBack} style={S.backBtn}>
          <Text style={S.backText}>← رجوع</Text>
        </TouchableOpacity>
        <View style={S.headerCenter}>
          <Text style={S.headerTitle}>{title}</Text>
          {tense && <Text style={[S.headerSub,{color}]}>{tense.formula}</Text>}
        </View>
        <View style={[S.dot,{backgroundColor: loading ? '#F59E0B' : '#10B981'}]} />
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={{flex:1}}>
        <FlatList
          ref={listRef}
          data={msgs}
          renderItem={renderMsg}
          keyExtractor={i => i.id}
          contentContainerStyle={S.list}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={loading ? (
            <View style={S.loadingRow}>
              <Text style={S.avatar}>🎓</Text>
              <View style={S.loadingBubble}>
                <ActivityIndicator color="#6366F1" size="small" />
                <Text style={S.loadingText}>المدرّس يكتب...</Text>
              </View>
            </View>
          ) : null}
        />

        {started && (
          <FlatList
            horizontal
            data={QUICK}
            keyExtractor={i => i}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={S.quickList}
            style={S.quickBar}
            renderItem={({ item }) => (
              <TouchableOpacity style={S.quickBtn} onPress={() => send(item)}>
                <Text style={S.quickText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        )}

        <View style={S.inputRow}>
          <TouchableOpacity style={[S.sendBtn,{backgroundColor:color}]} onPress={() => send()} disabled={loading}>
            <Text style={S.sendIcon}>{loading ? '⏳' : '▶'}</Text>
          </TouchableOpacity>
          <TextInput
            style={S.input}
            value={input}
            onChangeText={setInput}
            placeholder="اكتب هنا أو اختر من الأعلى..."
            placeholderTextColor="#4A5568"
            multiline
            maxLength={500}
            textAlign="right"
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const S = StyleSheet.create({
  container:    { flex:1, backgroundColor:'#0A0E1A' },
  header:       { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingTop:52, paddingBottom:16, paddingHorizontal:16 },
  backBtn:      { padding:8 },
  backText:     { color:'#6366F1', fontSize:15, fontWeight:'600' },
  headerCenter: { alignItems:'center', flex:1 },
  headerTitle:  { color:'#F1F5F9', fontSize:17, fontWeight:'700' },
  headerSub:    { fontSize:12, fontFamily:'monospace', marginTop:2 },
  dot:          { width:10, height:10, borderRadius:5 },
  list:         { padding:16, paddingBottom:8 },
  msgRow:       { flexDirection:'row', marginBottom:12, alignItems:'flex-end', gap:8 },
  rowUser:      { justifyContent:'flex-end' },
  rowAI:        { justifyContent:'flex-start' },
  avatar:       { fontSize:22, marginBottom:4 },
  bubble:       { maxWidth:'80%', borderRadius:16, padding:12 },
  bubbleUser:   { backgroundColor:'#4338CA', borderBottomRightRadius:4 },
  bubbleAI:     { backgroundColor:'#1E2640', borderBottomLeftRadius:4, borderWidth:1, borderColor:'#2D3A5C' },
  bubbleText:   { fontSize:15, lineHeight:22 },
  textUser:     { color:'#E0E7FF', textAlign:'right' },
  textAI:       { color:'#E2E8F0', textAlign:'right' },
  time:         { color:'#475569', fontSize:10, textAlign:'right', marginTop:4 },
  loadingRow:   { flexDirection:'row', alignItems:'flex-end', gap:8, marginBottom:12 },
  loadingBubble:{ backgroundColor:'#1E2640', borderRadius:16, padding:12, flexDirection:'row', alignItems:'center', gap:8, borderWidth:1, borderColor:'#2D3A5C' },
  loadingText:  { color:'#64748B', fontSize:13 },
  quickBar:     { borderTopWidth:1, borderTopColor:'#1E2640' },
  quickList:    { paddingHorizontal:12, paddingVertical:8, gap:8 },
  quickBtn:     { backgroundColor:'#1E2640', borderRadius:20, paddingHorizontal:14, paddingVertical:8, borderWidth:1, borderColor:'#2D3A5C' },
  quickText:    { color:'#A5B4FC', fontSize:13 },
  inputRow:     { flexDirection:'row', padding:12, gap:10, alignItems:'flex-end', backgroundColor:'#12172B', borderTopWidth:1, borderTopColor:'#1E2640' },
  input:        { flex:1, backgroundColor:'#1E2640', borderRadius:20, paddingHorizontal:16, paddingVertical:10, color:'#F1F5F9', fontSize:15, maxHeight:100, borderWidth:1, borderColor:'#2D3A5C' },
  sendBtn:      { width:44, height:44, borderRadius:22, alignItems:'center', justifyContent:'center' },
  sendIcon:     { fontSize:18, color:'white' },
});
