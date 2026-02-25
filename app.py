from dotenv import load_dotenv
from groq import Groq
import json
import os
import pickle
from flask import Flask, render_template, request, jsonify
load_dotenv()

app = Flask(__name__)

# ---------- Config ----------
app.config["MODEL_PATH"] = os.path.join(app.root_path, "model.pkl")
app.config["VECTORIZER_PATH"] = os.path.join(app.root_path, "vectorizer.pkl")
app.config["DEBUG"] = os.getenv("FLASK_DEBUG", "0") == "1"
app.config["GROQ_API_KEY"] = os.getenv("GROQ_API_KEY", "")


# ---------- Load artifacts ----------
model = None
vectorizer = None

try:
    with open(app.config["MODEL_PATH"], "rb") as f:
        model = pickle.load(f)
    with open(app.config["VECTORIZER_PATH"], "rb") as f:
        vectorizer = pickle.load(f)
    print("✓ Model and vectorizer loaded successfully")
except Exception as exc:
    print(f"✗ Error loading model/vectorizer: {exc}")
    model = None
    vectorizer = None


# ---------- Word reason map ----------
WORD_REASONS = {
    # Urgency / pressure
    "urgent": "Creates urgency to pressure quick action",
    "immediately": "Pressures you to act without thinking",
    "limited": "Fake scarcity to force fast decisions",
    "expire": "Urgency tactic — fear of missing out",
    "hurry": "Pressure tactic to bypass rational thinking",
    "asap": "Urgency language to prevent you from thinking clearly",
    "now": "Immediate action pressure — classic manipulation tactic",
    "today": "Time pressure to force hasty decisions",
    "deadline": "Artificial deadline to create panic",

    # Money / rewards
    "bonus": "Promise of extra money is a common lure",
    "offer": "Vague offer language used to attract victims",
    "prize": "Classic prize/lottery scam signal",
    "won": "Fake winning claims to bait victims",
    "free": "Too-good-to-be-true free offer tactic",
    "cash": "Direct money mention to lure victims",
    "reward": "Reward promises used as bait",
    "earn": "Unrealistic earning claims attract victims",
    "salary": "Fake salary promises in job scams",
    "commission": "Common word in fake job/task scams",
    "daily": "Promises of daily earnings — task/job scam signal",
    "income": "Fake income promise to attract victims",
    "payment": "Payment mention to build false legitimacy",
    "refund": "Fake refund used to steal banking details",
    "cashback": "Fake cashback to steal account info",
    "money": "Direct money mention — financial scam signal",
    "transfer": "Money transfer request — common in fraud",
    "deposit": "Deposit request before receiving reward — scam tactic",
    "withdrawal": "Withdrawal mention to make scam feel real",
    "profit": "Profit promise — common in investment scams",
    "investment": "Fake investment pitch — financial scam signal",
    "guaranteed": "No legitimate offer guarantees returns",
    "returns": "Guaranteed returns promise — investment scam signal",

    # Numbers (often money amounts)
    "200": "Specific amount used to make fake offer feel real",
    "500": "Specific amount used to make fake offer feel real",
    "800": "Money amount — common in fake job/task offers",
    "1000": "Round number promise typical in task scams",
    "5000": "Large amount promise used as bait",
    "450": "Specific amount used to make fake offer feel credible",
    "100": "Small amount to seem low-risk and enticing",
    "2000": "Money amount — common bait in task/job scams",
    "10000": "Large sum promise — high-value scam bait",

    # Contact / communication
    "contact": "Asking you to contact — may lead to info harvesting",
    "whatsapp": "Moves conversation off-platform to avoid detection",
    "telegram": "Unofficial channel — common in scam recruitment",
    "click": "Directing to click a link — phishing risk",
    "link": "External link — potential phishing page",
    "call": "Unsolicited call request — social engineering risk",
    "phone": "Phone number request or call — social engineering tactic",
    "number": "Requesting a number — often used to escalate contact",
    "reply": "Reply pressure — used to initiate scam conversation",
    "pm": "Private message request — tries to move you off public channels",
    "dm": "Direct message to avoid scrutiny — common scam tactic",
    "text": "Text-based contact — used to initiate phishing chain",

    # Account / credentials
    "otp": "OTP request is a major red flag — never share",
    "pin": "PIN request — banks never ask for this",
    "password": "Password request — always a red flag",
    "verify": "Fake verification used to steal credentials",
    "kyc": "KYC used as a pretext to harvest identity info",
    "account": "Account mention to build false legitimacy",
    "login": "Login request outside official app is suspicious",
    "access": "Requesting access to your account or device — major red flag",
    "credentials": "Credential request — identity theft risk",
    "details": "Asking for personal details — data harvesting attempt",
    "information": "Requesting personal information — phishing signal",
    "identity": "Identity-related request — potential ID fraud",
    "bank": "Bank mention — financial phishing signal",
    "card": "Card details request — payment fraud risk",
    "cvv": "CVV request — banks never ask for this, always a scam",

    # Apps / tech
    "app": "App download request — could be malicious software",
    "download": "Download request — risk of malware or spyware",
    "install": "Install request — potential malicious app",
    "apk": "APK install request — major red flag, bypasses app store safety",
    "software": "Software install — could be used for remote access",
    "remote": "Remote access request — scammers use this to control your device",

    # Social engineering
    "friend": "Impersonating a friend or mutual contact — social engineering",
    "family": "Family impersonation — emotional manipulation tactic",
    "help": "Fake help request — used to create emotional urgency",
    "emergency": "Fake emergency to bypass rational thinking",
    "trust": "Overemphasis on trust — common manipulation signal",
    "safe": "False safety assurance to lower your guard",
    "legit": "Overasserting legitimacy — scammers often do this",
    "official": "Fake official claim — impersonation red flag",
    "government": "Government impersonation — authority-based scam",
    "winner": "Fake winner announcement — lottery/prize scam",
    "selected": "Fake selection claim — lottery/job scam signal",
    "congratulations": "Classic scam opener for prize/lottery fraud",
    "exclusive": "Exclusivity claim to make victim feel special",
    "special": "Special offer language — bait tactic",

    # Job / task scams
    "job": "Unsolicited job offer — common scam vector",
    "hiring": "Fake hiring message to harvest personal data",
    "task": "Task-based scam — victims paid small amounts first, then defrauded",
    "training": "Fake training to make scam seem legitimate",
    "apply": "Apply now pressure — fake job scam tactic",
    "vacancy": "Fake vacancy listing — recruitment scam signal",
    "interview": "Fake interview invite — used to harvest personal info",
    "work": "Work from home or part-time work offer — scam signal",
    "part": "Part-time offer language — task scam signal",
    "home": "Work from home promise — common in task scams",

    # Delivery scams
    "parcel": "Fake parcel alert to steal delivery fees or info",
    "delivery": "Fake delivery notification — phishing signal",
    "shipment": "Fake shipment used to harvest personal details",
    "customs": "Fake customs fee demand — common delivery scam",
    "courier": "Fake courier message to steal payment details",
    "package": "Fake package notification — delivery phishing",
    "address": "Address request — identity or delivery scam signal",

    # Generic scam language
    "videos": "Vague task content (e.g. like videos) — task scam signal",
    "hotels": "Vague task content (e.g. rate hotels) — task scam signal",
    "survey": "Fake survey used to harvest personal info",
    "subscription": "Fake subscription charge — billing scam signal",
    "charge": "Unexpected charge claim — billing fraud tactic",
    "cancel": "Cancel subscription urgency — billing scam pressure",
    "activate": "Fake activation request — phishing tactic",
    "confirm": "Confirmation request — used to verify active targets",
    "update": "Fake update request — credential phishing signal",
}


