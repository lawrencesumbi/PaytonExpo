import { Ionicons } from '@expo/vector-icons';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../../lib/supabase';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  extractedData?: {
    amount: number;
    category: string;
    description: string;
  };
}

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export default function ChatCoachScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Aloha bay! Ako imong AI Financial Coach. Pwede nimo i-log imong gasto (e.g., "Nipalit kog kape tag 180") o mangutana ka bahin sa imong kwarta (e.g., "Pila na akong nagasto karong semanaha?"). I-chat lang diri bay!',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleSend = async () => {
    if (inputText.trim() === '') return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentInput = inputText;
    setInputText('');
    setIsLoading(true);

    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      if (!apiKey) throw new Error("Missing EXPO_PUBLIC_GEMINI_API_KEY in .env");

      // 🔑 Kuhaa ang kasamtangang authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user found");

      // 📅 Pagkuha og data context (Kasamtangang Expenses ug Budgets para ma-analisar sa AI)
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      
      const { data: userExpenses } = await supabase
        .from('expenses')
        .select(`
          amount,
          description,
          spent_at,
          budgets (
            allocated_amount,
            remaining_amount,
            categories ( name )
          )
        `)
        .eq('user_id', user.id)
        .gte('spent_at', startOfMonth);

      const { data: userBudgets } = await supabase
        .from('budgets')
        .select(`
          allocated_amount,
          remaining_amount,
          categories ( name )
        `)
        .eq('user_id', user.id);

      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
        }
      });

      const systemInstruction = `
        You are a smart financial tracking assistant and advisor for a mobile app named Payton.
        Today's date is ${new Date().toDateString()}.

        Your job is to analyze the user's input. Decide whether they want to log an expense ("intent": "LOG_EXPENSE") or ask a question about their spending/budget ("intent": "ASK_INSIGHT").

        ALLOWED CATEGORIES: ["Entertainment", "Rent", "Utilities", "Transportation", "Food & Dining", "Shopping", "Education", "Healthcare"]

        USER'S FINANCIAL DATA CONTEXT:
        - Recent Expenses This Month: ${JSON.stringify(userExpenses || [])}
        - Current Active Budgets: ${JSON.stringify(userBudgets || [])}

        DIRECTIONS FOR "ASK_INSIGHT":
        - Analyze the provided FINANCIAL DATA CONTEXT to answer the user's question accurately.
        - Do the math (summing, comparing, checking balance) based on the context data.
        - Answer directly, warmly, and encouragingly in Bisaya/Cebuano language.

        Return a strict raw JSON matching this schema:
        {
          "intent": "LOG_EXPENSE" or "ASK_INSIGHT",
          "reply": "Ang imong tubag sa user sa Bisaya/Cebuano.",
          
          // Only required if intent is LOG_EXPENSE:
          "amount": number (numeric float value, no currency symbols),
          "category": "string (strictly pick one from Allowed categories)",
          "description": "string (short details about the expense)"
        }
      `;

      const result = await model.generateContent([systemInstruction, `User Input: ${currentInput}`]);
      const responseText = result.response.text();
      
      const cleanJsonText = responseText.replace(/```json|```/g, '').trim();
      const extractedData = JSON.parse(cleanJsonText);

      let savedDataToDisplay = undefined;

      // 💾 KONDISYON: Kon ang tuyo sa user kay mag-LOG ug gasto
      if (extractedData.intent === 'LOG_EXPENSE' && extractedData.amount > 0) {
        let targetBudgetId = null;

        // STEP 1: Name match sa categories table
        const { data: categoryData } = await supabase
          .from('categories')
          .select('id')
          .eq('name', extractedData.category)
          .maybeSingle();

        if (categoryData) {
          // STEP 2: Pangitaa ang active budget sa user alang sa maong kategorya
          const { data: budgetData } = await supabase
            .from('budgets')
            .select('id')
            .eq('user_id', user.id)
            .eq('category_id', categoryData.id)
            .maybeSingle();

          if (budgetData) {
            targetBudgetId = budgetData.id;
          }
        }

        // STEP 3: Isulod sa expenses table
        const { error: insertError } = await supabase
          .from('expenses')
          .insert([
            {
              user_id: user.id,
              budget_id: targetBudgetId,
              amount: Number(extractedData.amount || 0),
              description: extractedData.description || 'Gasto gikan sa AI Chat',
              spent_at: new Date().toISOString()
            },
          ]);

        if (!insertError) {
          savedDataToDisplay = {
            amount: Number(extractedData.amount),
            category: extractedData.category,
            description: extractedData.description
          };
        }
      }

      // 💬 I-update ang chat UI gamit ang tubag gikan sa AI
      const botReply: Message = {
        id: Date.now().toString(),
        text: extractedData.reply, 
        sender: 'bot',
        timestamp: new Date(),
        extractedData: savedDataToDisplay
      };
      
      setMessages((prev) => [...prev, botReply]);

    } catch (error) {
      console.error("Gemini/Supabase Flow Error:", error);
      const errorReply: Message = {
        id: Date.now().toString(),
        text: 'Pasayloa ko bay, medyo naglisod kog analyze sa imong data karon. Pwede nimo sulayan pag-usab?',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorReply]);
    } finally {
      setIsLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      {/* HEADER BAR */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI FinCoach</Text>
        <Text style={styles.headerSubtitle}>Online • Imong Kaabag sa Kwarta</Text>
      </View>

      {/* CHAT MESSAGES LIST */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.chatContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View style={[styles.messageWrapper, item.sender === 'user' ? styles.userWrapper : styles.botWrapper]}>
            <View style={[styles.messageBubble, item.sender === 'user' ? styles.userBubble : styles.botBubble]}>
              <Text style={item.sender === 'user' ? styles.userText : styles.botText}>{item.text}</Text>

              {/* DYNAMIC EXPENSE CARD (Mo-pakita lang kung LOG_EXPENSE ang intent) */}
              {item.extractedData && item.extractedData.amount > 0 && (
                <View style={styles.dataCard}>
                  <View style={styles.dataRow}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.dataCardTitle}>Gi-log ug Gi-save Na Bay!</Text>
                  </View>
                  <Text style={styles.dataDetails}>
                    ₱{item.extractedData.amount} • {item.extractedData.category}
                  </Text>
                  <TouchableOpacity style={styles.viewBtn} onPress={() => router.push('/transaction')}>
                    <Text style={styles.viewBtnText}>Tan-awon sa Records</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
      />

      {/* LOADING INDICATOR */}
      {isLoading && (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="small" color="#005B60" />
          <Text style={styles.loadingText}>Nag-analisar sa imong kwarta, bay...</Text>
        </View>
      )}

      {/* INPUT FIELD BAR */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Pangutana o i-log imong gasto diri, bay..."
          placeholderTextColor="#A0AEC0"
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={isLoading}>
          <Ionicons name="send" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 55 : 45,
    paddingBottom: 15,
    backgroundColor: '#005B60', 
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  backButton: { position: 'absolute', left: 15, top: Platform.OS === 'ios' ? 52 : 44, padding: 5 },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  headerSubtitle: { color: '#E2E8F0', fontSize: 11, position: 'absolute', bottom: 2 },
  chatContainer: { padding: 15, paddingBottom: 20 },
  messageWrapper: { flexDirection: 'row', marginBottom: 12, width: '100%' },
  userWrapper: { justifyContent: 'flex-end' },
  botWrapper: { justifyContent: 'flex-start' },
  messageBubble: { maxWidth: '80%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  userBubble: { backgroundColor: '#10B981', borderBottomRightRadius: 2 },
  botBubble: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 2, borderWidth: 1, borderColor: '#E2E8F0' },
  userText: { color: '#FFFFFF', fontSize: 15 },
  botText: { color: '#2D3748', fontSize: 15, lineHeight: 20 },
  loadingWrapper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8, gap: 8 },
  loadingText: { fontSize: 13, color: '#718096', fontStyle: 'italic' },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingBottom: Platform.OS === 'ios' ? 28 : 12, 
  },
  input: { flex: 1, backgroundColor: '#F7FAFC', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, fontSize: 15, color: '#2D3748', maxHeight: 100 },
  sendButton: { backgroundColor: '#005B60', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  dataCard: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 10, marginTop: 10, minWidth: 180 },
  dataRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dataCardTitle: { fontSize: 12, fontWeight: 'bold', color: '#10B981' },
  dataDetails: { fontSize: 14, fontWeight: '600', color: '#2D3748', marginVertical: 4 },
  viewBtn: { backgroundColor: '#005B60', borderRadius: 6, paddingVertical: 6, alignItems: 'center', marginTop: 4 },
  viewBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' }
});