# VayoVeda - Backend Hosting & APK Generation Steps

**⚠️ ZAROORI BAAT (IMPORTANT) ⚠️**
APK banne se **pehla** kaam aapko backend host karna hoga. Kyunki jab tak backend live nahi hoga app kis URL par call karega? Backend deploy hone ke baad jo URL mile, usse front-end code mein dalo, uske baad hi APK banana.

---

## Part 1: Backend Kahan Aur Kaise Host Karein?
Aapka project `server.js` mein Express aur `node-schedule` (Background timers) ka use kar raha hai. Vercel aisi background background jobs wale backend ko kill kar deta hai. Isliye isko persistent Server(Web Service) me host krna jaruri hai. 

**Best Platforms for Node.js (Background Workers):**
- **Render.com** (Sabse badhiya for your use case, aur iska free tier bhi iske liye perfect hai).
- **Railway.app** (Easy setup but you need to check free credits).

### Render.com Par Backend Host Karne Ke Steps:
1. Apne VayoVeda project(ya sirf backend logic file waale folder ko) **GitHub** par push kar do.
2. Render.com par account banao aur login karo.
3. Dashboard me "**New +**" par click karo aur "**Web Service**" option pick karo.
4. Apna GitHub account link karke apne repository ko select karo.
5. Setup Settings:
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
6. Niche "**Environment Variables**" tab mein jaake apni zaroori `.env` file ki keys configure kar do:
   - `TWILIO_ACCOUNT_SID=...`
   - `TWILIO_AUTH_TOKEN=...`
   - `TWILIO_PHONE_NUMBER=...`
   - `RECEIVER_PHONE_NUMBER=...` 
   - `GEMINI_API_KEY=...`
7. Uske baad "**Deploy Wait Service**" (Save) par click karo.
8. Kuch seconds mein Render aapko ek live URL de dega example: `https://vayoveda-backend-xyz.onrender.com`.

---

## Part 2: App Code Ko Update Karna
1. Ab apko jo nayi Render wali URL mili hai, apne App code (`app` ya `components` folders) mein jidhar bhi aapne `http://localhost:5000` ya `http://192.168.x.x:5000` lagaya hai... usko apne naye link se replace kardo.

---

## Part 3: App Ko APK Mein Badalte Hain (Expo EAS Build)
Code me link badalne aur usko save karne ke baad, ab hum app ka live `.APK` file Generate karenge! 
VsCode ka Naya Terminal start karo aur the step-by-step follow karo:

**Step 1:** EAS-CLI download or install karo (Only one-time setup zaruri hai):
```bash
npm install -g eas-cli
```

**Step 2:** Apne Expo Account me login karo (Nahi hai to expo.dev se signup kro):
```bash
eas login
```

**Step 3:** Project me platform configure karo build ke liye:
```bash
eas build:configure
```
*(Dhayan rakho - jab yeh hoga, ek `eas.json` file banegi, aapko ensure karna padega ki "buildType: apk" andar added ho. Android build preview me. Wahan Aise dikhna chahiye file ke andar: )*
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {}
  }
}
```

**Step 4:** APK Banane ke process start karo is cmd ke saath:
```bash
eas build -p android --profile preview
```

**Step 5:** Processing finish hone mein thoda time lagta hai, tab tak aap sabar rakho. Complete hone ke baad console pe hi ek Download URL link aaegi. Us se seedha phone ya Pc pe `.apk` App Download and Install karkar chala lo.