def get_word_reason(word: str) -> str:
    w = word.lower()
    if w in WORD_REASONS:
        return WORD_REASONS[w]
    if w.isdigit():
        return "Specific number — possibly a fake money amount to seem credible"
    if len(w) <= 2:
        return "Short token flagged by model — may appear frequently in scam context"
    if w.endswith("ing"):
        return "Action word associated with scam instructions in training data"
    return "Word statistically linked to scam patterns in training data"


# ---------- Uncertainty & follow-up adjustment ----------
FOLLOWUP_QUESTIONS = [
    {"id": "q1", "text": "Did YOU initiate this contact/transaction?", "safe_answer": "yes"},
    {"id": "q2", "text": "Do you personally know the sender?", "safe_answer": "yes"},
    {"id": "q3", "text": "Does the message ask for OTP, PIN, or password?", "safe_answer": "no"},
    {"id": "q4", "text": "Does it contain a link you are asked to click?", "safe_answer": "no"},
]


def adjust_probability(base_prob: float, answers: dict) -> float:
    p = base_prob
    for q in FOLLOWUP_QUESTIONS:
        user_ans = (answers.get(q["id"], "") or "").lower().strip()
        if user_ans and user_ans != q["safe_answer"]:
            p += 0.08
    return min(p, 0.99)


# ---------- LLM explanation ----------
def generate_llm_explanation(message: str, scam_type: str, probability: int, highlights: list) -> dict:
    try:
        client = Groq(api_key=app.config["GROQ_API_KEY"])
        flagged = ", ".join([f'"{w}" (impact {s:.2f})' for w, s, r in highlights[:5]])
        prompt = f"""You are a cybersecurity AI assistant specializing in scam detection in India.
Message: \"\"\"{message}\"\"\"
ML Results: Scam Type: {scam_type}, Risk: {probability}%, Flagged words: {flagged}

Reply ONLY in this JSON format with no extra text:
{{
  "scam_goal": "1-2 sentences on what this scam wants",
  "what_to_do": "2-3 specific actions to take now",
  "how_to_avoid": "2-3 tips to avoid this scam"
}}"""
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=400,
        )
        raw = response.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        result = json.loads(raw.strip())
        return result
    except Exception as exc:
        print(f"LLM ERROR: {exc}")
        return None


