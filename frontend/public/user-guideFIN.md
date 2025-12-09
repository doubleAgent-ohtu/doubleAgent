### 📖 Käyttöohje: Double Agents

---

### 1. Johdanto

**Double Agents** on tekoälypohjainen chatbot-sovellus, jossa kaksi tekoälybottia (Chatbot A ja Chatbot B) keskustelevat keskenään käyttäjän antaman aloitusviestin pohjalta. Voit muokata bottien käyttäytymistä järjestelmäkehotteilla (system prompts) ja seurata keskustelun etenemistä reaaliajassa.

---

### 2. Käyttöliittymän osat

#### Etusivu

Etusivulla näet kolme pääaluetta:

| Alue                          | Kuvaus                                                 |
| ----------------------------- | ------------------------------------------------------ |
| **Chatbot A** (vasen)         | Vasemmanpuoleisen botin asetukset ja järjestelmäkehote |
| **Keskustelualue** (keskellä) | Bottien välinen keskustelu ja viestien syöttö          |
| **Chatbot B** (oikea)         | Oikeanpuoleisen botin asetukset ja järjestelmäkehote   |

#### Sivuvalikko

- **Homepage** – Palaa etusivulle
- **User Guide** – Avaa käyttöohjeen
- **Settings** – Asetukset (tulossa)
- **Logout** – Kirjaudu ulos
- **Teeman vaihto** – Vaihda vaalean ja tumman teeman välillä (aurinko/kuu-ikoni)

---

### 3. Järjestelmäkehotteiden asettaminen

Järjestelmäkehote (system prompt) määrittää, miten chatbot käyttäytyy keskustelussa.

1. Klikkaa **"Set Prompt"** tai **"Edit Prompt"** -painiketta joko Chatbot A:n tai B:n laatikossa.
2. Avautuvassa ikkunassa:
   - Kirjoita haluamasi järjestelmäkehote **System Prompt** -kenttään.
   - _Valinnainen:_ Anna agentille nimi **Agent Name** -kenttään, jos haluat tallentaa kehotteen.
3. Valitse toiminto:
   - **Set** – Asettaa kehotteen tälle istunnolle
   - **Set & Save** – Asettaa kehotteen ja tallentaa sen tietokantaan myöhempää käyttöä varten

---

### 4. Keskustelun aloittaminen

1. Kirjoita aloitusviesti **"Conversation starter..."** -kenttään.
2. Valitse haluamasi asetukset:
   - **Model** – Valitse käytettävä tekoälymalli (GPT-4o, GPT-4o-mini, GPT-4.1, GPT-5)
   - **Turns** – Määritä keskusteluvuorojen määrä (1–10)
3. Klikkaa **"Start"** -painiketta.
4. Botit alkavat keskustella keskenään. Viestit ilmestyvät keskustelualueelle reaaliajassa.

---

### 5. Keskustelun pysäyttäminen ja tyhjentäminen

- **Pysäytä keskustelu**: Klikkaa punaista **"STOP"** -painiketta keskeyttääksesi keskustelun.
- **Tyhjennä keskustelu**: Klikkaa **"Clear"** -painiketta tyhjentääksesi koko keskustelun ja aloittaaksesi alusta.

---

### 6. Mallin valinta

| Malli           | Kuvaus                                    |
| --------------- | ----------------------------------------- |
| **GPT-4o**      | Oletusvalinta, tasapainoinen suorituskyky |
| **GPT-4o-mini** | Kevyempi ja nopeampi versio               |
| **GPT-4.1**     | Kehittyneempi versio                      |
| **GPT-5**       | Uusin malli                               |

---

### 7. Uloskirjautuminen

1. Avaa sivuvalikko.
2. Klikkaa **"Logout"** -painiketta.
3. Sinut ohjataan takaisin kirjautumissivulle.

---

### 8. Tietosuoja

Sovellus käsittelee henkilötietoja EU:n yleisen tietosuoja-asetuksen (GDPR) mukaisesti. Tarkemmat tiedot löytyvät **Tietosuojaselosteesta**, jonka löydät sovelluksen alaosasta.

---

### 9. Vianmääritys

| Ongelma                  | Ratkaisu                                        |
| ------------------------ | ----------------------------------------------- |
| Kirjautuminen ei onnistu | Tarkista yliopistotunnuksesi ja verkkoyhteys    |
| Keskustelu ei käynnisty  | Varmista, että olet kirjoittanut aloitusviestin |
| Viestit eivät lataudu    | Päivitä sivu ja yritä uudelleen                 |
