import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import Base64 from 'base64-js';
import MarkdownIt from 'markdown-it';
import { maybeShowApiKeyBanner } from './gemini-api-banner';
import './style.css';

var sessButton = document.getElementById("sessionButton");
let sessStarted = false;
let captureIntervalID = null; // Store the interval ID
let timeIntervalID = null;
let time = 0;

sessButton.addEventListener("click", () => {
  console.log("Button clicked!");
  
  if (!sessStarted) {
    sessButton.textContent = "stop"; 
    // captureIntervalID = setInterval(captureImage, 10000);
    time = 0;
    timeIntervalID = setInterval(timerFunc, 1000);
  } else {
    sessButton.textContent = "start a study session";
    clearInterval(captureIntervalID);
    captureIntervalID = null;
    clearInterval(timeIntervalID);
    timeIntervalID = null;
    document.getElementById("timer").innerHTML = "";
  }

  sessStarted = !sessStarted;
});

function timerFunc() {
  time ++;
  document.getElementById("timer").innerHTML = "" + time;
  console.log(time);

  let hours = Math.floor(time / 3600);
  let minutes = Math.floor((time % 3600) / 60);
  let seconds = time % 60;

  let formattedTime = "";

  if (hours > 0) {
    formattedTime = 
      String(hours).padStart(2, '0') + ":" +
      String(minutes).padStart(2, '0') + ":" +
      String(seconds).padStart(2, '0');
  } else {
    formattedTime =
      String(minutes).padStart(2, '0') + ":" +
      String(seconds).padStart(2, '0');
  }

  document.getElementById("timer").innerHTML = formattedTime;
}


async function getWebCam() {
  try{
    const videoSrc=await navigator.mediaDevices.getUserMedia({ video: true });
    var video=document.getElementById("video");
    video.srcObject=videoSrc;
  } catch(e) {
    console.log(e);
  }
}

getWebCam(); 

function captureImage() {
  console.log("Snapping a picture!")
  const canvas = document.createElement("canvas");
  var context=canvas.getContext('2d');
  var video = document.getElementById("video");
  canvas.width=video.videoWidth;
  canvas.height=video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  var image=canvas.toDataURL('image/jpeg');
  analyzeImage(image);
}

let API_KEY = 'AIzaSyCrjkiCTgZfQp-BYIdPsXC6g6PajzXTYRc';
let output = document.querySelector('.output');
let isPersonOnPhone = false;

async function analyzeImage(imageDataURL) {
  try {
    const imageBase64 = imageDataURL.split(',')[1];

    const contents = [
      {
        role: 'user',
        parts: [
          { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } },
          { text: "Is the person in the image on their phone? Enter 0 for no, 1 for yes." }
        ]
      }
    ];

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    });

    const result = await model.generateContentStream({ contents });

    let buffer = [];
    for await (let response of result.stream) {
      buffer.push(response.text());
    }

    const fullText = buffer.join('').trim();

    // Extract and store 0 or 1 as boolean
    const match = fullText.match(/\b[01]\b/);
    isPersonOnPhone = match ? match[0] === "1" : false;
    if (isPersonOnPhone) {
      console.log("Person is on phone!");
      alarm();
    }
  } catch (e) {
    console.error("Error in analyzeImage:", e);
    isPersonOnPhone = false;
  }
}

const alarm_audio = new Audio('media/alarm.mp3');
function alarm() {
  alarm_audio.play();
}