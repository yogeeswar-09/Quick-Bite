import { GoogleGenAI } from "@google/genai";
import { MenuItem, Order } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getMealSuggestion = async (preference: string, menu: MenuItem[], pastOrders: Order[] = []) => {
  try {
    const menuString = JSON.stringify(menu.map(m => ({ name: m.name, desc: m.description, category: m.category, isVeg: m.isVeg, price: m.price })));
    
    // Extract names of recently ordered items for context
    const pastItems = pastOrders.flatMap(o => o.items.map(i => i.name)).slice(0, 5);
    const historyString = pastItems.length > 0 ? JSON.stringify(pastItems) : "No past orders (New User)";

    const prompt = `
      You are 'Chef Byte', the resident foodie AI at Quickbite Canteen. 
      Personality: Fun, enthusiastic, uses emojis 😋, and treats the user like a best friend.

      Data Source:
      - Menu: ${menuString}
      - User's Past Orders (Last 5 items): ${historyString}
      - User's Current Vibe/Mood: "${preference}"
      
      Task: Select the single best item from the menu.
      
      Strategy:
      1. Analyze the User's Current Mood.
      2. Look at Past Orders. 
         - If they have a history, try to suggest something with a similar vibe (e.g. if they like spicy, keep it bold) BUT try to suggest something different from their exact last order. Variety is key!
         - If they are a new user, base it purely on the mood.
      3. Match the Mood:
         - Stressed? -> Comfort food (warm, cheesy, carbs).
         - Happy? -> Something light, fresh, or a treat.
         - Hungry? -> The most filling item.
      
      Output format (JSON only, no markdown):
      {
        "suggestedItemName": "Exact Name from Menu",
        "reason": "Your fun explanation here. Be witty. Mention their history if relevant (e.g., 'Since you usually go for [Past Item], trust me, you'll love this update!')."
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("AI Suggestion Error:", error);
    throw error;
  }
};

export const chatWithSupport = async (message: string, history: {role: string, content: string}[]) => {
  try {
    const systemInstruction = `
      You are Quickbite's friendly AI support assistant.
      Your Role: Help students with ordering food, pickup slots, payments, and finding menu items on the Quickbite app.
      Rules:
      1. ONLY answer questions related to the Quickbite app/canteen.
      2. If asked about homework, math, or general knowledge, politely refuse and say you are only here for food.
      3. Be concise and cheerful.
      4. If users ask about order status, tell them to check the 'Orders' page.
    `;

    // Convert simple history to Gemini format if needed, but here we just append context.
    // For simplicity in this demo, we'll just send the message with system instruction context.
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: message,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Chatbot Error:", error);
    return "I'm having trouble connecting to the kitchen right now. Please try again!";
  }
};