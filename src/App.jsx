import { useState } from 'react'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import './App.css'
import useClipboard from "react-use-clipboard";
import axios from 'axios';

function App() {
  const [copyText, setCopyText] = useState("");
  const [isCopied, setCopied] = useClipboard(copyText);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState();
  const [loading, setLoading] = useState(false);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>;
  }

  // start listening 
  const listeningStart = () => SpeechRecognition.startListening({ continuous: true });

  // stop listening
  const listeningStop = () => {
    setCopyText(transcript);
    SpeechRecognition.stopListening();
  }

  // translate to english using Openapi
  const handleSummarize = async () => {
    const apiKey = import.meta.env.VITE_OPENAI_KEY; // Ensure your API key is stored in environment variables

    try {
      const res = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: "gpt-3.5-turbo", // or "gpt-4" if available
          messages: [
            {
              role: "user",
              content: "translate into English: kya hall hay bhai apka?"
            }
          ],
          max_tokens: 100,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
        }
      );

      setResponse(res.data.choices[0].message.content);
    } catch (error) {
      console.error('Error making API call:', error);
      setResponse('Error making API call');
    }
  };

  // handle api call to Gemini ai
  const handleTranslate = async (lang) => {
    const apiKey = import.meta.env.VITE_GEMINI_KEY; // Ensure your API key is stored in environment variables

    try {
      setLoading(true);
      const res = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`,
        {
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `please translate this into ${lang}, ${copyText}`
                }
              ]
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      console.log(res.data);

      const generatedText = res.data.candidates[0].content.parts[0].text;
      setResponse(generatedText);
      setLoading(false);
      setError('');
    } catch (err) {
      console.error('Error making API call:', err);
      setError('Error making API call');
      setResponse('');
    }
  };

  // text to speak
  const handleSpeak = () => {
    const voices = window.speechSynthesis.getVoices();
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(copyText);
      const selectedVoiceObject = voices.find((voice) => voice.name === selectedVoice);
      utterance.voice = selectedVoiceObject;
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Sorry, your browser does not support text-to-speech.');
    }
  };




  return (
    <>
      {
        loading && <div className='loadingWrapper'>
          <span className="loading loading-spinner text-error loading-lg"></span>
        </div>
      }

      <div>
        <h2 className='text-4xl font-bold'>Speech to text app</h2>
        <p className='my-3'>This is sppech to text application and summarize with Ai</p>
        <div className="main-content mt-3">
          <div className=' mx-auto drop-shadow-md flex flex-col justify-between  w-[800px] h-[500px]'>
            <div className='my-5 flex justify-between'>
              <button className="btn btn-success" onClick={listeningStart} disabled={listening ? true : false}>
                {
                  (listening == true) ? (<><span className="loading loading-ring loading-lg text-error"></span> Listening</>) : <span>Start Listening</span>
                }

              </button>
              <button className="btn btn-error" onClick={listeningStop} >Stop Listening</button>
              <button className="btn btn-info" onClick={setCopied}>{isCopied ? "Copied! 👍" : "Copy Text"}</button>
              <div className="dropdown dropdown-top">
                <div tabIndex={0} role="button" className="btn btn-warning">Translate</div>
                <ul tabIndex={0} className="dropdown-content mb-1 z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                  <li><a onClick={ () => handleTranslate('urdu')}>Translate to Urdu</a></li>
                  <li><a  onClick={ () => handleTranslate('english')}>Translate to English</a></li>
                </ul>
              </div>
              <button className="btn btn-primary" onClick={handleSummarize}>Summarize Ai</button>
              <button className='btn btn-warning' onClick={handleSpeak}>Speak</button>
            </div>
            <div className='bg-slate-200 text-box mb-2 border-2 min-h-[400px] text-left p-5 overflow-y-scroll'>
              <p>{transcript}</p>
            </div>
            <p className='mt-3'>
              {
                response && response
              }
            </p>


          </div>

        </div>
      </div>
    </>
  )
}

export default App
