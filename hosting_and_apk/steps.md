# VayoVeda - Backend Hosting & APK Generation Steps

**⚠️ ZAROORI BAAT (IMPORTANT) ⚠️**
APK banne se **pehla** kaam aapko backend host karna hoga. Kyunki jab tak backend live nahi hoga app kis URL par call karega? Backend deploy hone ke baad jo URL mile, usse front-end code mein dalo, uske baad hi APK banana.

---

## Part 1: Backend Deployment (Render.com)
Maine aapka backend ek alag `backend/` folder mein shift kar diya hai taaki Render sirf backend install kare aur frontend ke errors na aaye.

### Render Setup (Important Changes):
1. Pehle Github par naya code push karo (`git push origin main`).
2. Render Dashboard mein jao.
3. **Settings** mein jaao aur yeh cheezein check/update karo:
   - **Root Directory:** `backend` (Yeh sabse important hai, isse frontend ke error nahi aayenge).
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
4. **Environment Variables** (Secrets) mein wahi `.env` wali keys check kar lena (Twilio, Gemini, etc.).
5. Sab Save karke **Manual Deploy** -> **Clear Build Cache & Deploy** kar dena.

---

## Part 2: App Code Ko Update Karna
Render se jo nayi URL mile (e.g. `https://vayoveda-backend.onrender.com`), usse apne mobile app ke code mein jahan bhi `localhost:5000` hai wahan replace kardo.

---

## Part 3: App Ko APK Mein Badalte Hain (Expo EAS Build)
APK banane ke steps wahi hain:
1. `npm install -g eas-cli`
2. `eas login`
3. `eas build:configure` (Check `eas.json` for `buildType: apk`)
4. `eas build -p android --profile preview`


**Step 5:** Processing finish hone mein thoda time lagta hai, tab tak aap sabar rakho. Complete hone ke baad console pe hi ek Download URL link aaegi. Us se seedha phone ya Pc pe `.apk` App Download and Install karkar chala lo.
