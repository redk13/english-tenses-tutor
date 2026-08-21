import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TENSES, MODES } from '../data/tenses';
import StorageService from '../services/StorageService';

export default function HomeScreen({ onMode, onTense, onSettings, onReports }) {
  const insets = useSafeAreaInsets();
  const [streak,   setStreak]   = useState(0);
  const [correct,  setCorrect]  = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [mastered, setMastered] = useState([]);
  const [challenge,setChallenge]= useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const s = await StorageService.getStreak();
    const p = await StorageService.getProgress();
    const m = await StorageService.getMastered();
    const c = await StorageService.getDailyChallenge();
    setStreak(s);
    setCorrect(p.correct);
    setAccuracy(p.answered > 0 ? Math.round((p.correct / p.answered) * 100) : 0);
    setMastered(m);
    setChallenge(c);
  };

  return (
    <View style={S.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0E1A" />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <LinearGradient colors={['#12172B','#0A0E1A']} style={[S.header, { paddingTop: insets.top + 16 }]}>
          <View style={S.headerRow}>
            <Text style={S.greeting}>مرحباً! 👋</Text>
            <View style={S.headerBtns}>
              <TouchableOpacity onPress={onReports}  style={S.iconBtn}><Text style={S.iconBtnText}>📊</Text></TouchableOpacity>
              <TouchableOpacity onPress={onSettings} style={S.iconBtn}><Text style={S.iconBtnText}>⚙️</Text></TouchableOpacity>
            </View>
          </View>
          <Text style={S.sub}>أفضل مدرّس أزمنة في العالم</Text>
          <View style={S.stats}>
            <Stat icon="🔥" value={streak}   label="يوم متتالي"  color="#F97316" />
            <Stat icon="✅" value={correct}  label="إجابة صحيحة" color="#10B981" />
            <Stat icon="🎯" value={`${accuracy}%`} label="دقة الإجابات" color="#6366F1" />
          </View>
        </LinearGradient>

        {/* Daily Challenge */}
        {challenge && !challenge.done && (
          <TouchableOpacity style={S.challenge} onPress={() => onMode({ id:'chat', ar:'تحدي اليوم', color:'#F59E0B', prompt: challenge.prompt + ' — هذا هو تحدي اليوم.' })}>
            <LinearGradient colors={['#92400E20','#0A0E1A']} style={S.challengeGrad}>
              <Text style={S.challengeLabel}>⚡ تحدي اليوم</Text>
              <Text style={S.challengeText}>{challenge.prompt}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Modes */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>اختر طريقة التعلم</Text>
          <View style={S.grid}>
            {MODES.map(m => (
              <TouchableOpacity key={m.id} style={[S.modeCard,{borderColor:m.color+'40'}]} onPress={() => onMode(m)} activeOpacity={0.8}>
                <LinearGradient colors={[m.color+'20','#12172B']} style={S.modeGrad}>
                  <Text style={S.modeIcon}>{m.icon}</Text>
                  <Text style={S.modeName}>{m.ar}</Text>
                  <Text style={S.modeDesc}>{m.desc}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tenses */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>الأزمنة السبعة</Text>
          {TENSES.map(t => (
            <TouchableOpacity key={t.id} style={S.tenseCard} onPress={() => onTense(t)} activeOpacity={0.8}>
              <View style={[S.tenseIcon,{backgroundColor:t.color+'20'}]}>
                <Text style={S.tenseEmoji}>{t.icon}</Text>
              </View>
              <View style={S.tenseInfo}>
                <Text style={S.tenseAr}>{t.ar}</Text>
                <Text style={S.tenseEn}>{t.en}</Text>
                <Text style={[S.tenseFormula,{color:t.color}]}>{t.formula}</Text>
              </View>
              <View style={S.tenseRight}>
                {mastered.includes(t.id) && <View style={S.masteredBadge}><Text style={S.masteredText}>✓ متقن</Text></View>}
                <Text style={[S.tenseRule,{color:t.color}]}>{t.rule}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{height: insets.bottom + 24}} />
      </ScrollView>
    </View>
  );
}

function Stat({ icon, value, label, color }) {
  return (
    <View style={[S.stat,{borderColor:color+'30'}]}>
      <Text style={S.statIcon}>{icon}</Text>
      <Text style={[S.statValue,{color}]}>{value}</Text>
      <Text style={S.statLabel}>{label}</Text>
    </View>
  );
}

const S = StyleSheet.create({
  container:    { flex:1, backgroundColor:'#0A0E1A' },
  header:       { paddingBottom:24, paddingHorizontal:20 },
  headerRow:    { flexDirection:'row-reverse', justifyContent:'space-between', alignItems:'center', marginBottom:4 },
  greeting:     { fontSize:22, fontWeight:'800', color:'#F1F5F9' },
  headerBtns:   { flexDirection:'row', gap:8 },
  iconBtn:      { padding:8 },
  iconBtnText:  { fontSize:22 },
  sub:          { color:'#64748B', fontSize:13, marginBottom:20 },
  stats:        { flexDirection:'row', gap:10 },
  stat:         { flex:1, backgroundColor:'#1E2640', borderRadius:12, padding:12, alignItems:'center', borderWidth:1 },
  statIcon:     { fontSize:20, marginBottom:4 },
  statValue:    { fontSize:20, fontWeight:'800', marginBottom:2 },
  statLabel:    { color:'#64748B', fontSize:10, textAlign:'center' },
  challenge:    { marginHorizontal:20, marginTop:20, borderRadius:14, overflow:'hidden', borderWidth:1, borderColor:'#F59E0B40' },
  challengeGrad:{ padding:16 },
  challengeLabel:{ color:'#F59E0B', fontSize:12, fontWeight:'700', textAlign:'right', marginBottom:4 },
  challengeText: { color:'#E2E8F0', fontSize:14, textAlign:'right' },
  section:      { paddingHorizontal:20, paddingTop:28 },
  sectionTitle: { color:'#CBD5E1', fontSize:17, fontWeight:'700', marginBottom:16, textAlign:'right' },
  grid:         { flexDirection:'row', flexWrap:'wrap', gap:12 },
  modeCard:     { width:'47%', borderRadius:14, overflow:'hidden', borderWidth:1 },
  modeGrad:     { padding:16, minHeight:110, justifyContent:'space-between' },
  modeIcon:     { fontSize:28, marginBottom:8 },
  modeName:     { color:'#E2E8F0', fontSize:15, fontWeight:'700', textAlign:'right', marginBottom:4 },
  modeDesc:     { color:'#64748B', fontSize:11, textAlign:'right', lineHeight:16 },
  tenseCard:    { backgroundColor:'#1E2640', borderRadius:14, padding:16, marginBottom:10, flexDirection:'row', alignItems:'center', gap:12, borderWidth:1, borderColor:'#2D3A5C' },
  tenseIcon:    { width:46, height:46, borderRadius:12, alignItems:'center', justifyContent:'center' },
  tenseEmoji:   { fontSize:22 },
  tenseInfo:    { flex:1 },
  tenseAr:      { color:'#E2E8F0', fontSize:15, fontWeight:'700', textAlign:'right' },
  tenseEn:      { color:'#64748B', fontSize:12, textAlign:'right' },
  tenseFormula: { fontSize:11, textAlign:'right', marginTop:2, fontFamily:'monospace' },
  tenseRight:   { alignItems:'flex-end', gap:4 },
  masteredBadge:{ backgroundColor:'#10B98120', borderRadius:8, paddingHorizontal:8, paddingVertical:3 },
  masteredText: { color:'#10B981', fontSize:11, fontWeight:'700' },
  tenseRule:    { fontSize:11, textAlign:'right' },
});