# ---------- Explainability helpers ----------
def get_class1_index():
    classes = list(model.classes_)
    if 1 not in classes:
        raise ValueError("Model does not contain class 1")
    return classes.index(1)


def predict_proba_class1(text: str) -> float:
    X = vectorizer.transform([text])
    probas = model.predict_proba(X)
    idx1 = get_class1_index()
    return float(probas[0][idx1])


def top_contributing_words(text: str, top_k: int = 8):
    X = vectorizer.transform([text])
    idx1 = get_class1_index()

    coef = model.coef_
    if coef.shape[0] == 1:
        weights = coef[0]
    else:
        weights = coef[idx1]

    feature_names = vectorizer.get_feature_names_out()

    row = X.tocoo()
    contribs = []
    for j, v in zip(row.col, row.data):
        w = weights[j]
        score = float(v * w)
        if score > 0:
            word = feature_names[j]
            reason = get_word_reason(word)
            contribs.append((word, score, reason))

    contribs.sort(key=lambda x: x[1], reverse=True)
    return contribs[:top_k]


# ---------- Web page route ----------
@app.route("/", methods=["GET", "POST"])
def home():
    status = None
    probability = None
    risk_level = None
    scam_type = None
    scam_goal = None
    what_to_do = None
    how_to_avoid = None
    message = ""
    highlights = []
    is_uncertain = False
    followup_questions = []
    followup_answers = {}
    followup_submitted = False

    if request.method == "POST":
        message = request.form.get("message", "").strip()
        followup_submitted = request.form.get("followup_submitted") == "1"

        for q in FOLLOWUP_QUESTIONS:
            ans = request.form.get(q["id"], "").strip()
            if ans:
                followup_answers[q["id"]] = ans

        if message and model and vectorizer:
            try:
                p = predict_proba_class1(message)

                if followup_submitted and followup_answers:
                    p = adjust_probability(p, followup_answers)

                probability = int(round(p * 100))

                if 35 <= probability <= 65 and not followup_submitted:
                    is_uncertain = True
                    followup_questions = FOLLOWUP_QUESTIONS
                    risk_level = "Uncertain"
                    status = "Needs More Context"
                elif probability >= 80:
                    risk_level = "Very High"
                    status = "SCAM"
                elif probability >= 65:
                    risk_level = "High"
                    status = "Likely Scam"
                elif probability >= 35:
                    risk_level = "Medium"
                    status = "Suspicious"
                else:
                    risk_level = "Low"
                    status = "Likely Safe"

                highlights = top_contributing_words(message, top_k=8)

                msg_lower = message.lower()
                if any(w in msg_lower for w in ["otp", "verification code", "login code"]):
                    scam_type = "OTP / Verification Code Hijack"
                elif any(w in msg_lower for w in ["kyc", "account suspended", "verify your account"]):
                    scam_type = "KYC / Account Verification Phishing"
                elif any(w in msg_lower for w in ["job", "hiring", "work from home", "task", "commission", "salary per day"]):
                    scam_type = "Recruitment / Task Scam"
                elif any(w in msg_lower for w in ["delivery", "parcel", "shipment", "customs", "courier"]):
                    scam_type = "Delivery / Logistics Phishing"
                elif any(w in msg_lower for w in ["refund", "cashback"]):
                    scam_type = "Refund / Cashback Scam"
                elif any(w in msg_lower for w in ["won", "lottery", "prize", "claim"]):
                    scam_type = "Lottery / Prize Scam"
                else:
                    scam_type = "General Scam / Phishing"

                llm = generate_llm_explanation(message, scam_type, probability, highlights)

                if llm:
                    scam_goal = llm.get("scam_goal", "")
                    what_to_do = llm.get("what_to_do", "")
                    how_to_avoid = llm.get("how_to_avoid", "")
                else:
                    if status in ["SCAM", "Likely Scam", "Suspicious"]:
                        scam_goal = "Likely trying to steal money, account access, or personal/banking information."
                        what_to_do = "Do NOT click links or share OTP/PIN/CVV. Verify using official app/website or known phone number."
                        how_to_avoid = "Slow down, check domain/sender, avoid urgency pressure, never share OTPs."
                    elif status == "Needs More Context":
                        scam_goal = "Cannot determine intent confidently — please answer the questions below."
                        what_to_do = "Answer the follow-up questions so we can refine the analysis."
                        how_to_avoid = "When in doubt, do not click links or share personal information."
                    else:
                        scam_goal = "No strong scam intent detected from ML signals."
                        what_to_do = "No immediate action required, but stay cautious with unexpected links or requests."
                        how_to_avoid = "Verify unknown senders and avoid sharing sensitive details."

            except Exception as exc:
                app.logger.exception("Error during ML analysis: %s", exc)

    return render_template(
        "index.html",
        status=status,
        probability=probability,
        risk_level=risk_level,
        scam_type=scam_type,
        scam_goal=scam_goal,
        what_to_do=what_to_do,
        how_to_avoid=how_to_avoid,
        message=message,
        highlights=highlights,
        is_uncertain=is_uncertain,
        followup_questions=followup_questions,
        followup_submitted=followup_submitted,
    )


