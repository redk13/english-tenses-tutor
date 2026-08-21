import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, StatusBar, ActivityIndicator, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StorageService, { ACHIEVEMENTS } from '../services/StorageService';
import { TENSES } from '../data/tenses';

const { width } = Dimensions.get('window');
const CHART_H = 100;
const DAYS = { Sun:'أحد', Mon:'اثن', Tue:'ثلا', Wed:'أرب', Thu:'خمس', Fri:'جمع', Sat:'سبت' };

export default function ReportsScreen({ onBack }) {
  const insets = useSafeAreaInsets();
  const [data,  setData]  = useState(null);
  const [earned,setEarned]= useState([]);
  const [tab,   setTab]   = useState('week');

  useEffect(() => { load(); }, []);

  const load = async () => {
    const r = await StorageService.getReport();
    const e = await StorageService.getEarned();
    setData(r); setEarned(e);
  };

  const getTense = (id) => TENSES.find(t => t.id === id);

  if (!data) return (
    <View style={S.loading}><ActivityIndicator color="#6366F1" size="large" /><Text style={S.loadingText}>جاري التحميل...</Text></View>
  );

  const maxBar = Math.max(...data.chart.map(d => d.t), 1);

  return (
    <View style={S.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#12172B','#0A0E1A']} style={[S.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={onBack} style={S.back} hitSlop={{top:10,bottom:10,left:10,right:10}}><Text style={S.backText}>رجوع ←</Text></TouchableOpacity>
        <Text style={S.headerTitle}>📊 تقريرك التفصيلي</Text>
        <View style={{width:60}} />
      </LinearGradient>

      <View style={S.tabs}>
        {[['week','الأسبوع'],['overall','الإجمالي'],['achiev','الإنجازات'],['mistakes','الأخطاء']].map(([id,label]) => (
          <TouchableOpacity key={id} style={[S.tab, tab===id && S.tabActive]} onPress={() => setTab(id)}>
            <Text style={[S.tabText, tab===id && S.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={[S.content, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>

        {tab === 'week' && (
          <>
            <View style={S.row3}>
              <Card emoji="✅" val={data.wc} label="صحيح" color="#10B981" />
              <Card emoji="🎯" val={`${data.weekAcc}%`} label="دقة الأسبوع" color="#6366F1" />
              <Card emoji="📝" val={data.wt} label="إجمالي" color="#F59E0B" />
            </View>

            <View style={S.card}>
              <Text style={S.cardTitle}>📈 نشاطك هذا الأسبوع</Text>
              <View style={S.chart}>
                {data.chart.map((d, i) => {
                  const h = d.t > 0 ? (d.t / maxBar) * CHART_H : 4;
                  const c = d.t > 0 ? (d.c / maxBar) * CHART_H : 0;
                  return (
                    <View key={i} style={S.barGroup}>
                      <View style={S.barWrap}>
                        <View style={[S.bar,{height:h,backgroundColor:'#2D3A5C'}]}>
                          <View style={[S.barFill,{height:c,backgroundColor:'#6366F1'}]} />
                        </View>
                      </View>
                      <Text style={S.barLabel}>{DAYS[d.day]}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={[S.card,{borderColor:'#F9731640'}]}>
              <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                <Text style={{fontSize:44}}>{data.streak >= 7 ? '🏆' : '🔥'}</Text>
                <View>
                  <Text style={S.cardTitle}>السلسلة اليومية</Text>
                  <Text style={[S.bigNum,{color:'#F97316'}]}>{data.streak} يوم</Text>
                </View>
              </View>
            </View>

            {data.due?.length > 0 && (
              <View style={[S.card,{borderColor:'#F59E0B40'}]}>
                <Text style={S.cardTitle}>🧠 للمراجعة اليوم (التكرار المتباعد)</Text>
                {data.due.map(id => {
                  const t = getTense(id);
                  return t ? (
                    <View key={id} style={S.reviewItem}>
                      <View style={[S.reviewDot,{backgroundColor:t.color}]} />
                      <Text style={S.reviewText}>{t.ar}</Text>
                    </View>
                  ) : null;
                })}
              </View>
            )}
          </>
        )}

        {tab === 'overall' && (
          <>
            <View style={S.row3}>
              <Card emoji="✅" val={data.correct}  label="إجمالي الصحيح" color="#10B981" />
              <Card emoji="🎯" val={`${data.accuracy}%`} label="الدقة الكلية" color="#6366F1" />
              <Card emoji="📚" val={`${data.mastered}/7`} label="متقن" color="#F59E0B" />
            </View>
            <View style={S.card}>
              <Text style={S.cardTitle}>📊 تقدمك في كل زمن</Text>
              {TENSES.map(t => {
                const tp = data.tenses[t.id];
                const pct = tp?.total > 0 ? Math.round((tp.correct/tp.total)*100) : 0;
                return (
                  <View key={t.id} style={S.tenseItem}>
                    <View style={S.tenseItemHeader}>
                      <Text style={S.tenseItemName}>{t.ar}</Text>
                      <Text style={[S.tenseItemPct,{color:t.color}]}>{tp?.total > 0 ? `${pct}% (${tp.correct}/${tp.total})` : 'لم تبدأ'}</Text>
                    </View>
                    <View style={S.progBg}><View style={[S.progFill,{width:`${pct}%`,backgroundColor:t.color}]} /></View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {tab === 'achiev' && (
          <View style={S.card}>
            <Text style={S.cardTitle}>🏆 الإنجازات ({earned.length}/{ACHIEVEMENTS.length})</Text>
            {ACHIEVEMENTS.map(a => {
              const done = earned.includes(a.id);
              return (
                <View key={a.id} style={[S.achItem, !done && S.achLocked]}>
                  <Text style={[S.achEmoji,!done&&{opacity:0.3}]}>{a.emoji}</Text>
                  <View style={S.achInfo}>
                    <Text style={[S.achTitle,!done&&{color:'#475569'}]}>{done ? a.title : '???'}</Text>
                    <Text style={S.achDesc}>{done ? a.desc : 'مقفل — واصل التعلم!'}</Text>
                  </View>
                  {done && <Text>✅</Text>}
                </View>
              );
            })}
          </View>
        )}

        {tab === 'mistakes' && (
          <View style={S.card}>
            <Text style={S.cardTitle}>📝 آخر الأخطاء</Text>
            {data.journal?.length > 0 ? data.journal.map((m, i) => {
              const t = getTense(m.tense);
              return (
                <View key={i} style={S.mistakeItem}>
                  <View style={{flexDirection:'row',justifyContent:'space-between'}}>
                    <Text style={S.mistakeDate}>{m.date}</Text>
                    {t && <Text style={[S.mistakeTense,{color:t.color}]}>{t.ar}</Text>}
                  </View>
                  <Text style={S.mistakeCtx}>{m.context}</Text>
                </View>
              );
            }) : (
              <View style={S.empty}>
                <Text style={S.emptyEmoji}>🎉</Text>
                <Text style={S.emptyText}>لا أخطاء مسجلة بعد!</Text>
              </View>
            )}
          </View>
        )}

        <View style={{height:40}} />
      </ScrollView>
    </View>
  );
}

function Card({ emoji, val, label, color }) {
  return (
    <View style={[S.sCard,{borderColor:color+'30'}]}>
      <Text style={S.sCardEmoji}>{emoji}</Text>
      <Text style={[S.sCardVal,{color}]}>{val}</Text>
      <Text style={S.sCardLabel}>{label}</Text>
    </View>
  );
}

const S = StyleSheet.create({
  container:   { flex:1, backgroundColor:'#0A0E1A' },
  loading:     { flex:1, backgroundColor:'#0A0E1A', alignItems:'center', justifyContent:'center', gap:16 },
  loadingText: { color:'#64748B', fontSize:15 },
  header:      { flexDirection:'row-reverse', alignItems:'center', justifyContent:'space-between', paddingBottom:16, paddingHorizontal:16 },
  back:        { padding:8, minWidth:60 },
  backText:    { color:'#6366F1', fontSize:15, fontWeight:'600' },
  headerTitle: { color:'#F1F5F9', fontSize:17, fontWeight:'700' },
  tabs:        { flexDirection:'row', backgroundColor:'#12172B', paddingHorizontal:12, paddingBottom:8, gap:4 },
  tab:         { flex:1, paddingVertical:8, borderRadius:8, alignItems:'center' },
  tabActive:   { backgroundColor:'#1E2640' },
  tabText:     { color:'#475569', fontSize:11, fontWeight:'600' },
  tabTextActive:{ color:'#A5B4FC' },
  content:     { padding:16, gap:12 },
  row3:        { flexDirection:'row', gap:10 },
  sCard:       { flex:1, backgroundColor:'#1E2640', borderRadius:12, padding:12, alignItems:'center', borderWidth:1 },
  sCardEmoji:  { fontSize:20, marginBottom:4 },
  sCardVal:    { fontSize:18, fontWeight:'800', marginBottom:2 },
  sCardLabel:  { color:'#64748B', fontSize:10, textAlign:'center' },
  card:        { backgroundColor:'#1E2640', borderRadius:14, padding:16, borderWidth:1, borderColor:'#2D3A5C' },
  cardTitle:   { color:'#CBD5E1', fontSize:14, fontWeight:'700', textAlign:'right', marginBottom:14 },
  bigNum:      { fontSize:24, fontWeight:'800', textAlign:'right' },
  chart:       { flexDirection:'row', alignItems:'flex-end', justifyContent:'space-between', height:CHART_H+24 },
  barGroup:    { alignItems:'center', flex:1 },
  barWrap:     { height:CHART_H, justifyContent:'flex-end' },
  bar:         { width:20, borderRadius:4, justifyContent:'flex-end', overflow:'hidden' },
  barFill:     { width:'100%', borderRadius:4 },
  barLabel:    { color:'#475569', fontSize:9, marginTop:4 },
  reviewItem:  { flexDirection:'row-reverse', alignItems:'center', gap:10, paddingVertical:6 },
  reviewDot:   { width:8, height:8, borderRadius:4 },
  reviewText:  { color:'#E2E8F0', fontSize:14 },
  tenseItem:   { marginBottom:14 },
  tenseItemHeader:{ flexDirection:'row', justifyContent:'space-between', marginBottom:6 },
  tenseItemName:  { color:'#CBD5E1', fontSize:13, fontWeight:'600' },
  tenseItemPct:   { fontSize:12 },
  progBg:      { height:6, backgroundColor:'#2D3A5C', borderRadius:3, overflow:'hidden' },
  progFill:    { height:'100%', borderRadius:3 },
  achItem:     { flexDirection:'row-reverse', alignItems:'center', padding:12, borderRadius:10, backgroundColor:'#12172B', marginBottom:8, gap:12 },
  achLocked:   { opacity:0.5 },
  achEmoji:    { fontSize:26 },
  achInfo:     { flex:1 },
  achTitle:    { color:'#E2E8F0', fontSize:14, fontWeight:'700', textAlign:'right' },
  achDesc:     { color:'#64748B', fontSize:12, textAlign:'right', marginTop:2 },
  mistakeItem: { backgroundColor:'#12172B', borderRadius:10, padding:12, marginBottom:8 },
  mistakeDate: { color:'#475569', fontSize:11 },
  mistakeTense:{ fontSize:13, fontWeight:'700' },
  mistakeCtx:  { color:'#94A3B8', fontSize:13, textAlign:'right', marginTop:4 },
  empty:       { alignItems:'center', padding:24, gap:8 },
  emptyEmoji:  { fontSize:48 },
  emptyText:   { color:'#E2E8F0', fontSize:16, fontWeight:'700' },
});
