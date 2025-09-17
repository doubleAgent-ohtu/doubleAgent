import { useState, useEffect } from "react"
import axios from "axios"

const App = () => {
  // Luodaan kaksi react statea
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState([])

  useEffect(() => {
    fetch("http://127.0.0.1:8000/messages")
      .then((res) => res.json())
      .then((data) => setMessages(data.messages))
  }, []) // useEffect hook hakee viestit backendistä vain kerran, kun komponentti mountataan eli kun sivu ladataan

  const handleSubmit = async (e) => {
    e.preventDefault() // Tämä estää html form elementin oletuskäyttäytymisen (sivun uudelleenlataus)
    try {
      const res = await axios.post("http://127.0.0.1:8000/add", { text: input }) // Lähetetään POST pyyntö backendille axios kirjaston avulla

      setMessages(res.data.messages)
      setInput("") // Tyhjennetään input kenttä
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Our simple walking skeleton</h1>
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type something"
        />
        <button type="submit">Add</button>
      </form>

      <div style={{ marginTop: "1rem" }}>
        <h2>Messages:</h2>
        <pre>{JSON.stringify(messages, null, 2)}</pre>
      </div>
    </div>
  )
}

export default App
