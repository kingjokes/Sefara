import { useCallback, useState } from "react";
import axios from "axios";
import "./App.css";
import { postRequest } from "./utils/apiRequests";
import ToastMessage from "./utils/toastMessage";

function App() {
  const [loading, setLoading] = useState(false);
  const [list, showList] = useState(false);
  const [listContent, setListContent] = useState("");
  const [input, setInput] = useState("");
  const submitCommand = useCallback(async () => {
    
    if (!input) return ToastMessage("error", "Input can not be empty");
    setLoading(true);
    await postRequest("command", { command: input })
      .then((response) => response.data)
      .then((response) => {
        setLoading(false);
        ToastMessage(response.status ? "success" : "error", response.message);
        if (response.status) {
          // setInput('')
          if(response.data){
            showList(true);
            setListContent(response.data);
          }
        
          
        }
      })
      .catch((e) => {
        setLoading(false);
      });
  }, [input, setLoading]);

  return (
    <div
      style={{
        textAlign: "center",
        paddingTop: "100px",
      }}
    >
      <h1>Directory Creator</h1>
      <br />

      <div>
        <input
          required
          value={input}
          onChange={({ target }) => setInput(target.value)}
          type={"text"}
          placeholder="Enter your command, e.g. CREATE fruit"
          style={{
            padding: "15px 30px",
            minWidth: 500,
            maxWidth: "100%",
            borderRadius: 10,
            border: "0",
          }}
        />
        <br />
        <br />

        <br />
        <button onClick={() => submitCommand()}>
          {loading ? "Processing" : "Run Command"}
        </button>
      </div>

      {list && (
        <div
          style={{
            margin: "0 auto",
            border: "1px solid grey",
            maxWidth: 400,
            padding: "20px 10px",
            marginTop: 10,
            borderRadius: 10,
            textAlign:'left',
            fontSize:18
          }}
        >
          <div style={{ textAlign: "right" }} onClick={() => showList(false)}>
            <button title="Close result">x</button>
          </div>

          <pre dangerouslySetInnerHTML={{ __html: listContent }}></pre>
        </div>
      )}
    </div>
  );
}

export default App;
