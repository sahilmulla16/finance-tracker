package com.sahilmulla.pocketflow.voice

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.Locale

class PocketflowVoiceModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), RecognitionListener {

    private var speechRecognizer: SpeechRecognizer? = null
    private val mainHandler = Handler(Looper.getMainLooper())
    private var isListening = false

    override fun getName(): String = "PocketflowVoice"

    private fun sendEvent(eventName: String, params: WritableMap?) {
        if (reactContext.hasActiveReactInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                ?.emit(eventName, params)
        }
    }

    @ReactMethod
    fun isAvailable(promise: Promise) {
        try {
            val available = SpeechRecognizer.isRecognitionAvailable(reactContext)
            promise.resolve(available)
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun startSpeech(localeString: String?, promise: Promise) {
        mainHandler.post {
            try {
                if (speechRecognizer != null) {
                    try {
                        speechRecognizer?.cancel()
                        speechRecognizer?.destroy()
                    } catch (_: Exception) {}
                    speechRecognizer = null
                }

                speechRecognizer = SpeechRecognizer.createSpeechRecognizer(reactContext).apply {
                    setRecognitionListener(this@PocketflowVoiceModule)
                }

                val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                    putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5)
                    val loc = if (!localeString.isNullOrBlank()) localeString else Locale.getDefault().toLanguageTag()
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE, loc)
                    putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, reactContext.packageName)
                    putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 4000L)
                    putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 4000L)
                    putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 1500L)
                }

                speechRecognizer?.startListening(intent)
                isListening = true
                promise.resolve(true)
            } catch (e: Exception) {
                isListening = false
                promise.reject("SPEECH_START_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun stopSpeech(promise: Promise) {
        mainHandler.post {
            try {
                if (isListening && speechRecognizer != null) {
                    speechRecognizer?.stopListening()
                }
                isListening = false
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("SPEECH_STOP_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun cancelSpeech(promise: Promise) {
        mainHandler.post {
            try {
                if (speechRecognizer != null) {
                    speechRecognizer?.cancel()
                }
                isListening = false
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("SPEECH_CANCEL_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun destroySpeech(promise: Promise) {
        mainHandler.post {
            try {
                if (speechRecognizer != null) {
                    speechRecognizer?.destroy()
                    speechRecognizer = null
                }
                isListening = false
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("SPEECH_DESTROY_ERROR", e.message, e)
            }
        }
    }

    // RecognitionListener Callbacks
    override fun onReadyForSpeech(params: Bundle?) {
        val map = Arguments.createMap()
        map.putBoolean("ready", true)
        sendEvent("onSpeechStart", map)
    }

    override fun onBeginningOfSpeech() {
        val map = Arguments.createMap()
        map.putBoolean("speaking", true)
        sendEvent("onSpeechSpeaking", map)
    }

    override fun onRmsChanged(rmsdB: Float) {
        val map = Arguments.createMap()
        map.putDouble("rms", rmsdB.toDouble())
        sendEvent("onSpeechVolumeChanged", map)
    }

    override fun onBufferReceived(buffer: ByteArray?) {}

    override fun onEndOfSpeech() {
        isListening = false
        val map = Arguments.createMap()
        map.putBoolean("ended", true)
        sendEvent("onSpeechEnd", map)
    }

    override fun onError(error: Int) {
        isListening = false
        val map = Arguments.createMap()
        map.putInt("code", error)
        val message = when (error) {
            SpeechRecognizer.ERROR_AUDIO -> "Audio recording error"
            SpeechRecognizer.ERROR_CLIENT -> "Client side error"
            SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Insufficient permissions"
            SpeechRecognizer.ERROR_NETWORK -> "Network error"
            SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network timeout"
            SpeechRecognizer.ERROR_NO_MATCH -> "No speech match found"
            SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Recognition service busy"
            SpeechRecognizer.ERROR_SERVER -> "Server error"
            SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "No speech input detected"
            else -> "Speech recognition error: $error"
        }
        map.putString("message", message)
        sendEvent("onSpeechError", map)
    }

    override fun onResults(results: Bundle?) {
        isListening = false
        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        val map = Arguments.createMap()
        val array = Arguments.createArray()
        if (matches != null) {
            for (match in matches) {
                array.pushString(match)
            }
        }
        map.putArray("results", array)
        map.putString("text", matches?.firstOrNull() ?: "")
        sendEvent("onSpeechResults", map)
    }

    override fun onPartialResults(partialResults: Bundle?) {
        val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        val text = matches?.firstOrNull() ?: ""
        if (text.isNotBlank()) {
            val map = Arguments.createMap()
            map.putString("partialText", text)
            sendEvent("onSpeechPartialResults", map)
        }
    }

    override fun onEvent(eventType: Int, params: Bundle?) {}
}