# ---------- JSON API route (for fetch / no reload) ----------
@app.route("/api/analyze", methods=["POST"])
def api_analyze():
    status = None
    probability = None
    risk_level = None
    scam_type = None
    scam_goal = None
    what_to_do = None
    how_to_avoid = None
    message = ""
    highlights = []
    is_uncertain = False
    followup_questions = []
    followup_answers = {}
    followup_submitted = False

    data = request.get_json(silent=True) or {}
    message = (data.get("message") or "").strip()
    followup_answers = data.get("followup_answers") or {}
    followup_submitted = bool(data.get("followup_submitted"))

    if message and model and vectorizer:
        try:
            p = predict_proba_class1(message)

            if followup_submitted and followup_answers:
                p = adjust_probability(p, followup_answers)

            probability = int(round(p * 100))

            if 35 <= probability <= 65 and not followup_submitted:
                is_uncertain = True
                followup_questions = FOLLOWUP_QUESTIONS
                risk_level = "Uncertain"
                status = "Needs More Context"
            elif probability >= 80:
                risk_level = "Very High"
                status = "SCAM"
            elif probability >= 65:
                risk_level = "High"
                status = "Likely Scam"
            elif probability >= 35:
                risk_level = "Medium"
                status = "Suspicious"
            else:
                risk_level = "Low"
                status = "Likely Safe"

            highlights = top_contributing_words(message, top_k=8)

            msg_lower = message.lower()
            if any(w in msg_lower for w in ["otp", "verification code", "login code"]):
                scam_type = "OTP / Verification Code Hijack"
            elif any(w in msg_lower for w in ["kyc", "account suspended", "verify your account"]):
                scam_type = "KYC / Account Verification Phishing"
            elif any(w in msg_lower for w in ["job", "hiring", "work from home", "task", "commission", "salary per day"]):
                scam_type = "Recruitment / Task Scam"
            elif any(w in msg_lower for w in ["delivery", "parcel", "shipment", "customs", "courier"]):
                scam_type = "Delivery / Logistics Phishing"
            elif any(w in msg_lower for w in ["refund", "cashback"]):
                scam_type = "Refund / Cashback Scam"
            elif any(w in msg_lower for w in ["won", "lottery", "prize", "claim"]):
                scam_type = "Lottery / Prize Scam"
            else:
                scam_type = "General Scam / Phishing"

            llm = generate_llm_explanation(message, scam_type, probability, highlights)

            if llm:
                scam_goal = llm.get("scam_goal", "")
                what_to_do = llm.get("what_to_do", "")
                how_to_avoid = llm.get("how_to_avoid", "")
            else:
                if status in ["SCAM", "Likely Scam", "Suspicious"]:
                    scam_goal = "Likely trying to steal money, account access, or personal/banking information."
                    what_to_do = "Do NOT click links or share OTP/PIN/CVV. Verify using official app/website or known phone number."
                    how_to_avoid = "Slow down, check domain/sender, avoid urgency pressure, never share OTPs."
                elif status == "Needs More Context":
                    scam_goal = "Cannot determine intent confidently — please answer the questions below."
                    what_to_do = "Answer the follow-up questions so we can refine the analysis."
                    how_to_avoid = "When in doubt, do not click links or share personal information."
                else:
                    scam_goal = "No strong scam intent detected from ML signals."
                    what_to_do = "No immediate action required, but stay cautious with unexpected links or requests."
                    how_to_avoid = "Verify unknown senders and avoid sharing sensitive details."

        except Exception as exc:
            app.logger.exception("Error during ML analysis: %s", exc)

    return jsonify({
        "message": message,
        "status": status,
        "probability": probability,
        "risk_level": risk_level,
        "scam_type": scam_type,
        "scam_goal": scam_goal,
        "what_to_do": what_to_do,
        "how_to_avoid": how_to_avoid,
        "highlights": highlights,
        "is_uncertain": is_uncertain,
        "followup_questions": followup_questions,
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=app.config["DEBUG"])