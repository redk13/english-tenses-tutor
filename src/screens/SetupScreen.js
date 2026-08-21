import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, Linking, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GeminiService from '../services/GeminiService';
import StorageService from '../services/StorageService';

export default function SetupScreen({ onDone }) {
  const insets = useSafeAreaInsets();
  const [key, setKey]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  const handleSave = async () => {
    if (!key.trim()) { setError('أدخل المفتاح أولاً'); return; }
    setLoading(true); setError('');
    const valid = await GeminiService.validateKey(key.trim());
    if (valid) {
      await StorageService.saveKey(key.trim());
      GeminiService.setApiKey(key.trim());
      onDone();
    } else {
      setError('المفتاح غير صحيح — تحقق منه وأعد المحاولة');
    }
    setLoading(false);
  };

  return (
    <LinearGradient colors={['#0A0E1A','#12172B','#0A0E1A']} style={S.container}>
      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={{flex:1}}>
        <ScrollView
          contentContainerStyle={[S.scroll, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >

          <Text style={S.logo}>🎓</Text>
          <Text style={S.title}>English Tenses Tutor</Text>
          <Text style={S.sub}>أفضل مدرّس أزمنة إنجليزية في العالم</Text>

          <View style={S.card}>
            <Row icon="🔑" text="مفتاح Gemini API مجاني من Google" />
            <Row icon="🤖" text="التطبيق يعمل كمدرّس ذكاء اصطناعي" />
            <Row icon="🔒" text="المفتاح محفوظ على جهازك فقط" />
            <Row icon="🆓" text="استخدم نماذج Flash — مجانية 100%" />
          </View>

          <TouchableOpacity style={S.linkBtn} onPress={() => Linking.openURL('https://aistudio.google.com/app/apikey')}>
            <Text style={S.linkText}>🌐  احصل على مفتاح مجاني من Google AI Studio</Text>
          </TouchableOpacity>

          <Text style={S.label}>مفتاح Gemini API</Text>
          <TextInput
            style={S.input}
            value={key}
            onChangeText={setKey}
            placeholder="AIza..."
            placeholderTextColor="#4A5568"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          {!!error && <Text style={S.error}>{error}</Text>}

          <TouchableOpacity style={S.btn} onPress={handleSave} disabled={loading}>
            <LinearGradient colors={['#6366F1','#8B5CF6']} start={{x:0,y:0}} end={{x:1,y:0}} style={S.btnGrad}>
              {loading ? <ActivityIndicator color="white" /> : <Text style={S.btnText}>ابدأ التعلم الآن ✨</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={S.footer}>المفتاح مجاني ويكفي للاستخدام اليومي</Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function Row({ icon, text }) {
  return (
    <View style={S.row}>
      <Text style={S.rowIcon}>{icon}</Text>
      <Text style={S.rowText}>{text}</Text>
    </View>
  );
}

const S = StyleSheet.create({
  container:  { flex:1 },
  scroll:     { padding:24, alignItems:'center' },
  logo:       { fontSize:72, marginBottom:12 },
  title:      { fontSize:24, fontWeight:'800', color:'#F1F5F9', textAlign:'center', marginBottom:6 },
  sub:        { fontSize:14, color:'#94A3B8', textAlign:'center', marginBottom:32 },
  card:       { width:'100%', backgroundColor:'#1E2640', borderRadius:16, padding:20, marginBottom:20, borderWidth:1, borderColor:'#2D3A5C' },
  row:        { flexDirection:'row-reverse', alignItems:'center', gap:10, marginBottom:10 },
  rowIcon:    { fontSize:20 },
  rowText:    { color:'#94A3B8', fontSize:14, flex:1, textAlign:'right' },
  linkBtn:    { width:'100%', backgroundColor:'#0F172A', borderWidth:1, borderColor:'#6366F1', borderRadius:12, padding:14, alignItems:'center', marginBottom:24 },
  linkText:   { color:'#A5B4FC', fontSize:14, fontWeight:'600' },
  label:      { alignSelf:'flex-end', color:'#CBD5E1', fontSize:14, fontWeight:'600', marginBottom:8 },
  input:      { width:'100%', backgroundColor:'#1E2640', borderRadius:12, padding:16, color:'#F1F5F9', fontSize:15, borderWidth:1, borderColor:'#2D3A5C', textAlign:'left', marginBottom:12 },
  error:      { color:'#F87171', textAlign:'center', marginBottom:12, fontSize:14 },
  btn:        { width:'100%', borderRadius:14, overflow:'hidden', marginBottom:16 },
  btnGrad:    { padding:16, alignItems:'center' },
  btnText:    { color:'white', fontSize:17, fontWeight:'700' },
  footer:     { color:'#475569', textAlign:'center', fontSize:12 },
});
