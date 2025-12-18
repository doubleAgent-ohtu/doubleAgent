import os
import pytest


@pytest.fixture
def test_db(mocker):
    """Create test database (local fixture)."""
    mocker.patch.dict(os.environ, {"DA_DB_URL": "sqlite:///:memory:"})

    from app.db.models import Base
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.pool import StaticPool

    test_engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=test_engine)
    TestingSessionLocal = sessionmaker(
        autocommit=False, autoflush=False, bind=test_engine
    )
    return TestingSessionLocal


@pytest.fixture
def test_client(test_db, mocker):
    """Create test client with mocked dependencies (local fixture)."""
    mocker.patch.dict(
        os.environ,
        {
            "DA_OPENAI_API_KEY": "test-key-123",
            "OPENAI_API_KEY": "test-key-123",
        },
    )

    from fastapi.testclient import TestClient
    from app.main import app, get_db, get_user_id

    def override_get_db():
        db = test_db()
        try:
            yield db
        finally:
            db.close()

    def override_get_user_id():
        return "test_user_123"

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_user_id] = override_get_user_id

    client = TestClient(app)
    yield client

    app.dependency_overrides.clear()

def test_save_and_get_prompts(test_client):
    """Save a prompt and retrieve it via /get_prompts."""
    payload = {"agent_name": "agent1", "prompt": "This is a test prompt"}
    r = test_client.post("/save_prompt", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert data["agent_name"] == "agent1"

    get_r = test_client.get("/get_prompts")
    assert get_r.status_code == 200
    prompts = get_r.json()
    assert any(p["agent_name"] == "agent1" for p in prompts)


def test_save_long_prompt(test_client):
    prompt_text = (
'''You are Olga Zemp, a 56-year-old woman with elevated blood pressure, high cholesterol, and prediabetes seeking guidance on weight management and overall health.
Persona: 
Olga has mildly elevated hypertension (~134/83 mmHg), high LDL cholesterol (3.2 mmol/L), and prediabetes (fasting glucose 6.8 mmol/L). She measures her blood pressure monthly, takes Cardace and Atorvastatin daily, and uses Panadol for occasional headaches. Her height is 167 cm, weight 85 kg (BMI 30.5 kg/m²), and waist circumference 102 cm. She has a family history of cardiovascular disease, type 2 diabetes, and central obesity.
Topics on Persona (Background & Context): 
Olga lives alone in a small Helsinki suburb, works full-time at a sedentary office job, and walks her dog twice daily. She swims once a week but has seen little weight change. She tries to eat four meals daily, favors “Heart Symbol” products, but stress often leads her to replace meals with coffee (3-4 cups/day). She aims for 7 hours of sleep but experiences fragmented sleep. Since menopause, she has gained abdominal fat, experiences knee pain and swelling, and has tried various fad diets without success. She has never seen a dietician. Olga is motivated to lose weight as it interferes with daily activities. She is curious about semaglutide (Ozempic) but has never used weight-loss medication.
Goal: 
The user (counselor or healthcare professional) should demonstrate empathy, ask open-ended questions to uncover Olga's concerns, and provide constructive guidance on lifestyle and medication options without rushing to prescribe.
Conversational Guidance:
- Stay in Character: Respond as Olga would — cautious, somewhat anxious, and honest about her struggles.
- Reveal Limited Knowledge: Speak from Olga's perspective: refer only to facts she knows and do NOT invent new clinical data. Keep responses simple, avoid detailed explanations, and express uncertainty. Admitting to not knowing is fine.
- Express Emotional Cues: Express frustration or discouragement regarding weight issues.
- Deflect Technical Questions: Reply with uncertainty for questions beyond her knowledge with phrases like “I'm not sure” or “I haven't discussed that with my doctor.”
- Share Realistic Lifestyle Details: Provide straightforward answers consistent with her background.
- Seek Reassurance: Express hesitation or uncertainty when offered a plan.
- Limit Response Length: Keep replies brief and be succinct in reasoning. Introduce 4-5 follow-up questions naturally throughout the session to maintain engagement.
Example Responses:
- Opening Inquiry: “Hi Olga, I see you're interested in managing your weight and blood sugar. What brings you in today?” the counselor asks.“I know I need to lose weight, but I feel stuck.” Olga responds.
- Counselor Suggests Lifestyle Change: “How about we review your daily meals and find one small change — maybe swapping your afternoon coffee for a healthy snack?” the counselor suggests. “I often skip lunch and then overeat at dinner. What kind of snack would be best to keep my energy up until dinner?” Olga enquiries.
- Counselor Mentions Ozempic: “Given your BMI and prediabetes, semaglutide (Ozempic) could be an option alongside lifestyle changes. How does that sound?” the counselor suggests. “I've heard of it, but I'm worried about side effects. How does it complement my current medications?” Olga responds.
- Emotional or Pain Point: Counselor: “I understand this is hard. When you feel knee pain or fatigue, what usually happens?” the counselor asks.“My knees ache, and I end up sitting more. I've gained some useful ideas today; I look forward to trying them out.” Olga responds.
General Instructions & Directives:
- Maintain Privacy: Do not reveal Olga's personal identifiers beyond what's provided and needed for a successful consultation.
- Adhere to Medical Context: Reference only the lab values, medications, and lifestyle details listed. Avoid too much detail or judgements on medical facts.
- Admit Uncertainty: Use phrases like “I'm not sure” or “I didn't remember” for details Olga doesn't know.
- Empathy First: Acknowledge frustration or overwhelm before proceeding with suggestions.
- Keep Responses Brief: Limit replies to two sentences, reflecting Olga's straightforward communication style. Keep follow-up questions limited to 4-5 naturally over a session to avoid overwhelming dialogue.
- Philosophical Pondering: Avoid venturing into complex philosophical discussions.
Light Audit Checklist:
Post-session, Olga should reflect on key takeaways and potential action points to naturally conclude the conversation. For example, confirming intent to follow through on a small goal discussed.
Now behave exactly like Olga Zemp when I start chatting. Respond only as she would, following the background, goals, and rules above.'''
    )
    prompt_data = {
        'agent_name': 'Olga Zemp',
        'prompt': prompt_text
    }
    response = test_client.post("/save_prompt", json=prompt_data)
    assert response.status_code == 200
    data = response.json()
    assert data['agent_name'] == 'Olga Zemp'
    assert data['prompt'] == prompt_text


def test_save_duplicate_agent_name_returns_409(test_client):
    """Saving two prompts with same agent_name should return 409 on second save."""
    payload = {"agent_name": "dup", "prompt": "p"}
    r1 = test_client.post("/save_prompt", json=payload)
    assert r1.status_code == 200
    r2 = test_client.post("/save_prompt", json=payload)
    assert r2.status_code == 409


def test_update_prompt_and_conflicts(test_client):
    """Update a prompt and ensure name conflicts are handled."""
    p1 = {"agent_name": "one", "prompt": "p1"}
    p2 = {"agent_name": "two", "prompt": "p2"}
    r1 = test_client.post("/save_prompt", json=p1)
    r2 = test_client.post("/save_prompt", json=p2)
    assert r1.status_code == 200
    assert r2.status_code == 200

    id2 = r2.json()["id"]

    # Attempt to rename second prompt to the first's name -> should conflict
    conflict_payload = {"agent_name": "one", "prompt": "changed"}
    r_conflict = test_client.put(f"/update_prompt/{id2}", json=conflict_payload)
    assert r_conflict.status_code == 409

    # Update second prompt to a new unique name -> should succeed
    update_payload = {"agent_name": "two-new", "prompt": "updated"}
    r_update = test_client.put(f"/update_prompt/{id2}", json=update_payload)
    assert r_update.status_code == 200
    assert r_update.json()["agent_name"] == "two-new"


def test_delete_prompt(test_client):
    """Delete a prompt and ensure it's removed."""
    payload = {"agent_name": "delme", "prompt": "please delete"}
    r = test_client.post("/save_prompt", json=payload)
    assert r.status_code == 200
    pid = r.json()["id"]

    d = test_client.delete(f"/delete_prompt/{pid}")
    assert d.status_code == 200

    # Ensure prompt is gone
    get_r = test_client.get("/get_prompts")
    assert get_r.status_code == 200
    assert all(p["id"] != pid for p in get_r.json())


def test_error_saving_empty_prompt(test_client):
    prompt_data = {
        'agent_name': 'Pirate',
        'prompt': ' '
    }
    response = test_client.post("/save_prompt", json=prompt_data)
    assert response.status_code == 422
    assert response.json()['detail'][0]['msg'] == 'Value error, Missing prompt'


def test_error_saving_empty_agent_name(test_client):
    prompt_data = {
        'agent_name': ' ',
        'prompt': 'Talk like a pirate.'
    }
    response = test_client.post("/save_prompt", json=prompt_data)
    assert response.status_code == 422
    assert response.json()['detail'][0]['msg'] == 'Value error, Missing agent name'
